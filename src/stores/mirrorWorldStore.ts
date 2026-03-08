import { create } from 'zustand';
import { usePlayerStore } from '@/stores/playerStore';
import { getMirrorWorldLevelConfig } from '@/lib/missionLevels';

export type MirrorWorldPhase = 'inactive' | 'briefing' | 'hunting' | 'completed' | 'failed';

export interface RealityAnchor {
  id: string;
  position: [number, number, number];
  isCollected: boolean;
  location: 'shop' | 'rooftop';
  shopId?: string;
}

type FailReason = 'time' | 'caught';

interface MirrorWorldState {
  isActive: boolean;
  phase: MirrorWorldPhase;
  timeRemaining: number;
  shadowPositions: [number, number, number][];
  shadowCount: number;
  shadowSpeed: number;
  collisionDistance: number;
  anchorTimeBonus: number;
  anchors: RealityAnchor[];
  collectedCount: number;
  requiredAnchors: number;
  playerLives: number;
  isProtected: boolean;
  difficultyLevel: number;
  unlockedLevel: number;
  maxLevel: number;
  toastMessage: string | null;
  failReason: FailReason | null;
  isPaused: boolean;
  startMission: (shopPositions?: ShopPositionInfo[]) => void;
  completeBriefing: () => void;
  updateTimer: (delta: number) => void;
  collectAnchor: (anchorId: string) => void;
  updateShadowPosition: (index: number, pos: [number, number, number]) => void;
  hitByShadow: () => void;
  completeMission: () => void;
  failMission: (reason: FailReason) => void;
  resetMission: () => void;
  setPaused: (paused: boolean) => void;
  unlockNextLevel: () => void;
  setDifficultyLevel: (level: number) => void;
  resetProgress: () => void;
}

// Fallback rooftop positions when no shop data is available
const FALLBACK_ROOFTOP_POSITIONS: [number, number, number][] = [
  [18, 8, 40],
  [-18, 8, 28],
  [47, 8, 18],
  [-35, 8, -18],
  [18, 8, -40],
];

const BASE_SHADOW_SPEED = 0.5;
const START_LIVES = 2;
const START_TIME = 100;
const ANCHOR_TIME_BONUS = 8;
const DEFAULT_COLLISION_DISTANCE = 2;
const MAX_MIRROR_LEVEL = 5;
const PROTECTION_DURATION = 3000;
const HIT_INVINCIBILITY = 2000;

// Distributed spawn offsets for multiple shadows (relative to player)
const SHADOW_SPAWN_OFFSETS: [number, number, number][] = [
  [-6, 1, -6],
  [8, 1, 6],
  [-8, 1, 8],
];

let protectionTimeout: ReturnType<typeof setTimeout> | null = null;
let hitTimeout: ReturnType<typeof setTimeout> | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

// Fisher-Yates shuffle
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export interface ShopPositionInfo {
  x: number;
  z: number;
  rotation: number;
  hasActiveShop: boolean;
  shopId?: string;
}

