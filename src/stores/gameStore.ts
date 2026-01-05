import { create } from 'zustand';

type GameState = {
  coins: number;
  gems: number;
  xp: number;
  level: number;
  combo: number;
  lastCollectTime: number;
  shopsVisited: Set<string>;
  coinsCollected: Set<string>;
  boxesCollected: Set<string>;
  
  // Actions
  addCoins: (amount: number) => void;
  addGems: (amount: number) => void;
  addXP: (amount: number) => void;
  visitShop: (shopId: string) => void;
  collectCoin: (coinId: string) => void;
  collectBox: (boxId: string) => void;
  resetCombo: () => void;
};

const XP_PER_LEVEL = 200;
const COMBO_TIMEOUT = 5000; // 5 seconds between collections to keep combo

export const useGameStore = create<GameState>((set, get) => ({
  coins: 100,
  gems: 0,
  xp: 0,
  level: 1,
  combo: 1,
  lastCollectTime: 0,
  shopsVisited: new Set(),
  coinsCollected: new Set(),
  boxesCollected: new Set(),

  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  
  addGems: (amount) => set((state) => ({ gems: state.gems + amount })),
  
  addXP: (amount) => set((state) => {
    const newXP = state.xp + amount;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
    return { xp: newXP, level: newLevel };
  }),

  visitShop: (shopId) => {
    const state = get();
    if (!state.shopsVisited.has(shopId)) {
      const newVisited = new Set(state.shopsVisited);
      newVisited.add(shopId);
      set({ shopsVisited: newVisited });
    }
  },

  collectCoin: (coinId) => {
    const state = get();
    if (!state.coinsCollected.has(coinId)) {
      const newCollected = new Set(state.coinsCollected);
      newCollected.add(coinId);
      set({ 
        coinsCollected: newCollected,
        coins: state.coins + 10 
      });
    }
  },

  collectBox: (boxId) => {
    const state = get();
    const now = Date.now();
    const timeSinceLastCollect = now - state.lastCollectTime;
    
    // If collected within combo window, increase combo
    const newCombo = timeSinceLastCollect < COMBO_TIMEOUT ? Math.min(state.combo + 1, 10) : 1;
    
    set({ 
      combo: newCombo,
      lastCollectTime: now,
    });
    
    // Reset combo after timeout
    setTimeout(() => {
      const currentState = get();
      if (Date.now() - currentState.lastCollectTime >= COMBO_TIMEOUT) {
        set({ combo: 1 });
      }
    }, COMBO_TIMEOUT);
  },

  resetCombo: () => set({ combo: 1 }),
}));
