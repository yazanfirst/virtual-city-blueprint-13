import { create } from 'zustand';
import { usePlayerStore } from '@/stores/playerStore';

export type MirrorWorldPhase = 'inactive' | 'briefing' | 'hunting' | 'completed' | 'failed';

export interface RealityAnchor {
  id: string;
  position: [number, number, number];
  isCollected: boolean;
}

type FailReason = 'time' | 'caught';

interface MirrorWorldState {
  isActive: boolean;
  phase: MirrorWorldPhase;
  timeRemaining: number;
  shadowPosition: [number, number, number];
  shadowSpeed: number;
  anchors: RealityAnchor[];
  collectedCount: number;
  requiredAnchors: number;
  playerLives: number;
  isProtected: boolean;
  difficultyLevel: number;
  failReason: FailReason | null;
  startMission: () => void;
  completeBriefing: () => void;
  updateTimer: (delta: number) => void;
  collectAnchor: (anchorId: string) => void;
  updateShadowPosition: (pos: [number, number, number]) => void;
  hitByShadow: () => void;
  completeMission: () => void;
  failMission: (reason: FailReason) => void;
  resetMission: () => void;
}

const ANCHOR_POSITIONS: [number, number, number][] = [
  [15, 8, 35],
  [-15, 8, 22],
  [45, 8, 12],
  [-32, 8, -12],
  [0, 8, -48],
];

const BASE_SHADOW_SPEED = 0.5;
const START_LIVES = 2;
const START_TIME = 60;
const PROTECTION_DURATION = 3000;
const HIT_INVINCIBILITY = 2000;

let protectionTimeout: ReturnType<typeof setTimeout> | null = null;
let hitTimeout: ReturnType<typeof setTimeout> | null = null;

const createAnchors = (): RealityAnchor[] =>
  ANCHOR_POSITIONS.map((position, index) => ({
    id: `mirror-anchor-${index + 1}`,
    position,
    isCollected: false,
  }));

const clearTimeoutSafely = (timeout: ReturnType<typeof setTimeout> | null) => {
  if (timeout) {
    clearTimeout(timeout);
  }
};

export const useMirrorWorldStore = create<MirrorWorldState>((set, get) => ({
  isActive: false,
  phase: 'inactive',
  timeRemaining: START_TIME,
  shadowPosition: [0, 8, 30],
  shadowSpeed: BASE_SHADOW_SPEED,
  anchors: createAnchors(),
  collectedCount: 0,
  requiredAnchors: 5,
  playerLives: START_LIVES,
  isProtected: false,
  difficultyLevel: 1,
  failReason: null,

  startMission: () => {
    clearTimeoutSafely(protectionTimeout);
    clearTimeoutSafely(hitTimeout);
    const playerPosition = usePlayerStore.getState().position;
    protectionTimeout = setTimeout(() => {
      set({ isProtected: false });
    }, PROTECTION_DURATION);

    set({
      isActive: true,
      phase: 'briefing',
      timeRemaining: START_TIME,
      shadowPosition: [playerPosition[0] - 6, playerPosition[1] + 1, playerPosition[2] - 6],
      shadowSpeed: BASE_SHADOW_SPEED,
      anchors: createAnchors(),
      collectedCount: 0,
      playerLives: START_LIVES,
      isProtected: true,
      failReason: null,
    });
  },

  completeBriefing: () => set({ phase: 'hunting' }),

  updateTimer: (delta) => {
    const { timeRemaining, phase } = get();
    if (phase !== 'hunting') return;
    const nextTime = Math.max(0, timeRemaining - delta);
    if (nextTime <= 0) {
      get().failMission('time');
      return;
    }
    set({ timeRemaining: nextTime });
  },

  collectAnchor: (anchorId) => {
    const { anchors, collectedCount, requiredAnchors } = get();
    const nextAnchors = anchors.map((anchor) =>
      anchor.id === anchorId ? { ...anchor, isCollected: true } : anchor
    );
    const nextCollectedCount = collectedCount + 1;
    const nextSpeed = BASE_SHADOW_SPEED * (1 + nextCollectedCount * 0.1);

    if (nextCollectedCount >= requiredAnchors) {
      set({
        anchors: nextAnchors,
        collectedCount: nextCollectedCount,
        shadowSpeed: nextSpeed,
      });
      get().completeMission();
      return;
    }

    set({
      anchors: nextAnchors,
      collectedCount: nextCollectedCount,
      shadowSpeed: nextSpeed,
    });
  },

  updateShadowPosition: (pos) => set({ shadowPosition: pos }),

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

  completeMission: () => set({ phase: 'completed', isActive: true }),

  failMission: (reason) => set({ phase: 'failed', isActive: true, failReason: reason }),

  resetMission: () => {
    clearTimeoutSafely(protectionTimeout);
    clearTimeoutSafely(hitTimeout);
    set({
      isActive: false,
      phase: 'inactive',
      timeRemaining: START_TIME,
      shadowPosition: [0, 8, 30],
      shadowSpeed: BASE_SHADOW_SPEED,
      anchors: createAnchors(),
      collectedCount: 0,
      playerLives: START_LIVES,
      isProtected: false,
      failReason: null,
    });
  },
}));
