import { create } from 'zustand';
import { usePlayerStore } from '@/stores/playerStore';
import { getMirrorWorldLevelConfig } from '@/lib/missionLevels';

export type MirrorWorldPhase = 'inactive' | 'briefing' | 'hunting' | 'completed' | 'failed';

export type AnchorType = 'pulse' | 'chase' | 'guardian' | 'riddle' | 'sacrifice';

export interface RealityAnchor {
  id: string;
  position: [number, number, number];
  isCollected: boolean;
  type: AnchorType;
  isVisible?: boolean;
  requiredKey?: string;
  shieldActive?: boolean;
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
  chaseAnchorSpeed: number;
  anchorTimeBonus: number;
  anchors: RealityAnchor[];
  collectedCount: number;
  requiredAnchors: number;
  playerLives: number;
  isProtected: boolean;
  difficultyLevel: number;
  unlockedLevel: number;
  maxLevel: number;
  promptMessage: string | null;
  promptKey: string | null;
  promptAnchorId: string | null;
  toastMessage: string | null;
  failReason: FailReason | null;
  isPaused: boolean;
  startMission: () => void;
  completeBriefing: () => void;
  updateTimer: (delta: number) => void;
  collectAnchor: (anchorId: string) => void;
  updateShadowPosition: (index: number, pos: [number, number, number]) => void;
  updateAnchorPosition: (anchorId: string, position: [number, number, number]) => void;
  updateAnchorState: (anchorId: string, updates: Partial<RealityAnchor>) => void;
  setPrompt: (anchorId: string, message: string, key?: string | null) => void;
  clearPrompt: (anchorId?: string) => void;
  hitByShadow: () => void;
  completeMission: () => void;
  failMission: (reason: FailReason) => void;
  resetMission: () => void;
  setPaused: (paused: boolean) => void;
  unlockNextLevel: () => void;
  setDifficultyLevel: (level: number) => void;
  resetProgress: () => void;
}

