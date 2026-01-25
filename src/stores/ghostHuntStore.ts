import { create } from 'zustand';
import { getGhostHuntLevelConfig } from '@/lib/missionLevels';

/**
 * Ghost Hunt Mission Store
 * 
 * Mission 2: Paranormal Investigation
 * - Dynamic ghost spawns (never same layout twice)
 * - Multiple ghost types with unique behaviors
 * - EMF detection + Flashlight reveal mechanics
 * - Very hard difficulty with time pressure
 */

export type GhostType = 'wanderer' | 'lurker' | 'trickster' | 'shadow';

export type GhostHuntPhase = 
  | 'inactive'      // Mission not started
  | 'briefing'      // Show instructions
  | 'hunting'       // Active hunt phase
  | 'completed'     // Successfully captured all ghosts
  | 'failed';       // Time ran out or player died

export interface GhostData {
  id: string;
  type: GhostType;
  position: [number, number, number];
  spawnPosition: [number, number, number];
  isRevealed: boolean;      // Visible after flashlight hit
  isCaptured: boolean;      // Already collected
  emfStrength: number;      // 0-1 based on distance to player
  lastMoveTime: number;     // For movement logic
  hauntedShopId?: string;   // If haunting a specific shop
}

export interface EquipmentState {
  emfActive: boolean;
  emfBattery: number;        // 0-100
  flashlightActive: boolean;
  flashlightBattery: number; // 0-100
  trapActive: boolean;       // Ghost trap firing
  trapCharges: number;       // Number of trap shots (3 max)
  flashlightCooldown: number; // ms until next use
}

export interface GhostHuntState {
  // Mission status
  isActive: boolean;
  phase: GhostHuntPhase;
  
  // Timer
  timeRemaining: number;      // seconds
  startTime: number | null;
  
  // Ghosts
  ghosts: GhostData[];
  totalGhosts: number;
  capturedCount: number;
  requiredCaptures: number;
  
  // Equipment
  equipment: EquipmentState;
  
  // Difficulty scaling
  difficultyLevel: number;   // 1-5, increases each successful hunt
  unlockedLevel: number;
  maxLevel: number;
  ghostSpeedMultiplier: number;
  emfDrainPerSecond: number;
  flashlightDrainPerUse: number;
  
  // Player state during hunt
  playerLives: number;
  isProtected: boolean;      // Spawn protection
  
  // Spawn variety tracking
  recentSpawnSeeds: number[];
  rechargeShopId: string | null;
  rechargeCollected: {
    emf: boolean;
    flashlight: boolean;
    trap: boolean;
  };
  
  // Actions
  startMission: () => void;
  completeBriefing: () => void;
  updateTimer: (delta: number) => void;
  
  // Equipment actions
  toggleEMF: () => void;
  useFlashlight: () => void;
  fireGhostTrap: () => void;
  drainBattery: (type: 'emf' | 'flashlight', amount: number) => void;
  setRechargeShopId: (shopId: string | null) => void;
  collectRechargePickup: (type: 'emf' | 'flashlight' | 'trap') => void;
  
  // Ghost interactions
  revealGhost: (ghostId: string) => void;
  captureGhost: (ghostId: string) => void;
  moveGhost: (ghostId: string, newPosition: [number, number, number]) => void;
  updateGhostEMF: (ghostId: string, strength: number) => void;
  
  // Player damage
  hitByGhost: () => void;
  
  // Mission end
  completeMission: () => void;
  failMission: (reason: 'time' | 'death') => void;
  resetMission: () => void;
  unlockNextLevel: () => void;
  setDifficultyLevel: (level: number) => void;
  resetProgress: () => void;
}

