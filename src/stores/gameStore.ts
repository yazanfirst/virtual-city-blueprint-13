import { create } from 'zustand';

export type Mission = {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: { coins: number; xp: number };
  completed: boolean;
  type: 'visit_shops' | 'collect_coins' | 'explore_areas' | 'talk_npc';
};

type GameState = {
  coins: number;
  xp: number;
  level: number;
  shopsVisited: Set<string>;
  coinsCollected: Set<string>;
  npcsInteracted: Set<string>;
  missions: Mission[];
  
  // Actions
  addCoins: (amount: number) => void;
  addXP: (amount: number) => void;
  visitShop: (shopId: string) => void;
  collectCoin: (coinId: string) => void;
  interactWithNPC: (npcId: string) => void;
  updateMissionProgress: () => void;
  claimMissionReward: (missionId: string) => void;
};

const INITIAL_MISSIONS: Mission[] = [
  {
    id: 'visit_3_shops',
    title: 'Window Shopper',
    description: 'Visit 3 different shops',
    target: 3,
    progress: 0,
    reward: { coins: 50, xp: 100 },
    completed: false,
    type: 'visit_shops',
  },
  {
    id: 'collect_5_coins',
    title: 'Treasure Hunter',
    description: 'Collect 5 coins around the city',
    target: 5,
    progress: 0,
    reward: { coins: 25, xp: 75 },
    completed: false,
    type: 'collect_coins',
  },
  {
    id: 'talk_2_npcs',
    title: 'Social Butterfly',
    description: 'Talk to 2 NPCs',
    target: 2,
    progress: 0,
    reward: { coins: 30, xp: 80 },
    completed: false,
    type: 'talk_npc',
  },
  {
    id: 'collect_10_coins',
    title: 'Gold Rush',
    description: 'Collect 10 coins total',
    target: 10,
    progress: 0,
    reward: { coins: 100, xp: 200 },
    completed: false,
    type: 'collect_coins',
  },
  {
    id: 'visit_5_shops',
    title: 'Shopping Spree',
    description: 'Visit 5 different shops',
    target: 5,
    progress: 0,
    reward: { coins: 100, xp: 150 },
    completed: false,
    type: 'visit_shops',
  },
];

const XP_PER_LEVEL = 200;

export const useGameStore = create<GameState>((set, get) => ({
  coins: 100,
  xp: 0,
  level: 1,
  shopsVisited: new Set(),
  coinsCollected: new Set(),
  npcsInteracted: new Set(),
  missions: INITIAL_MISSIONS,

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
      get().updateMissionProgress();
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
      get().updateMissionProgress();
    }
  },

  interactWithNPC: (npcId) => {
    const state = get();
    if (!state.npcsInteracted.has(npcId)) {
      const newInteracted = new Set(state.npcsInteracted);
      newInteracted.add(npcId);
      set({ npcsInteracted: newInteracted });
      get().updateMissionProgress();
    }
  },

  updateMissionProgress: () => {
    const state = get();
    const updatedMissions = state.missions.map((mission) => {
      if (mission.completed) return mission;

      let progress = 0;
      switch (mission.type) {
        case 'visit_shops':
          progress = state.shopsVisited.size;
          break;
        case 'collect_coins':
          progress = state.coinsCollected.size;
          break;
        case 'talk_npc':
          progress = state.npcsInteracted.size;
          break;
        default:
          progress = mission.progress;
      }

      return {
        ...mission,
        progress: Math.min(progress, mission.target),
      };
    });

    set({ missions: updatedMissions });
  },

  claimMissionReward: (missionId) => {
    const state = get();
    const mission = state.missions.find((m) => m.id === missionId);
    
    if (mission && mission.progress >= mission.target && !mission.completed) {
      const updatedMissions = state.missions.map((m) =>
        m.id === missionId ? { ...m, completed: true } : m
      );
      
      set({
        missions: updatedMissions,
        coins: state.coins + mission.reward.coins,
      });
      get().addXP(mission.reward.xp);
    }
  },
}));
