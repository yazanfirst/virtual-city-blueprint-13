import { create } from 'zustand';

type GameState = {
  coins: number;
  xp: number;
  level: number;
  shopsVisited: Set<string>;
  coinsCollected: Set<string>;
  
  // Actions
  addCoins: (amount: number) => void;
  addXP: (amount: number) => void;
  visitShop: (shopId: string) => void;
  collectCoin: (coinId: string) => void;
};

const XP_PER_LEVEL = 200;

export const useGameStore = create<GameState>((set, get) => ({
  coins: 100,
  xp: 0,
  level: 1,
  shopsVisited: new Set(),
  coinsCollected: new Set(),

  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  
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
}));