const ANCHOR_POSITIONS: [number, number, number][] = [
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
const DEFAULT_CHASE_SPEED = 0.35;
const MAX_MIRROR_LEVEL = 5;
const PROTECTION_DURATION = 3000;
const HIT_INVINCIBILITY = 2000;

// Distributed spawn offsets for multiple shadows (relative to player)
const SHADOW_SPAWN_OFFSETS: [number, number, number][] = [
  [-6, 1, -6],   // Primary shadow (SW)
  [8, 1, 6],    // Second shadow (NE) 
  [-8, 1, 8],   // Third shadow (NW)
];

let protectionTimeout: ReturnType<typeof setTimeout> | null = null;
let hitTimeout: ReturnType<typeof setTimeout> | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const createAnchors = (): RealityAnchor[] =>
  ANCHOR_POSITIONS.map((position, index) => {
    const types: AnchorType[] = ['pulse', 'chase', 'guardian', 'riddle', 'sacrifice'];
    const type = types[index % types.length];
    const requiredKey = type === 'riddle' ? ['E', 'Q', 'Space'][index % 3] : undefined;
    return {
      id: `mirror-anchor-${index + 1}`,
      position,
      isCollected: false,
      type,
      isVisible: type === 'pulse' ? true : undefined,
      requiredKey,
      shieldActive: type === 'sacrifice' ? true : undefined,
    };
  });

const clearTimeoutSafely = (timeout: ReturnType<typeof setTimeout> | null) => {
  if (timeout) {
    clearTimeout(timeout);
  }
};

export const useMirrorWorldStore = create<MirrorWorldState>((set, get) => ({
  isActive: false,
  phase: 'inactive',
  timeRemaining: START_TIME,
  shadowPositions: [[0, 8, 30]],
  shadowCount: 1,
  shadowSpeed: BASE_SHADOW_SPEED,
  collisionDistance: DEFAULT_COLLISION_DISTANCE,
  chaseAnchorSpeed: DEFAULT_CHASE_SPEED,
  anchorTimeBonus: ANCHOR_TIME_BONUS,
  anchors: createAnchors(),
  collectedCount: 0,
  requiredAnchors: 5,
  playerLives: START_LIVES,
  isProtected: false,
  difficultyLevel: 1,
  unlockedLevel: 1,
  maxLevel: MAX_MIRROR_LEVEL,
  promptMessage: null,
  promptKey: null,
  promptAnchorId: null,
  toastMessage: null,
  failReason: null,
  isPaused: false,

  startMission: () => {
    clearTimeoutSafely(protectionTimeout);
    clearTimeoutSafely(hitTimeout);
    const playerPosition = usePlayerStore.getState().position;
    const levelConfig = getMirrorWorldLevelConfig(get().difficultyLevel);
    protectionTimeout = setTimeout(() => {
      set({ isProtected: false });
    }, PROTECTION_DURATION);

    // Create distributed shadow spawn positions
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
      chaseAnchorSpeed: levelConfig.chaseAnchorSpeed,
      anchorTimeBonus: levelConfig.anchorBonus,
      anchors: createAnchors(),
      collectedCount: 0,
      requiredAnchors: levelConfig.requiredAnchors,
      playerLives: levelConfig.lives,
      isProtected: true,
      promptMessage: null,
      promptKey: null,
      promptAnchorId: null,
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
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
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
        promptAnchorId: null,
        promptMessage: null,
        promptKey: null,
        toastMessage: `Reality Anchor collected! +${anchorTimeBonus}s`,
      });
      toastTimeout = setTimeout(() => {
        set({ toastMessage: null });
      }, 2000);
      get().completeMission();
      return;
    }

    set({
      anchors: nextAnchors,
      collectedCount: nextCollectedCount,
      timeRemaining: nextTime,
      promptAnchorId: null,
      promptMessage: null,
      promptKey: null,
        toastMessage: `Reality Anchor collected! +${anchorTimeBonus}s`,
    });
    toastTimeout = setTimeout(() => {
      set({ toastMessage: null });
    }, 2000);
  },

  updateShadowPosition: (index, pos) =>
    set((state) => {
      const newPositions = [...state.shadowPositions];
      newPositions[index] = pos;
      return { shadowPositions: newPositions };
    }),

  updateAnchorPosition: (anchorId, position) =>
    set((state) => ({
      anchors: state.anchors.map((anchor) =>
        anchor.id === anchorId ? { ...anchor, position } : anchor
      ),
    })),

  updateAnchorState: (anchorId, updates) =>
    set((state) => ({
      anchors: state.anchors.map((anchor) =>
        anchor.id === anchorId ? { ...anchor, ...updates } : anchor
      ),
    })),

  setPrompt: (anchorId, message, key = null) =>
    set({ promptAnchorId: anchorId, promptMessage: message, promptKey: key }),

  clearPrompt: (anchorId) =>
    set((state) => {
      if (anchorId && state.promptAnchorId !== anchorId) return state;
      return { promptAnchorId: null, promptMessage: null, promptKey: null };
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
    hitTimeout = setTimeout(() => {
      set({ isProtected: false });
    }, HIT_INVINCIBILITY);

    set({
      playerLives: nextLives,
      isProtected: true,
    });
  },

  completeMission: () => {
    set({
      phase: 'completed',
      isActive: true,
    });
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
      chaseAnchorSpeed: levelConfig.chaseAnchorSpeed,
      anchorTimeBonus: levelConfig.anchorBonus,
      anchors: createAnchors(),
      collectedCount: 0,
      requiredAnchors: levelConfig.requiredAnchors,
      playerLives: levelConfig.lives,
      isProtected: false,
      promptMessage: null,
      promptKey: null,
      promptAnchorId: null,
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
  resetProgress: () => {
    set({ difficultyLevel: 1, unlockedLevel: 1 });
  },
}));