const createAnchors = (requiredCount: number, shopPositions?: ShopPositionInfo[]): RealityAnchor[] => {
  if (!shopPositions || shopPositions.length === 0) {
    const shuffled = shuffle(FALLBACK_ROOFTOP_POSITIONS);
    return shuffled.slice(0, requiredCount).map((pos, index) => ({
      id: `mirror-anchor-${index + 1}`,
      position: pos,
      isCollected: false,
      location: 'rooftop' as const,
    }));
  }

  // Separate active shops (with shopId) and inactive/empty spots
  const activeShops = shopPositions.filter(s => s.hasActiveShop && s.shopId);
  const inactiveSpots = shopPositions.filter(s => !s.hasActiveShop);

  // Shuffle both pools
  const shuffledActive = shuffle(activeShops);
  const shuffledInactive = shuffle(inactiveSpots);

  // Distribute: ~half to active shops, rest to rooftops
  const fromShopsCount = Math.min(
    Math.max(1, Math.ceil(requiredCount / 2)),
    shuffledActive.length
  );
  const fromRoofCount = Math.min(requiredCount - fromShopsCount, shuffledInactive.length);
  const extraNeeded = requiredCount - fromShopsCount - fromRoofCount;

  const anchors: RealityAnchor[] = [];

  // Shop anchors — position stored as shop exterior position for minimap,
  // but they render INSIDE the shop interior (ShopInteriorRoom handles that)
  for (let i = 0; i < fromShopsCount; i++) {
    const s = shuffledActive[i];
    anchors.push({
      id: `mirror-anchor-${anchors.length + 1}`,
      position: [s.x, 1.5, s.z],
      isCollected: false,
      location: 'shop',
      shopId: s.shopId,
    });
  }

  // Rooftop anchors on inactive spots
  for (let i = 0; i < fromRoofCount; i++) {
    const s = shuffledInactive[i];
    anchors.push({
      id: `mirror-anchor-${anchors.length + 1}`,
      position: [s.x, 8, s.z],
      isCollected: false,
      location: 'rooftop',
    });
  }

  // Fill extra from whichever pool has remaining
  if (extraNeeded > 0) {
    const remainingActive = shuffledActive.slice(fromShopsCount);
    const remainingInactive = shuffledInactive.slice(fromRoofCount);
    const extras = [...remainingActive, ...remainingInactive];
    for (let i = 0; i < extraNeeded && i < extras.length; i++) {
      const s = extras[i];
      const isActive = activeShops.includes(s);
      anchors.push({
        id: `mirror-anchor-${anchors.length + 1}`,
        position: [s.x, isActive ? 1.5 : 8, s.z],
        isCollected: false,
        location: isActive ? 'shop' : 'rooftop',
        shopId: isActive ? s.shopId : undefined,
      });
    }
  }

  // Shuffle final order
  return shuffle(anchors).slice(0, requiredCount);
};

const clearTimeoutSafely = (timeout: ReturnType<typeof setTimeout> | null) => {
  if (timeout) clearTimeout(timeout);
};

