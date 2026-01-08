import { create } from 'zustand';
import { ClueType, IndicatorType, DecoyTell, MISSION_CONFIG } from '@/config/mystery-box.config';

export interface MissionClue {
  id: string;
  type: ClueType;
  text: string;
  revealed: boolean;
}

export interface MissionIndicator {
  shopId: string;
  position: { x: number; z: number };
  type: IndicatorType;
  isDecoy: boolean;
  decoyTell?: DecoyTell;
}

export interface EligibleShop {
  shopId: string;
  spotId: string;
  name: string;
  category: string;
  position: { x: number; z: number; rotation: number };
  primaryColor?: string;
  accentColor?: string;
}

type MissionState = {
  // Core state
  missionActive: boolean;
  sessionSeed: number;
  targetShopId: string | null;
  targetShopPosition: { x: number; z: number } | null;
  
  // Clues
  clues: MissionClue[];
  
  // Indicators
  indicators: MissionIndicator[];
  
  // Progress
  shopsVisitedThisMission: Set<string>;
  boxCollected: boolean;
  missionFailed: boolean;
  
  // Actions
  startMission: (
    targetShop: EligibleShop,
    clues: MissionClue[],
    indicators: MissionIndicator[],
    seed: number
  ) => void;
  visitShop: (shopId: string) => boolean; // returns false if max reached
  collectBox: () => { coins: number; xp: number };
  revealNextClue: () => boolean; // returns false if all revealed
  resetMission: () => void;
  failMission: () => void;
  
  // Getters
  getVisitsRemaining: () => number;
  canVisitMoreShops: () => boolean;
  getRevealedClues: () => MissionClue[];
  getUnrevealedClueCount: () => number;
};

const initialState = {
  missionActive: false,
  sessionSeed: 0,
  targetShopId: null,
  targetShopPosition: null,
  clues: [],
  indicators: [],
  shopsVisitedThisMission: new Set<string>(),
  boxCollected: false,
  missionFailed: false,
};

export const useMissionStore = create<MissionState>((set, get) => ({
  ...initialState,

  startMission: (targetShop, clues, indicators, seed) => {
    set({
      missionActive: true,
      sessionSeed: seed,
      targetShopId: targetShop.shopId,
      targetShopPosition: { x: targetShop.position.x, z: targetShop.position.z },
      clues,
      indicators,
      shopsVisitedThisMission: new Set(),
      boxCollected: false,
      missionFailed: false,
    });
  },

  visitShop: (shopId) => {
    const state = get();
    if (!state.missionActive || state.boxCollected || state.missionFailed) return false;
    
    // Already visited this shop
    if (state.shopsVisitedThisMission.has(shopId)) return true;
    
    const newVisited = new Set(state.shopsVisitedThisMission);
    newVisited.add(shopId);
    
    // Check if exceeded max visits
    if (newVisited.size > MISSION_CONFIG.maxShopVisits) {
      set({ 
        shopsVisitedThisMission: newVisited,
        missionFailed: true 
      });
      return false;
    }
    
    set({ shopsVisitedThisMission: newVisited });
    return true;
  },

  collectBox: () => {
    const state = get();
    if (!state.missionActive || state.boxCollected) {
      return { coins: 0, xp: 0 };
    }
    
    set({ boxCollected: true, missionActive: false });
    
    // Calculate reward based on visits used
    const visitsUsed = state.shopsVisitedThisMission.size;
    const efficiency = Math.max(0, MISSION_CONFIG.maxShopVisits - visitsUsed + 1);
    const multiplier = 1 + (efficiency * 0.25); // Bonus for fewer visits
    
    return {
      coins: Math.floor(MISSION_CONFIG.boxCollectionReward.coins * multiplier),
      xp: Math.floor(MISSION_CONFIG.boxCollectionReward.xp * multiplier),
    };
  },

  revealNextClue: () => {
    const state = get();
    const unrevealedIndex = state.clues.findIndex(c => !c.revealed);
    
    if (unrevealedIndex === -1) return false;
    
    const newClues = [...state.clues];
    newClues[unrevealedIndex] = { ...newClues[unrevealedIndex], revealed: true };
    
    set({ clues: newClues });
    return true;
  },

  resetMission: () => {
    set(initialState);
  },

  failMission: () => {
    set({ missionFailed: true, missionActive: false });
  },

  getVisitsRemaining: () => {
    const state = get();
    return Math.max(0, MISSION_CONFIG.maxShopVisits - state.shopsVisitedThisMission.size);
  },

  canVisitMoreShops: () => {
    const state = get();
    return state.shopsVisitedThisMission.size < MISSION_CONFIG.maxShopVisits;
  },

  getRevealedClues: () => {
    return get().clues.filter(c => c.revealed);
  },

  getUnrevealedClueCount: () => {
    return get().clues.filter(c => !c.revealed).length;
  },
}));
