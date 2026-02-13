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
  resetSession: () => void;
  resetGame: () => void;
  loadFromServer: (data: { coins: number; xp: number; level: number }) => void;
  loadVisitedShops: (shopIds: string[]) => void;
};

const XP_PER_LEVEL = 200;
const INITIAL_COINS = 100;
const INITIAL_XP = 0;
const INITIAL_LEVEL = 1;

export const useGameStore = create<GameState>((set, get) => ({
  coins: INITIAL_COINS,
  xp: INITIAL_XP,
  level: INITIAL_LEVEL,
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

  // Reset only per-session state (collectibles, visited shops) — NOT coins/XP/level
  resetSession: () => {
    set({
      shopsVisited: new Set(),
      coinsCollected: new Set(),
    });
  },

  // Full reset including economy (only for account-level reset)
  resetGame: () => {
    set({
      coins: INITIAL_COINS,
      xp: INITIAL_XP,
      level: INITIAL_LEVEL,
      shopsVisited: new Set(),
      coinsCollected: new Set(),
    });
  },

  loadFromServer: (data) => {
    set({
      coins: data.coins,
      xp: data.xp,
      level: data.level,
    });
  },

  loadVisitedShops: (shopIds) => {
    set({ shopsVisited: new Set(shopIds) });
  },
}));
