import { create } from 'zustand';
import { ShopBranding } from '@/hooks/use3DShops';
import {
  EligibleShop,
  Clue,
  IndicatorData,
  createSeededRandom,
  getSessionSeed,
  selectTargetShop,
  calculateBoxPosition,
  generateClues,
  generateIndicators,
} from '@/lib/mission';
import { useGameStore } from './gameStore';

type MissionState = {
  // Session
  sessionSeed: number;
  missionActive: boolean;
  missionInitialized: boolean;

  // Target
  targetShopId: string | null;
  targetShopBranding: ShopBranding | null;
  boxPosition: [number, number, number] | null;

  // Clues
  clues: Clue[];
  revealedClues: number[];

  // Indicators
  indicators: IndicatorData[];

  // Progress
  attemptsUsed: number;
  maxAttempts: number;
  missionComplete: boolean;
  missionSuccess: boolean;

  // Environment
  environmentMode: 'day' | 'night';

  // Actions
  initMission: (eligibleShops: EligibleShop[]) => void;
  revealClue: (clueIndex: number) => void;
  attemptBox: (shopId: string) => { success: boolean; message: string };
  completeMission: (success: boolean) => void;
  resetMission: () => void;
  setEnvironmentMode: (mode: 'day' | 'night') => void;
};

export const useMissionStore = create<MissionState>((set, get) => ({
  sessionSeed: 0,
  missionActive: false,
  missionInitialized: false,

  targetShopId: null,
  targetShopBranding: null,
  boxPosition: null,

  clues: [],
  revealedClues: [],

  indicators: [],

  attemptsUsed: 0,
  maxAttempts: 3,
  missionComplete: false,
  missionSuccess: false,

  environmentMode: 'day',

  initMission: (eligibleShops: EligibleShop[]) => {
    const state = get();
    
    // Don't reinitialize if already done this session
    if (state.missionInitialized) return;
    
    // Need at least one eligible shop
    if (eligibleShops.length === 0) {
      console.log('No eligible shops for mission');
      return;
    }

    const seed = getSessionSeed();
    const random = createSeededRandom(seed);

    // Get visited shops from game store
    const shopsVisited = useGameStore.getState().shopsVisited;

    // Select target shop
    const targetShop = selectTargetShop(eligibleShops, shopsVisited, random);

    // Calculate box position
    const boxPos = calculateBoxPosition(targetShop.position3d, random);

    // Generate clues
    const clues = generateClues(targetShop, eligibleShops, random);

    // Generate indicators
    const indicators = generateIndicators(targetShop, eligibleShops, random);

    set({
      sessionSeed: seed,
      missionActive: true,
      missionInitialized: true,
      targetShopId: targetShop.shopId,
      targetShopBranding: targetShop.branding,
      boxPosition: boxPos,
      clues,
      revealedClues: [0], // First clue revealed by default
      indicators,
      attemptsUsed: 0,
      missionComplete: false,
      missionSuccess: false,
    });

    console.log('Mission initialized:', {
      targetShop: targetShop.branding.shopName,
      boxPosition: boxPos,
      clueCount: clues.length,
      indicatorCount: indicators.length,
    });
  },

  revealClue: (clueIndex: number) => {
    const state = get();
    if (state.revealedClues.includes(clueIndex)) return;
    
    set({
      revealedClues: [...state.revealedClues, clueIndex],
    });
  },

  attemptBox: (shopId: string) => {
    const state = get();

    if (state.missionComplete) {
      return { success: false, message: 'Mission already completed!' };
    }

    const newAttempts = state.attemptsUsed + 1;
    set({ attemptsUsed: newAttempts });

    if (shopId === state.targetShopId) {
      // Success!
      get().completeMission(true);
      return { success: true, message: 'You found the Mystery Box!' };
    }

    // Wrong shop
    if (newAttempts >= state.maxAttempts) {
      get().completeMission(false);
      return { success: false, message: 'No more attempts! Mission failed.' };
    }

    return {
      success: false,
      message: `Wrong location! ${state.maxAttempts - newAttempts} attempts remaining.`,
    };
  },

  completeMission: (success: boolean) => {
    set({
      missionComplete: true,
      missionSuccess: success,
      missionActive: false,
    });

    // Award rewards on success
    if (success) {
      const gameStore = useGameStore.getState();
      gameStore.addCoins(50);
      gameStore.addXP(100);
    }
  },

  resetMission: () => {
    set({
      missionActive: false,
      missionInitialized: false,
      targetShopId: null,
      targetShopBranding: null,
      boxPosition: null,
      clues: [],
      revealedClues: [],
      indicators: [],
      attemptsUsed: 0,
      missionComplete: false,
      missionSuccess: false,
    });
  },

  setEnvironmentMode: (mode: 'day' | 'night') => {
    set({ environmentMode: mode });
  },
}));
