import { create } from 'zustand';
import { ShopBranding } from '@/hooks/use3DShops';
import { ShopItem } from '@/hooks/useShopItems';
import { getZombieLevelConfig } from '@/lib/missionLevels';

export type MissionPhase = 
  | 'inactive' 
  | 'escape' 
  | 'observation' 
  | 'question' 
  | 'failed' 
  | 'completed';

export interface MissionQuestion {
  id: string;
  template: 'price' | 'count' | 'position' | 'existence' | 'shop';
  questionText: string;
  correctAnswer: string;
  options: string[];
}

export interface ZombieData {
  id: string;
  position: [number, number, number];
  isActive: boolean;
  behaviorType: 'direct' | 'flanker' | 'ambusher' | 'patrol';
  speed: number;
}

export interface TrapData {
  id: string;
  type: 'firepit' | 'axe' | 'thorns';
  position: [number, number, number];
  rotation: number;
  isActive: boolean;
}

export type MissionFailReason = 'zombie' | 'firepit' | 'axe' | 'thorns' | 'trap' | 'jumpscare' | 'time' | 'unknown';

interface MissionState {
  // Mission status
  isActive: boolean;
  phase: MissionPhase;
  missionNumber: number;
  level: number;
  unlockedLevel: number;
  maxLevel: number;

  // Mission timer
  timeRemaining: number;
  timeLimit: number;
  
  // Pause state
  isPaused: boolean;
  
  // Lives system (3 hearts)
  lives: number;
  maxLives: number;
  
  // Target shop
  targetShop: ShopBranding | null;
  targetShopItems: ShopItem[];
  
  // Shop entry tracking (for trap mechanics)
  shopEntryCount: number;
  hasEnteredShop: boolean;
  
  // Notification indicator (when there's an update)
  hasNotification: boolean;
  
  // Safe spawn position for retry
  safeSpawnPosition: [number, number, number];
  
  // Questions
  questions: MissionQuestion[];
  currentQuestionIndex: number;
  questionsAnswered: number;
  questionsCorrect: number;
  
  // Zombie state
  zombies: ZombieData[];
  zombiesPaused: boolean;
  
  // Trap state
  traps: TrapData[];
  
  // Zombie slow state (from laser traps)
  slowedZombieIds: Set<string>;
  
  // Zombie freeze state (complete stop from laser traps)
  frozenZombieIds: Set<string>;
  
  // Protection state (after exiting shop or respawn)
  isProtected: boolean;
  spawnProtectionTimer: number | null;
  
  // Trap state
  trapTriggered: boolean;
  deceptiveMessageShown: boolean;
  
  // Fail reason tracking
  failReason: MissionFailReason;
  
  // Recently used shops (to avoid repetition)
  recentlyUsedShopIds: string[];
  
  // Actions
  activateMission: (targetShop: ShopBranding, items: ShopItem[]) => void;
  setPhase: (phase: MissionPhase) => void;
  enterShop: () => void;
  exitShop: (questions: MissionQuestion[]) => void;
  answerQuestion: (selectedAnswer: string) => boolean;
  triggerTrap: () => void;
  hitByTrap: (trapType?: 'firepit' | 'axe' | 'thorns') => void;
  failMission: (reason?: MissionFailReason) => void;
  completeMission: () => void;
  resetMission: () => void;
  setZombies: (zombies: ZombieData[]) => void;
  pauseZombies: () => void;
  resumeZombies: () => void;
  showDeceptiveMessage: () => void;
  slowZombie: (zombieId: string) => void;
  unslowZombie: (zombieId: string) => void;
  freezeZombie: (zombieId: string, duration?: number) => void;
  unfreezeZombie: (zombieId: string) => void;
  freezeAllZombies: (duration?: number) => void;
  setNotification: (has: boolean) => void;
  getSafeSpawnPosition: () => [number, number, number];
  updateTimer: (delta: number) => void;
  unlockNextLevel: () => void;
  setLevel: (level: number) => void;
  resetProgress: () => void;
  setPaused: (paused: boolean) => void;
}