// Ghost spawn locations - spread across the city
const GHOST_SPAWN_LOCATIONS: [number, number, number][] = [
  // Near main boulevard shops
  [15, 1.5, 35], [-15, 1.5, 35], [15, 1.5, 22], [-15, 1.5, 22],
  [15, 1.5, -22], [-15, 1.5, -22], [15, 1.5, -35], [-15, 1.5, -35],
  [15, 1.5, -48], [-15, 1.5, -48],
  
  // Near cross street
  [32, 1.5, 12], [45, 1.5, 12], [58, 1.5, 12],
  [-32, 1.5, 12], [-45, 1.5, 12], [-58, 1.5, 12],
  [32, 1.5, -12], [45, 1.5, -12], [58, 1.5, -12],
  [-32, 1.5, -12], [-45, 1.5, -12], [-58, 1.5, -12],
  
  // Parks and lakes
  [45, 1.5, 42], [-45, 1.5, 42],
  [-55, 1.5, -48], [58, 1.5, 48],
  
  // Roundabout area
  [5, 1.5, 5], [-5, 1.5, 5], [5, 1.5, -5], [-5, 1.5, -5],
];

// Generate random ghosts with seeded randomness
function generateGhosts(count: number, seed: number): GhostData[] {
  const ghosts: GhostData[] = [];
  const usedIndices = new Set<number>();
  
  // Seeded random function
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  const ghostTypes: GhostType[] = ['wanderer', 'lurker', 'trickster', 'shadow'];
  
  for (let i = 0; i < count; i++) {
    // Pick random unique spawn location
    let locIndex: number;
    let attempts = 0;
    do {
      locIndex = Math.floor(seededRandom(seed + i + attempts * 100) * GHOST_SPAWN_LOCATIONS.length);
      attempts++;
    } while (usedIndices.has(locIndex) && attempts < 50);
    
    usedIndices.add(locIndex);
    const position = GHOST_SPAWN_LOCATIONS[locIndex] || [0, 1.5, 0];
    
    // Random ghost type (shadow is rarer)
    const typeRoll = seededRandom(seed + i * 7);
    let type: GhostType;
    if (typeRoll < 0.35) type = 'wanderer';
    else if (typeRoll < 0.6) type = 'lurker';
    else if (typeRoll < 0.85) type = 'trickster';
    else type = 'shadow';
    
    ghosts.push({
      id: `ghost-${i}-${seed}`,
      type,
      position: [...position] as [number, number, number],
      spawnPosition: [...position] as [number, number, number],
      isRevealed: false,
      isCaptured: false,
      emfStrength: 0,
      lastMoveTime: Date.now(),
    });
  }
  
  return ghosts;
}

const MAX_GHOST_LEVEL = 5;

