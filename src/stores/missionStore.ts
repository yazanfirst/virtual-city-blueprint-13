import { create } from 'zustand';
import { ShopBranding } from '@/hooks/use3DShops';
import {
  EligibleShop,
  IndicatorData,
  createSeededRandom,
  getSessionSeed,
  selectTargetShop,
  calculateBoxPosition,
} from '@/lib/mission';
import { generateClues, Clue } from '@/lib/mission/clueGenerator';
import { generateIndicators } from '@/lib/mission/indicatorGenerator';
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

  // Progress - box attempts (deprecated, kept for compatibility)
  attemptsUsed: number;
  maxAttempts: number;
  
  // Shop visit tracking (NEW)
  shopsEnteredThisMission: string[];
  maxShopVisits: number;
  
  // Mission state
  missionComplete: boolean;
  missionSuccess: boolean;
  missionFailed: boolean;

  // Environment
  environmentMode: 'day' | 'night';

  // Actions
  initMission: (eligibleShops: EligibleShop[]) => void;
  revealClue: (clueIndex: number) => void;
  attemptBox: (shopId: string) => { success: boolean; message: string };
  enterShop: (shopId: string) => { allowed: boolean; isTarget: boolean; message: string; visitsLeft: number };
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
  
  // Shop visit tracking
  shopsEnteredThisMission: [],
  maxShopVisits: 3,
  
  missionComplete: false,
  missionSuccess: false,
  missionFailed: false,

  environmentMode: 'day',

  initMission: async (eligibleShops: EligibleShop[]) => {
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

    // Generate evidence-based clues (async)
    const clues = await generateClues(targetShop, eligibleShops, random);

    // Generate indicators with session-based preset
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
      shopsEnteredThisMission: [],
      missionComplete: false,
      missionSuccess: false,
      missionFailed: false,
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

  // New shop entry action - tracks visits and determines outcome
  enterShop: (shopId: string) => {
    const state = get();

    // If mission already complete/failed, allow entry but no mission impact
    if (state.missionComplete || state.missionFailed || !state.missionActive) {
      return { 
        allowed: true, 
        isTarget: false, 
        message: 'Mission not active - browsing mode.',
        visitsLeft: 0,
      };
    }

    // Check if this is the target shop
    if (shopId === state.targetShopId) {
      // SUCCESS! Player found the correct shop
      get().completeMission(true);
      return { 
        allowed: true, 
        isTarget: true, 
        message: 'You found the Mystery Box!',
        visitsLeft: state.maxShopVisits,
      };
    }

    // Check if already visited this shop (don't count twice)
    if (state.shopsEnteredThisMission.includes(shopId)) {
      return { 
        allowed: true, 
        isTarget: false, 
        message: 'You already visited this shop.',
        visitsLeft: state.maxShopVisits - state.shopsEnteredThisMission.length,
      };
    }

    // Wrong shop - add to visited list
    const newVisits = [...state.shopsEnteredThisMission, shopId];
    const visitsLeft = state.maxShopVisits - newVisits.length;

    // Check if out of attempts
    if (visitsLeft <= 0) {
      // Mission failed
      set({
        shopsEnteredThisMission: newVisits,
        missionFailed: true,
        missionActive: false,
        missionComplete: true,
        missionSuccess: false,
      });
      return { 
        allowed: true, 
        isTarget: false, 
        message: 'No more attempts! Mission failed.',
        visitsLeft: 0,
      };
    }

    // Wrong shop but still have attempts
    set({
      shopsEnteredThisMission: newVisits,
    });

    return { 
      allowed: true, 
      isTarget: false, 
      message: `Wrong shop! ${visitsLeft} ${visitsLeft === 1 ? 'visit' : 'visits'} remaining.`,
      visitsLeft,
    };
  },

  // Legacy attemptBox function (kept for compatibility)
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
      missionFailed: !success,
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
      shopsEnteredThisMission: [],
      missionComplete: false,
      missionSuccess: false,
      missionFailed: false,
    });
  },

  setEnvironmentMode: (mode: 'day' | 'night') => {
    set({ environmentMode: mode });
  },
}));