const ZOMBIE_SPAWNS: Omit<ZombieData, 'speed'>[] = [
    // Direct chasers - 4 zombies that follow directly
    { id: 'zombie-1', position: [-35, 0.25, -35], isActive: true, behaviorType: 'direct' },
    { id: 'zombie-2', position: [35, 0.25, -35], isActive: true, behaviorType: 'direct' },
    { id: 'zombie-3', position: [-50, 0.25, 15], isActive: true, behaviorType: 'direct' },
    { id: 'zombie-4', position: [50, 0.25, 15], isActive: true, behaviorType: 'direct' },
    
    // Flankers - 3 zombies that try to cut off the player
    { id: 'zombie-5', position: [0, 0.25, -55], isActive: true, behaviorType: 'flanker' },
    { id: 'zombie-6', position: [-45, 0.25, -15], isActive: true, behaviorType: 'flanker' },
    { id: 'zombie-7', position: [45, 0.25, -15], isActive: true, behaviorType: 'flanker' },
    
    // Ambushers - 3 zombies that wait near key areas
    { id: 'zombie-8', position: [-20, 0.25, 35], isActive: true, behaviorType: 'ambusher' },
    { id: 'zombie-9', position: [20, 0.25, 35], isActive: true, behaviorType: 'ambusher' },
    { id: 'zombie-10', position: [0, 0.25, -70], isActive: true, behaviorType: 'ambusher' },
    
    // Patrollers - 2 zombies that patrol and chase when close
    { id: 'zombie-11', position: [-60, 0.25, 0], isActive: true, behaviorType: 'patrol' },
    { id: 'zombie-12', position: [60, 0.25, 0], isActive: true, behaviorType: 'patrol' },
];

const getSpawnDistance = (position: [number, number, number]) => {
  const [x, , z] = position;
  return Math.sqrt(x * x + z * z);
};

const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate zombie spawn positions with varied behavior types
function generateZombieSpawns(level: number): ZombieData[] {
  const config = getZombieLevelConfig(level);
  const seed = Date.now();
  const sortedByDistance = [...ZOMBIE_SPAWNS].sort(
    (a, b) => getSpawnDistance(b.position) - getSpawnDistance(a.position)
  );
  const distantPool = sortedByDistance.filter(
    (spawn) => getSpawnDistance(spawn.position) >= config.minSpawnDistance
  );
  const pool = distantPool.length >= config.zombieCount ? distantPool : sortedByDistance;
  const preferredTypes = level <= 2 ? ['direct', 'flanker'] : ['direct', 'flanker', 'ambusher', 'patrol'];
  const preferred = pool.filter((spawn) => preferredTypes.includes(spawn.behaviorType));
  const fallback = pool.filter((spawn) => !preferredTypes.includes(spawn.behaviorType));
  const shuffled = [...preferred, ...fallback].sort(
    (a, b) => seededRandom(seed + ZOMBIE_SPAWNS.indexOf(a)) - seededRandom(seed + ZOMBIE_SPAWNS.indexOf(b))
  );
  const selected = shuffled.slice(0, Math.min(config.zombieCount, shuffled.length));
  return selected.map((spawn) => ({
    ...spawn,
    speed: config.zombieSpeed,
  }));
}