export const useGhostHuntStore = create<GhostHuntState>((set, get) => ({
  // Initial state
  isActive: false,
  phase: 'inactive',
  timeRemaining: 90,
  startTime: null,
  ghosts: [],
  totalGhosts: 0,
  capturedCount: 0,
  requiredCaptures: 3,
  equipment: {
    emfActive: false,
    emfBattery: 100,
    flashlightActive: false,
    flashlightBattery: 100,
    flashlightCooldown: 0,
    trapActive: false,
    trapCharges: 3,
  },
  difficultyLevel: 1,
  unlockedLevel: 1,
  maxLevel: MAX_GHOST_LEVEL,
  ghostSpeedMultiplier: 1,
  emfDrainPerSecond: 2,
  flashlightDrainPerUse: 15,
  playerLives: 3,
  isProtected: true,
  recentSpawnSeeds: [],
  rechargeShopId: null,
  rechargeCollected: {
    emf: false,
    flashlight: false,
    trap: false,
  },
  
  // Start mission
  startMission: () => {
    const state = get();
    const difficulty = state.difficultyLevel;
    const config = getGhostHuntLevelConfig(difficulty);
    
    // Generate new seed avoiding recent ones
    let seed = Date.now();
    while (state.recentSpawnSeeds.includes(seed % 1000)) {
      seed += 1;
    }
    
    const ghostCount = config.ghostCount;
    const timeLimit = config.timeLimit;
    const ghosts = generateGhosts(ghostCount, seed);
    
    set({
      isActive: true,
      phase: 'briefing',
      timeRemaining: timeLimit,
      startTime: null,
      ghosts,
      totalGhosts: ghostCount,
      capturedCount: 0,
      requiredCaptures: Math.min(ghostCount, config.requiredCaptures),
      equipment: {
        emfActive: false,
        emfBattery: 100,
        flashlightActive: false,
        flashlightBattery: 100,
        flashlightCooldown: 0,
        trapActive: false,
        trapCharges: config.trapCharges,
      },
      playerLives: config.playerLives,
      isProtected: true,
      ghostSpeedMultiplier: config.ghostSpeedMultiplier,
      emfDrainPerSecond: config.emfDrainPerSecond,
      flashlightDrainPerUse: config.flashlightDrainPerUse,
      rechargeShopId: null,
      rechargeCollected: {
        emf: false,
        flashlight: false,
        trap: false,
      },
      recentSpawnSeeds: [...state.recentSpawnSeeds.slice(-4), seed % 1000],
    });
    
    // Remove spawn protection after 3 seconds
    setTimeout(() => {
      set({ isProtected: false });
    }, 3000);
  },
  
  completeBriefing: () => {
    set({
      phase: 'hunting',
      startTime: Date.now(),
    });
  },
  
  updateTimer: (delta: number) => {
    const state = get();
    if (state.phase !== 'hunting') return;
    
    const newTime = state.timeRemaining - delta;
    if (newTime <= 0) {
      get().failMission('time');
    } else {
      set({ timeRemaining: newTime });
    }
    
    // Update flashlight cooldown
    if (state.equipment.flashlightCooldown > 0) {
      set({
        equipment: {
          ...state.equipment,
          flashlightCooldown: Math.max(0, state.equipment.flashlightCooldown - delta * 1000),
        },
      });
    }
  },
  
  // Equipment
  toggleEMF: () => {
    const state = get();
    if (state.equipment.emfBattery <= 0) return;
    
    set({
      equipment: {
        ...state.equipment,
        emfActive: !state.equipment.emfActive,
      },
    });
  },
  
  useFlashlight: () => {
    const state = get();
    if (state.equipment.flashlightBattery <= 0) return;
    if (state.equipment.flashlightCooldown > 0) return;
    
    // Drain battery
    const newBattery = Math.max(0, state.equipment.flashlightBattery - state.flashlightDrainPerUse);
    
    set({
      equipment: {
        ...state.equipment,
        flashlightActive: true,
        flashlightBattery: newBattery,
        flashlightCooldown: 2000, // 2 second cooldown
      },
    });
    
    // Turn off after flash
    setTimeout(() => {
      set(s => ({
        equipment: {
          ...s.equipment,
          flashlightActive: false,
        },
      }));
    }, 500);
  },
  
  fireGhostTrap: () => {
    const state = get();
    if (state.equipment.trapCharges <= 0) return;
    if (state.equipment.trapActive) return; // Already firing
    
    set({
      equipment: {
        ...state.equipment,
        trapActive: true,
        trapCharges: state.equipment.trapCharges - 1,
      },
    });
    
    // Trap beam lasts for 0.8 seconds
    setTimeout(() => {
      set(s => ({
        equipment: {
          ...s.equipment,
          trapActive: false,
        },
      }));
    }, 800);
  },
  
  drainBattery: (type, amount) => {
    const state = get();
    if (type === 'emf') {
      set({
        equipment: {
          ...state.equipment,
          emfBattery: Math.max(0, state.equipment.emfBattery - amount),
          emfActive: state.equipment.emfBattery - amount > 0 ? state.equipment.emfActive : false,
        },
      });
    } else {
      set({
        equipment: {
          ...state.equipment,
          flashlightBattery: Math.max(0, state.equipment.flashlightBattery - amount),
        },
      });
    }
  },
  
  // Ghost interactions
  revealGhost: (ghostId) => {
    set(state => ({
      ghosts: state.ghosts.map(g =>
        g.id === ghostId ? { ...g, isRevealed: true } : g
      ),
    }));
  },
  
  captureGhost: (ghostId) => {
    const state = get();
    const ghost = state.ghosts.find(g => g.id === ghostId);
    if (!ghost || ghost.isCaptured || !ghost.isRevealed) return;
    
    const newCapturedCount = state.capturedCount + 1;
    
    set({
      ghosts: state.ghosts.map(g =>
        g.id === ghostId ? { ...g, isCaptured: true } : g
      ),
      capturedCount: newCapturedCount,
    });
    
    // Check win condition
    if (newCapturedCount >= state.requiredCaptures) {
      get().completeMission();
    }
  },
  
  moveGhost: (ghostId, newPosition) => {
    set(state => ({
      ghosts: state.ghosts.map(g =>
        g.id === ghostId ? { ...g, position: newPosition, lastMoveTime: Date.now() } : g
      ),
    }));
  },
  
  updateGhostEMF: (ghostId, strength) => {
    set(state => ({
      ghosts: state.ghosts.map(g =>
        g.id === ghostId ? { ...g, emfStrength: strength } : g
      ),
    }));
  },
  
  // Player damage
  hitByGhost: () => {
    const state = get();
    if (state.isProtected || state.phase !== 'hunting') return;
    
    const newLives = state.playerLives - 1;
    
    if (newLives <= 0) {
      get().failMission('death');
    } else {
      set({
        playerLives: newLives,
        isProtected: true,
      });
      
      // Brief invincibility after hit
      setTimeout(() => {
        set({ isProtected: false });
      }, 2000);
    }
  },
  
  // Mission end
  completeMission: () => {
    const state = get();
    set({
      phase: 'completed',
    });
    get().unlockNextLevel();
  },
  
  failMission: (reason) => {
    set({
      phase: 'failed',
    });
  },
  
  resetMission: () => {
    const config = getGhostHuntLevelConfig(get().difficultyLevel);
    set({
      isActive: false,
      phase: 'inactive',
      timeRemaining: 90,
      startTime: null,
      ghosts: [],
      totalGhosts: 0,
      capturedCount: 0,
      equipment: {
        emfActive: false,
        emfBattery: 100,
        flashlightActive: false,
        flashlightBattery: 100,
        flashlightCooldown: 0,
        trapActive: false,
        trapCharges: 3,
      },
      playerLives: 3,
      isProtected: true,
      ghostSpeedMultiplier: config.ghostSpeedMultiplier,
      emfDrainPerSecond: config.emfDrainPerSecond,
      flashlightDrainPerUse: config.flashlightDrainPerUse,
      rechargeShopId: null,
      rechargeCollected: {
        emf: false,
        flashlight: false,
        trap: false,
      },
    });
  },

  unlockNextLevel: () => {
    const state = get();
    if (state.unlockedLevel >= state.maxLevel) return;
    if (state.difficultyLevel !== state.unlockedLevel) return;
    set({ unlockedLevel: state.unlockedLevel + 1 });
  },

  setDifficultyLevel: (level) => {
    const state = get();
    const nextLevel = Math.max(1, Math.min(level, state.unlockedLevel));
    set({ difficultyLevel: nextLevel });
  },

  resetProgress: () => {
    set({ difficultyLevel: 1, unlockedLevel: 1 });
  },

  setRechargeShopId: (shopId) =>
    set({
      rechargeShopId: shopId,
      rechargeCollected: {
        emf: false,
        flashlight: false,
        trap: false,
      },
    }),

  collectRechargePickup: (type) => {
    const state = get();
    if (state.rechargeCollected[type]) return;
    const config = getGhostHuntLevelConfig(state.difficultyLevel);
    const nextCollected = { ...state.rechargeCollected, [type]: true };
    set({
      rechargeCollected: nextCollected,
      equipment: {
        ...state.equipment,
        emfBattery: type === 'emf' ? 100 : state.equipment.emfBattery,
        flashlightBattery: type === 'flashlight' ? 100 : state.equipment.flashlightBattery,
        flashlightCooldown: type === 'flashlight' ? 0 : state.equipment.flashlightCooldown,
        trapCharges: type === 'trap' ? config.trapCharges : state.equipment.trapCharges,
      },
    });
  },
}));