export const useMirrorWorldStore = create<MirrorWorldState>((set, get) => ({
  isActive: false,
  phase: 'inactive',
  timeRemaining: START_TIME,
  shadowPositions: [[0, 8, 30]],
  shadowCount: 1,
  shadowSpeed: BASE_SHADOW_SPEED,
  collisionDistance: DEFAULT_COLLISION_DISTANCE,
  anchorTimeBonus: ANCHOR_TIME_BONUS,
  anchors: [],
  collectedCount: 0,
  requiredAnchors: 5,
  playerLives: START_LIVES,
  isProtected: false,
  difficultyLevel: 1,
  unlockedLevel: 1,
  maxLevel: MAX_MIRROR_LEVEL,
  toastMessage: null,
  failReason: null,
  isPaused: false,

  startMission: (shopPositions) => {
    clearTimeoutSafely(protectionTimeout);
    clearTimeoutSafely(hitTimeout);
    const playerPosition = usePlayerStore.getState().position;
    const levelConfig = getMirrorWorldLevelConfig(get().difficultyLevel);
    protectionTimeout = setTimeout(() => {
      set({ isProtected: false });
    }, PROTECTION_DURATION);

    const initialShadowPositions: [number, number, number][] = [];
    for (let i = 0; i < levelConfig.shadowCount; i++) {
      const offset = SHADOW_SPAWN_OFFSETS[i] || SHADOW_SPAWN_OFFSETS[0];
      initialShadowPositions.push([
        playerPosition[0] + offset[0],
        playerPosition[1] + offset[1],
        playerPosition[2] + offset[2],
      ]);
    }

    set({
      isActive: true,
      phase: 'briefing',
      timeRemaining: levelConfig.baseTime,
      shadowPositions: initialShadowPositions,
      shadowCount: levelConfig.shadowCount,
      shadowSpeed: levelConfig.shadowSpeed,
      collisionDistance: levelConfig.collisionDistance,
      anchorTimeBonus: levelConfig.anchorBonus,
      anchors: createAnchors(levelConfig.requiredAnchors, shopPositions),
      collectedCount: 0,
      requiredAnchors: levelConfig.requiredAnchors,
      playerLives: levelConfig.lives,
      isProtected: true,
      toastMessage: null,
      failReason: null,
      isPaused: false,
    });
  },

  completeBriefing: () => set({ phase: 'hunting' }),

  updateTimer: (delta) => {
    const { timeRemaining, phase, isPaused } = get();
    if (phase !== 'hunting' || isPaused) return;
    const nextTime = Math.max(0, timeRemaining - delta);
    if (nextTime <= 0) {
      get().failMission('time');
      return;
    }
    set({ timeRemaining: nextTime });
  },

  collectAnchor: (anchorId) => {
    const { anchors, collectedCount, requiredAnchors, anchorTimeBonus } = get();
    const targetAnchor = anchors.find((anchor) => anchor.id === anchorId);
    if (!targetAnchor || targetAnchor.isCollected) return;
    if (toastTimeout) clearTimeout(toastTimeout);

    const nextAnchors = anchors.map((anchor) =>
      anchor.id === anchorId ? { ...anchor, isCollected: true } : anchor
    );
    const nextCollectedCount = collectedCount + 1;
    const nextTime = Math.max(0, get().timeRemaining + anchorTimeBonus);

    if (nextCollectedCount >= requiredAnchors) {
      set({
        anchors: nextAnchors,
        collectedCount: nextCollectedCount,
        timeRemaining: nextTime,
        toastMessage: `Reality Anchor collected! +${anchorTimeBonus}s`,
      });
      toastTimeout = setTimeout(() => set({ toastMessage: null }), 2000);
      get().completeMission();
      return;
    }

    set({
      anchors: nextAnchors,
      collectedCount: nextCollectedCount,
      timeRemaining: nextTime,
      toastMessage: `Reality Anchor collected! +${anchorTimeBonus}s`,
    });
    toastTimeout = setTimeout(() => set({ toastMessage: null }), 2000);
  },

  updateShadowPosition: (index, pos) =>
    set((state) => {
      const newPositions = [...state.shadowPositions];
      newPositions[index] = pos;
      return { shadowPositions: newPositions };
    }),

  hitByShadow: () => {
    const { isProtected, playerLives, phase } = get();
    if (phase !== 'hunting' || isProtected) return;
    const nextLives = playerLives - 1;
    if (nextLives <= 0) {
      get().failMission('caught');
      return;
    }
    clearTimeoutSafely(hitTimeout);
    hitTimeout = setTimeout(() => set({ isProtected: false }), HIT_INVINCIBILITY);
    set({ playerLives: nextLives, isProtected: true });
  },

  completeMission: () => {
    set({ phase: 'completed', isActive: true });
    get().unlockNextLevel();
  },

  failMission: (reason) => set({ phase: 'failed', isActive: true, failReason: reason }),

  resetMission: () => {
    clearTimeoutSafely(protectionTimeout);
    clearTimeoutSafely(hitTimeout);
    clearTimeoutSafely(toastTimeout);
    const levelConfig = getMirrorWorldLevelConfig(get().difficultyLevel);
    set({
      isActive: false,
      phase: 'inactive',
      timeRemaining: levelConfig.baseTime,
      shadowPositions: [[0, 8, 30]],
      shadowCount: levelConfig.shadowCount,
      shadowSpeed: levelConfig.shadowSpeed,
      collisionDistance: levelConfig.collisionDistance,
      anchorTimeBonus: levelConfig.anchorBonus,
      anchors: [],
      collectedCount: 0,
      requiredAnchors: levelConfig.requiredAnchors,
      playerLives: levelConfig.lives,
      isProtected: false,
      toastMessage: null,
      failReason: null,
      isPaused: false,
    });
  },

  setPaused: (paused) => set({ isPaused: paused }),

  unlockNextLevel: () => {
    const state = get();
    if (state.unlockedLevel >= state.maxLevel) return;
    if (state.difficultyLevel !== state.unlockedLevel) return;
    set({ unlockedLevel: state.unlockedLevel + 1 });
  },

  setDifficultyLevel: (level) => {
    const state = get();
    const nextLevel = Math.max(1, Math.min(level, state.unlockedLevel));
    set({ difficultyLevel: nextLevel });
  },

  resetProgress: () => set({ difficultyLevel: 1, unlockedLevel: 1 }),
}));