// Generate trap positions (fire pits, swinging axes, and thorns)
function generateTrapPositions(): TrapData[] {
  return [
    // Fire pit traps - simple circular ground traps (jump over them)
    { id: 'firepit-1', type: 'firepit', position: [0, 0, 20], rotation: 0, isActive: true },
    { id: 'firepit-2', type: 'firepit', position: [0, 0, -20], rotation: 0, isActive: true },
    { id: 'firepit-3', type: 'firepit', position: [25, 0, 5], rotation: 0, isActive: true },
    { id: 'firepit-4', type: 'firepit', position: [-25, 0, 5], rotation: 0, isActive: true },
    { id: 'firepit-5', type: 'firepit', position: [0, 0, -45], rotation: 0, isActive: true },
    
    // Swinging axe traps - time your movement to pass through
    { id: 'axe-1', type: 'axe', position: [5, 0, 0], rotation: 0, isActive: true },
    { id: 'axe-2', type: 'axe', position: [-5, 0, -35], rotation: Math.PI / 2, isActive: true },
    { id: 'axe-3', type: 'axe', position: [35, 0, 0], rotation: Math.PI / 2, isActive: true },
    { id: 'axe-4', type: 'axe', position: [-35, 0, 0], rotation: Math.PI / 2, isActive: true },
    
    // Thorns traps (open/close) - existing reliable trap
    { id: 'thorns-1', type: 'thorns', position: [15, 0, 15], rotation: 0, isActive: true },
    { id: 'thorns-2', type: 'thorns', position: [-15, 0, 15], rotation: 0, isActive: true },
    { id: 'thorns-3', type: 'thorns', position: [30, 0, -10], rotation: 0, isActive: true },
    { id: 'thorns-4', type: 'thorns', position: [-30, 0, -10], rotation: 0, isActive: true },
    { id: 'thorns-5', type: 'thorns', position: [0, 0, -55], rotation: 0, isActive: true },
    { id: 'thorns-6', type: 'thorns', position: [20, 0, -25], rotation: 0, isActive: true },
    { id: 'thorns-7', type: 'thorns', position: [-20, 0, -25], rotation: 0, isActive: true },
  ];
}

// Safe spawn position (away from traps)
const SAFE_SPAWN_POSITION: [number, number, number] = [0, 0.5, 45];
const DEFAULT_ZOMBIE_TIME_LIMIT = 90;
const MAX_ZOMBIE_LEVEL = 5;

