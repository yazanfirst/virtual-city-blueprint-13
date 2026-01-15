import { create } from 'zustand';

export type HazardType = 
  | 'falling_tree' 
  | 'sinkhole' 
  | 'falling_lamp'
  | 'exploding_bench';

export type RandomHazard = {
  id: string;
  type: HazardType;
  position: [number, number, number];
  triggerType: 'proximity' | 'timer';
  triggerDistance: number;
  triggerTime?: number;
  isTriggered: boolean;
  isActive: boolean;
  damage: number; // 1 = one life, 3 = instant death
  warningTime: number; // ms before hazard activates
};

// Tree positions from CityScene
const TREE_POSITIONS = [
  { x: 10, z: 45 }, { x: 10, z: 33 }, { x: 10, z: 21 },
  { x: 10, z: -21 }, { x: 10, z: -33 }, { x: 10, z: -45 },
  { x: -10, z: 45 }, { x: -10, z: 33 }, { x: -10, z: 21 },
  { x: -10, z: -21 }, { x: -10, z: -33 }, { x: -10, z: -45 },
  { x: 28, z: 15 }, { x: 40, z: 15 }, { x: 52, z: 15 },
  { x: -28, z: 15 }, { x: -40, z: 15 }, { x: -52, z: 15 },
  { x: 45, z: 40 }, { x: 48, z: 43 }, { x: 42, z: 38 },
  { x: -45, z: 40 }, { x: -48, z: 43 }, { x: -42, z: 38 },
];

// Random positions for sinkholes
const SINKHOLE_AREAS = [
  { x: 5, z: 30 }, { x: -5, z: 35 }, { x: 20, z: 10 },
  { x: -20, z: -10 }, { x: 0, z: -30 }, { x: 30, z: 0 },
  { x: -30, z: 5 }, { x: 15, z: -20 }, { x: -15, z: 25 },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateHazards(): RandomHazard[] {
  const hazards: RandomHazard[] = [];
  
  // Select 3-5 random trees to be dangerous
  const shuffledTrees = shuffleArray(TREE_POSITIONS);
  const dangerousTreeCount = 3 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < Math.min(dangerousTreeCount, shuffledTrees.length); i++) {
    const tree = shuffledTrees[i];
    hazards.push({
      id: `falling-tree-${i}`,
      type: 'falling_tree',
      position: [tree.x, 0, tree.z],
      triggerType: 'proximity',
      triggerDistance: 4,
      isTriggered: false,
      isActive: false,
      damage: 3, // INSTANT DEATH!
      warningTime: 800, // 0.8 seconds to dodge
    });
  }
  
  // Select 2-4 random sinkhole positions
  const shuffledSinkholes = shuffleArray(SINKHOLE_AREAS);
  const sinkholeCount = 2 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < Math.min(sinkholeCount, shuffledSinkholes.length); i++) {
    const pos = shuffledSinkholes[i];
    // Add some randomness to position
    const offsetX = (Math.random() - 0.5) * 6;
    const offsetZ = (Math.random() - 0.5) * 6;
    
    hazards.push({
      id: `sinkhole-${i}`,
      type: 'sinkhole',
      position: [pos.x + offsetX, 0, pos.z + offsetZ],
      triggerType: Math.random() > 0.5 ? 'proximity' : 'timer',
      triggerDistance: 3,
      triggerTime: 30000 + Math.random() * 60000, // 30-90 seconds
      isTriggered: false,
      isActive: false,
      damage: 1,
      warningTime: 1500, // 1.5 seconds warning
    });
  }
  
  return hazards;
}

type HazardState = {
  hazards: RandomHazard[];
  triggeredHazardIds: Set<string>;
  gameStartTime: number;
  
  // Actions
  initializeHazards: () => void;
  triggerHazard: (id: string) => void;
  activateHazard: (id: string) => void;
  checkProximityHazards: (playerPos: [number, number, number]) => RandomHazard[];
  checkTimerHazards: () => RandomHazard[];
  resetHazards: () => void;
  getDangerousTreePositions: () => { x: number; z: number }[];
  getSinkholePositions: () => { x: number; z: number; isActive: boolean }[];
};

export const useHazardStore = create<HazardState>((set, get) => ({
  hazards: [],
  triggeredHazardIds: new Set(),
  gameStartTime: Date.now(),

  initializeHazards: () => {
    const hazards = generateHazards();
    set({
      hazards,
      triggeredHazardIds: new Set(),
      gameStartTime: Date.now(),
    });
  },

  triggerHazard: (id: string) => {
    const state = get();
    if (state.triggeredHazardIds.has(id)) return;
    
    const newTriggered = new Set(state.triggeredHazardIds);
    newTriggered.add(id);
    
    const newHazards = state.hazards.map(h => 
      h.id === id ? { ...h, isTriggered: true } : h
    );
    
    set({
      hazards: newHazards,
      triggeredHazardIds: newTriggered,
    });
  },

  activateHazard: (id: string) => {
    const state = get();
    const newHazards = state.hazards.map(h => 
      h.id === id ? { ...h, isActive: true } : h
    );
    set({ hazards: newHazards });
  },

  checkProximityHazards: (playerPos: [number, number, number]) => {
    const state = get();
    const triggered: RandomHazard[] = [];
    
    state.hazards.forEach(hazard => {
      if (hazard.isTriggered || hazard.triggerType !== 'proximity') return;
      
      const dx = playerPos[0] - hazard.position[0];
      const dz = playerPos[2] - hazard.position[2];
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < hazard.triggerDistance) {
        get().triggerHazard(hazard.id);
        triggered.push(hazard);
      }
    });
    
    return triggered;
  },

  checkTimerHazards: () => {
    const state = get();
    const now = Date.now();
    const elapsed = now - state.gameStartTime;
    const triggered: RandomHazard[] = [];
    
    state.hazards.forEach(hazard => {
      if (hazard.isTriggered || hazard.triggerType !== 'timer') return;
      if (hazard.triggerTime && elapsed >= hazard.triggerTime) {
        get().triggerHazard(hazard.id);
        triggered.push(hazard);
      }
    });
    
    return triggered;
  },

  resetHazards: () => {
    const hazards = generateHazards();
    set({
      hazards,
      triggeredHazardIds: new Set(),
      gameStartTime: Date.now(),
    });
  },

  getDangerousTreePositions: () => {
    const state = get();
    return state.hazards
      .filter(h => h.type === 'falling_tree')
      .map(h => ({ x: h.position[0], z: h.position[2] }));
  },

  getSinkholePositions: () => {
    const state = get();
    return state.hazards
      .filter(h => h.type === 'sinkhole')
      .map(h => ({ 
        x: h.position[0], 
        z: h.position[2],
        isActive: h.isActive,
      }));
  },
}));
