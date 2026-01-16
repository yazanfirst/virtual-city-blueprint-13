import { create } from 'zustand';
import { ShopBranding } from '@/hooks/use3DShops';
import { ShopItem } from '@/hooks/useShopItems';

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
}

export interface TrapData {
  id: string;
  position: [number, number, number];
  rotation: number;
  length: number;
  isActive: boolean;
}

interface MissionState {
  // Mission status
  isActive: boolean;
  phase: MissionPhase;
  missionNumber: number;
  
  // Lives system (3 hearts)
  lives: number;
  maxLives: number;
  
  // Target shop
  targetShop: ShopBranding | null;
  targetShopItems: ShopItem[];
  
  // Shop entry tracking (for trap mechanics)
  shopEntryCount: number;
  hasEnteredShop: boolean;
  
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
  
  // Protection state (after exiting shop)
  isProtected: boolean;
  
  // Trap state
  trapTriggered: boolean;
  deceptiveMessageShown: boolean;
  zombieAttackActive: boolean;
  
  // Recently used shops (to avoid repetition)
  recentlyUsedShopIds: string[];
  
  // Actions
  activateMission: (targetShop: ShopBranding, items: ShopItem[]) => void;
  setPhase: (phase: MissionPhase) => void;
  enterShop: () => void;
  exitShop: (questions: MissionQuestion[]) => void;
  answerQuestion: (selectedAnswer: string) => boolean;
  triggerTrap: () => void;
  hitByTrap: () => void;
  failMission: (reason?: string) => void;
  startZombieAttack: () => void;
  completeMission: () => void;
  resetMission: () => void;
  setZombies: (zombies: ZombieData[]) => void;
  pauseZombies: () => void;
  resumeZombies: () => void;
  showDeceptiveMessage: () => void;
}

// Generate zombie spawn positions (more zombies, spread around)
function generateZombieSpawns(): ZombieData[] {
  return [
    { id: 'zombie-1', position: [-35, 0.25, -35], isActive: true },
    { id: 'zombie-2', position: [35, 0.25, -35], isActive: true },
    { id: 'zombie-3', position: [0, 0.25, -50], isActive: true },
    { id: 'zombie-4', position: [-45, 0.25, 0], isActive: true },
    { id: 'zombie-5', position: [45, 0.25, 0], isActive: true },
    { id: 'zombie-6', position: [-20, 0.25, -45], isActive: true },
    { id: 'zombie-7', position: [20, 0.25, -45], isActive: true },
  ];
}

// Generate trap positions (laser beams across paths)
function generateTrapPositions(): TrapData[] {
  return [
    { id: 'trap-1', position: [0, 0, 15], rotation: 0, length: 10, isActive: true },
    { id: 'trap-2', position: [0, 0, -25], rotation: 0, length: 10, isActive: true },
    { id: 'trap-3', position: [30, 0, 0], rotation: Math.PI / 2, length: 8, isActive: true },
    { id: 'trap-4', position: [-30, 0, 0], rotation: Math.PI / 2, length: 8, isActive: true },
    { id: 'trap-5', position: [0, 0, -40], rotation: 0, length: 12, isActive: true },
  ];
}

let zombieAttackTimeout: ReturnType<typeof setTimeout> | null = null;

export const useMissionStore = create<MissionState>((set, get) => ({
  // Initial state
  isActive: false,
  phase: 'inactive',
  missionNumber: 1,
  
  // Lives
  lives: 3,
  maxLives: 3,
  
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
  
  isProtected: false,
  
  trapTriggered: false,
  deceptiveMessageShown: false,
  zombieAttackActive: false,
  
  recentlyUsedShopIds: [],

  activateMission: (targetShop, items) => {
    const state = get();
    
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
      zombies: generateZombieSpawns(),
      zombiesPaused: false,
      traps: generateTrapPositions(),
      isProtected: false,
      trapTriggered: false,
      deceptiveMessageShown: false,
      lives: 3,
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
      // Second entry - TRAP! Zombies inside
      set({
        shopEntryCount: newEntryCount,
        trapTriggered: true,
        phase: 'failed',
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
      // Wrong answer - show deceptive message, enable trap
      set({
        questionsAnswered: newQuestionsAnswered,
        questionsCorrect: newQuestionsCorrect,
        isProtected: false,
        zombiesPaused: false,
        deceptiveMessageShown: true,
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

  hitByTrap: () => {
    const state = get();
    const newLives = state.lives - 1;
    
    if (newLives <= 0) {
      // No more lives - fail mission
      set({
        lives: 0,
        phase: 'failed',
        isProtected: false,
        zombiesPaused: true,
      });
    } else {
      set({ lives: newLives });
    }
  },

  failMission: (reason) => {
    if (zombieAttackTimeout) {
      clearTimeout(zombieAttackTimeout);
      zombieAttackTimeout = null;
    }
    set({
      phase: 'failed',
      isProtected: false,
      zombiesPaused: true,
      zombieAttackActive: false,
    });
    console.log('Mission failed:', reason);
  },

  startZombieAttack: () => {
    const state = get();
    if (state.zombieAttackActive || state.phase === 'failed') return;

    if (zombieAttackTimeout) {
      clearTimeout(zombieAttackTimeout);
      zombieAttackTimeout = null;
    }

    set({
      zombieAttackActive: true,
      isProtected: false,
      zombiesPaused: false,
    });

    zombieAttackTimeout = setTimeout(() => {
      set({
        phase: 'failed',
        zombiesPaused: true,
        zombieAttackActive: false,
      });
      zombieAttackTimeout = null;
    }, 1500);
  },

  completeMission: () => {
    if (zombieAttackTimeout) {
      clearTimeout(zombieAttackTimeout);
      zombieAttackTimeout = null;
    }
    set({
      phase: 'completed',
      zombies: [],
      zombiesPaused: true,
      traps: [],
    });
  },

  resetMission: () => {
    if (zombieAttackTimeout) {
      clearTimeout(zombieAttackTimeout);
      zombieAttackTimeout = null;
    }
    set({
      isActive: false,
      phase: 'inactive',
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
      isProtected: false,
      trapTriggered: false,
      deceptiveMessageShown: false,
      lives: 3,
      zombieAttackActive: false,
    });
  },

  setZombies: (zombies) => set({ zombies }),
  
  pauseZombies: () => set({ zombiesPaused: true }),
  
  resumeZombies: () => set({ zombiesPaused: false }),
  
  showDeceptiveMessage: () => set({ deceptiveMessageShown: true }),
}));
