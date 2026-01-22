import { create } from 'zustand';
import { usePlayerStore } from '@/stores/playerStore';

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
  shadowPosition: [number, number, number];
  shadowSpeed: number;
  anchors: RealityAnchor[];
  collectedCount: number;
  requiredAnchors: number;
  playerLives: number;
  isProtected: boolean;
  difficultyLevel: number;
  promptMessage: string | null;
  promptKey: string | null;
  promptAnchorId: string | null;
  toastMessage: string | null;
  failReason: FailReason | null;
  startMission: () => void;
  completeBriefing: () => void;
  updateTimer: (delta: number) => void;
  collectAnchor: (anchorId: string) => void;
  updateShadowPosition: (pos: [number, number, number]) => void;
  updateAnchorPosition: (anchorId: string, position: [number, number, number]) => void;
  updateAnchorState: (anchorId: string, updates: Partial<RealityAnchor>) => void;
  setPrompt: (anchorId: string, message: string, key?: string | null) => void;
  clearPrompt: (anchorId?: string) => void;
  hitByShadow: () => void;
  completeMission: () => void;
  failMission: (reason: FailReason) => void;
  resetMission: () => void;
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
const PROTECTION_DURATION = 3000;
const HIT_INVINCIBILITY = 2000;

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
  shadowPosition: [0, 8, 30],
  shadowSpeed: BASE_SHADOW_SPEED,
  anchors: createAnchors(),
  collectedCount: 0,
  requiredAnchors: 5,
  playerLives: START_LIVES,
  isProtected: false,
  difficultyLevel: 1,
  promptMessage: null,
  promptKey: null,
  promptAnchorId: null,
  toastMessage: null,
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
      promptMessage: null,
      promptKey: null,
      promptAnchorId: null,
      toastMessage: null,
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
    const targetAnchor = anchors.find((anchor) => anchor.id === anchorId);
    if (!targetAnchor || targetAnchor.isCollected) return;
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    const nextAnchors = anchors.map((anchor) =>
      anchor.id === anchorId ? { ...anchor, isCollected: true } : anchor
    );
    const nextCollectedCount = collectedCount + 1;
    const nextTime = Math.max(0, get().timeRemaining + ANCHOR_TIME_BONUS);

    if (nextCollectedCount >= requiredAnchors) {
      set({
        anchors: nextAnchors,
        collectedCount: nextCollectedCount,
        timeRemaining: nextTime,
        promptAnchorId: null,
        promptMessage: null,
        promptKey: null,
        toastMessage: `Reality Anchor collected! +${ANCHOR_TIME_BONUS}s`,
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
      toastMessage: `Reality Anchor collected! +${ANCHOR_TIME_BONUS}s`,
    });
    toastTimeout = setTimeout(() => {
      set({ toastMessage: null });
    }, 2000);
  },

  updateShadowPosition: (pos) => set({ shadowPosition: pos }),

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

  completeMission: () => set({ phase: 'completed', isActive: true }),

  failMission: (reason) => set({ phase: 'failed', isActive: true, failReason: reason }),

  resetMission: () => {
    clearTimeoutSafely(protectionTimeout);
    clearTimeoutSafely(hitTimeout);
    clearTimeoutSafely(toastTimeout);
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
      promptMessage: null,
      promptKey: null,
      promptAnchorId: null,
      toastMessage: null,
      failReason: null,
    });
  },
}));