export const useMissionStore = create<MissionState>((set, get) => ({
  // Initial state
  isActive: false,
  phase: 'inactive',
  missionNumber: 1,
  level: 1,
  unlockedLevel: 1,
  maxLevel: MAX_ZOMBIE_LEVEL,

  timeRemaining: DEFAULT_ZOMBIE_TIME_LIMIT,
  timeLimit: DEFAULT_ZOMBIE_TIME_LIMIT,
  
  // Pause state
  isPaused: false,
  
  // Lives
  lives: 3,
  maxLives: 3,
  
  targetShop: null,
  targetShopItems: [],
  
  shopEntryCount: 0,
  hasEnteredShop: false,
  
  // Notification
  hasNotification: false,
  
  // Safe spawn
  safeSpawnPosition: SAFE_SPAWN_POSITION,
  
  questions: [],
  currentQuestionIndex: 0,
  questionsAnswered: 0,
  questionsCorrect: 0,
  
  zombies: [],
  zombiesPaused: false,
  
  traps: [],
  
  slowedZombieIds: new Set(),
  frozenZombieIds: new Set(),
  
  isProtected: false,
  spawnProtectionTimer: null,
  
  trapTriggered: false,
  deceptiveMessageShown: false,
  
  failReason: 'unknown',
  
  recentlyUsedShopIds: [],

  activateMission: (targetShop, items) => {
    const state = get();
    const config = getZombieLevelConfig(state.level);
    const seed = Date.now();
    const traps = generateTrapPositions();
    const trapIndices = traps.map((_, index) => index);
    trapIndices.sort((a, b) => seededRandom(seed + a) - seededRandom(seed + b));
    const activeTrapIds = new Set(trapIndices.slice(0, Math.min(config.activeTrapCount, traps.length)));
    
    // Clear any existing spawn protection timer
    if (state.spawnProtectionTimer) {
      clearTimeout(state.spawnProtectionTimer);
    }
    
    // Start with spawn protection - 3 seconds for safety
    const protectionTimer = setTimeout(() => {
      set({ isProtected: false, spawnProtectionTimer: null });
    }, 3000) as unknown as number; // 3 seconds of invincibility
    
    set({
      isActive: true,
      phase: 'escape',
      targetShop,
      targetShopItems: items,
      shopEntryCount: 0,
      hasEnteredShop: false,
      questions: [],
      currentQuestionIndex: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      zombies: generateZombieSpawns(state.level),
      zombiesPaused: false,
      traps: traps.map((trap, index) => ({
        ...trap,
        isActive: activeTrapIds.has(index),
      })),
      slowedZombieIds: new Set(),
      frozenZombieIds: new Set(),
      isProtected: true, // Start protected
      spawnProtectionTimer: protectionTimer,
      trapTriggered: false,
      deceptiveMessageShown: false,
      lives: config.lives,
      maxLives: config.lives,
      timeRemaining: config.timeLimit,
      timeLimit: config.timeLimit,
      failReason: 'unknown',
      recentlyUsedShopIds: [...state.recentlyUsedShopIds, targetShop.shopId].slice(-5),
    });
  },

  setPhase: (phase) => set({ phase }),

  enterShop: () => {
    const state = get();
    const newEntryCount = state.shopEntryCount + 1;
    
    if (newEntryCount === 1) {
      // First entry - safe, observation phase
      set({
        shopEntryCount: newEntryCount,
        hasEnteredShop: true,
        phase: 'observation',
        isProtected: true,
      });
    } else if (newEntryCount >= 2) {
      // Second entry - TRAP! Jump scare zombie
      set({
        shopEntryCount: newEntryCount,
        trapTriggered: true,
        phase: 'failed',
        failReason: 'jumpscare',
      });
    }
  },

  exitShop: (questions) => {
    set({
      phase: 'question',
      questions,
      currentQuestionIndex: 0,
      zombiesPaused: true,
      isProtected: true,
    });
  },

  answerQuestion: (selectedAnswer) => {
    const state = get();
    const currentQuestion = state.questions[state.currentQuestionIndex];
    
    if (!currentQuestion) return false;
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const newQuestionsAnswered = state.questionsAnswered + 1;
    const newQuestionsCorrect = state.questionsCorrect + (isCorrect ? 1 : 0);
    const nextIndex = state.currentQuestionIndex + 1;
    
    if (!isCorrect) {
      // Wrong answer - show deceptive message, enable trap, set notification
      set({
        questionsAnswered: newQuestionsAnswered,
        questionsCorrect: newQuestionsCorrect,
        isProtected: false,
        zombiesPaused: false,
        deceptiveMessageShown: true,
        hasNotification: true, // Notify user to check mission panel
      });
      return false;
    }
    
    if (nextIndex >= state.questions.length) {
      // All questions answered correctly - SUCCESS!
      set({
        questionsAnswered: newQuestionsAnswered,
        questionsCorrect: newQuestionsCorrect,
        phase: 'completed',
        zombies: [],
        zombiesPaused: true,
      traps: [],
    });
      get().unlockNextLevel();
      return true;
    }
    
    // Move to next question
    set({
      questionsAnswered: newQuestionsAnswered,
      questionsCorrect: newQuestionsCorrect,
      currentQuestionIndex: nextIndex,
    });
    
    return true;
  },

  triggerTrap: () => {
    set({
      trapTriggered: true,
      phase: 'failed',
      isProtected: false,
    });
  },

  hitByTrap: (trapType?: 'firepit' | 'axe' | 'thorns') => {
    const state = get();
    const newLives = state.lives - 1;
    
    if (newLives <= 0) {
      // No more lives - fail mission
      set({
        lives: 0,
        phase: 'failed',
        isProtected: false,
        zombiesPaused: true,
        failReason: trapType || 'trap',
      });
    } else {
      set({ lives: newLives });
    }
  },

  failMission: (reason?: MissionFailReason) => {
    set({
      phase: 'failed',
      isProtected: false,
      zombiesPaused: true,
      failReason: reason || 'unknown',
    });
    console.log('Mission failed:', reason);
  },

  completeMission: () => {
    set({
      isActive: false,
      phase: 'completed',
      zombies: [],
      zombiesPaused: true,
      traps: [],
    });
  },

  resetMission: () => {
    const state = get();
    
    // Clear spawn protection timer if exists
    if (state.spawnProtectionTimer) {
      clearTimeout(state.spawnProtectionTimer);
    }
    
    set({
      isActive: false,
      phase: 'inactive',
      isPaused: false,
      targetShop: null,
      targetShopItems: [],
      shopEntryCount: 0,
      hasEnteredShop: false,
      questions: [],
      currentQuestionIndex: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      zombies: [],
      zombiesPaused: false,
      traps: [],
      slowedZombieIds: new Set(),
      frozenZombieIds: new Set(),
      isProtected: false,
      spawnProtectionTimer: null,
      trapTriggered: false,
      deceptiveMessageShown: false,
      lives: getZombieLevelConfig(state.level).lives,
      maxLives: getZombieLevelConfig(state.level).lives,
      timeRemaining: getZombieLevelConfig(state.level).timeLimit,
      timeLimit: getZombieLevelConfig(state.level).timeLimit,
      failReason: 'unknown',
    });
  },

  setZombies: (zombies) => set({ zombies }),
  
  pauseZombies: () => set({ zombiesPaused: true }),
  
  resumeZombies: () => set({ zombiesPaused: false }),
  
  showDeceptiveMessage: () => set({ deceptiveMessageShown: true }),
  
  slowZombie: (zombieId: string) => {
    const state = get();
    const newSlowed = new Set(state.slowedZombieIds);
    newSlowed.add(zombieId);
    set({ slowedZombieIds: newSlowed });
    
    // Remove slow after 3 seconds
    setTimeout(() => {
      const currentState = get();
      const updated = new Set(currentState.slowedZombieIds);
      updated.delete(zombieId);
      set({ slowedZombieIds: updated });
    }, 3000);
  },
  
  unslowZombie: (zombieId: string) => {
    const state = get();
    const newSlowed = new Set(state.slowedZombieIds);
    newSlowed.delete(zombieId);
    set({ slowedZombieIds: newSlowed });
  },
  
  freezeZombie: (zombieId: string, duration: number = 2000) => {
    const state = get();
    const newFrozen = new Set(state.frozenZombieIds);
    newFrozen.add(zombieId);
    set({ frozenZombieIds: newFrozen });
    
    // Automatically unfreeze after duration (default 2 seconds)
    setTimeout(() => {
      const currentState = get();
      const updated = new Set(currentState.frozenZombieIds);
      updated.delete(zombieId);
      set({ frozenZombieIds: updated });
    }, duration);
  },
  
  unfreezeZombie: (zombieId: string) => {
    const state = get();
    const newFrozen = new Set(state.frozenZombieIds);
    newFrozen.delete(zombieId);
    set({ frozenZombieIds: newFrozen });
  },
  
  freezeAllZombies: (duration: number = 3000) => {
    const state = get();
    const allZombieIds = state.zombies.map(z => z.id);
    const newFrozen = new Set(allZombieIds);
    set({ frozenZombieIds: newFrozen });
    
    // Automatically unfreeze all after duration (default 3 seconds)
    setTimeout(() => {
      set({ frozenZombieIds: new Set() });
    }, duration);
  },
  
  setNotification: (has: boolean) => set({ hasNotification: has }),
  
  getSafeSpawnPosition: (): [number, number, number] => SAFE_SPAWN_POSITION,

  updateTimer: (delta: number) => {
    const state = get();
    if (!state.isActive || state.phase !== 'escape' || state.isPaused) {
      return;
    }

    const newTime = state.timeRemaining - delta;
    if (newTime <= 0) {
      set({ timeRemaining: 0 });
      get().failMission('time');
    } else {
      set({ timeRemaining: newTime });
    }
  },

  unlockNextLevel: () => {
    const state = get();
    if (state.unlockedLevel >= state.maxLevel) return;
    if (state.level !== state.unlockedLevel) return;
    set({ unlockedLevel: state.unlockedLevel + 1 });
  },

  setLevel: (level) => {
    const state = get();
    const nextLevel = Math.max(1, Math.min(level, state.unlockedLevel));
    set({ level: nextLevel });
  },

  resetProgress: () => {
    set({ level: 1, unlockedLevel: 1 });
  },
  
  setPaused: (paused: boolean) => set({ isPaused: paused }),
}));
