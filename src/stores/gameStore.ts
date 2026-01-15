import { create } from 'zustand';

// Types
export type BoxRarity = 'common' | 'rare' | 'legendary' | 'decoy';
export type DestructibleType = 'cardboard' | 'crate' | 'trash' | 'vending';
export type TrapType = 'spike' | 'laser' | 'falling' | 'pressure';

export type Voucher = {
  id: string;
  boxType: BoxRarity;
  discountPercent: number;
  shopId?: string;
  itemCategory?: string;
  expiresAt: number;
  isUsed: boolean;
};

export type BoxSpawn = {
  id: string;
  position: [number, number, number];
  rarity: BoxRarity;
  isMoving: boolean;
  collected: boolean;
};

export type Question = {
  id: string;
  type: 'pattern' | 'sequence' | 'emoji' | 'math';
  question: string;
  options: string[];
  correctIndex: number;
  showTime?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  pattern?: string[];
};

export type DestructibleState = {
  id: string;
  type: DestructibleType;
  position: [number, number, number];
  maxHp: number;
  currentHp: number;
  destroyed: boolean;
  reward?: { type: 'coin' | 'gem' | 'voucher'; amount: number };
};

export type TrapState = {
  id: string;
  type: TrapType;
  position: [number, number, number];
  isActive: boolean;
  pattern: { activeTime: number; cooldownTime: number };
};

type GameOverStats = {
  boxesFound: number;
  coinsCollected: number;
  vouchersEarned: number;
  deathsByHazards: number;
};

type GameState = {
  // Existing
  coins: number;
  xp: number;
  level: number;
  shopsVisited: Set<string>;
  coinsCollected: Set<string>;
  
  // Hunt System
  isHuntActive: boolean;
  huntEndTime: number | null;
  huntCooldownEndTime: number | null;
  boxSpawns: BoxSpawn[];
  totalBoxesThisHunt: number;
  huntStreak: number;
  
  // Lives & Damage
  lives: number;
  maxLives: number;
  lastDamageTime: number;
  isInvincible: boolean;
  
  // Game Over
  isGameOver: boolean;
  showGameOver: boolean;
  gameOverStats: GameOverStats;
  
  // Mystery Boxes
  mysteryBoxesFound: Set<string>;
  vouchers: Voucher[];
  
  // Destructibles
  destructibles: DestructibleState[];
  destroyedObjects: Set<string>;
  
  // Punching
  isPunching: boolean;
  isChargingPunch: boolean;
  punchChargeStart: number | null;
  nearbyDestructible: string | null;
  
  // Questions
  currentQuestion: Question | null;
  questionsAnswered: number;
  wrongAnswers: number;
  pendingBoxId: string | null;
  
  // Traps
  traps: TrapState[];
  triggeredTraps: Set<string>;
  
  // Stats
  totalBoxesFound: number;
  totalVouchersUsed: number;
  totalDeathsByTraps: number;
  
  // UI State
  showDamageOverlay: boolean;
  showVoucherPopup: Voucher | null;
  showDecoyTroll: boolean;
  
  // Actions
  addCoins: (amount: number) => void;
  addXP: (amount: number) => void;
  visitShop: (shopId: string) => void;
  collectCoin: (coinId: string) => void;
  
  // Hunt Actions
  startHunt: () => void;
  endHunt: () => void;
  collectBox: (boxId: string) => void;
  triggerDecoy: (boxId: string) => void;
  
  // Damage Actions
  takeDamage: (amount?: number) => void;
  resetLives: () => void;
  
  // Game Over Actions
  restartGame: () => void;
  
  // Punch Actions
  startPunch: () => void;
  endPunch: () => void;
  startChargePunch: () => void;
  endChargePunch: () => void;
  setNearbyDestructible: (id: string | null) => void;
  damageDestructible: (id: string, damage: number) => void;
  
  // Question Actions
  showQuestion: (question: Question, boxId: string) => void;
  answerQuestion: (answerIndex: number) => boolean;
  closeQuestion: () => void;
  
  // Voucher Actions
  useVoucher: (voucherId: string) => void;
  closeVoucherPopup: () => void;
  
  // Trap Actions
  triggerTrap: (trapId: string) => void;
  
  // UI Actions
  hideDamageOverlay: () => void;
  hideDecoyTroll: () => void;
};

const XP_PER_LEVEL = 200;
const HUNT_DURATION = 4 * 60 * 1000; // 4 minutes
const HUNT_COOLDOWN = 30 * 1000; // 30 seconds
const INVINCIBILITY_DURATION = 2000; // 2 seconds

// Question bank
const QUESTION_BANK: Question[] = [
  {
    id: 'q1',
    type: 'math',
    question: 'What is 7 + 8?',
    options: ['13', '15', '16', '14'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'q2',
    type: 'sequence',
    question: 'What comes next? 2, 4, 8, 16, ?',
    options: ['24', '32', '28', '30'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'q3',
    type: 'pattern',
    question: 'Remember the pattern!',
    options: ['🔴', '🔵', '🟢', '🟡'],
    correctIndex: 2,
    difficulty: 'medium',
    pattern: ['🔴', '🔵', '🟢'],
    showTime: 3000,
  },
  {
    id: 'q4',
    type: 'math',
    question: 'What is 12 × 12?',
    options: ['124', '144', '132', '156'],
    correctIndex: 1,
    difficulty: 'hard',
  },
  {
    id: 'q5',
    type: 'emoji',
    question: 'Which emoji was NOT in the sequence? 🎮⭐🎁',
    options: ['🎮', '⭐', '🏆', '🎁'],
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 'q6',
    type: 'sequence',
    question: 'What comes next? 1, 1, 2, 3, 5, ?',
    options: ['7', '8', '6', '9'],
    correctIndex: 1,
    difficulty: 'hard',
  },
];

// Mystery box spawn positions (hard to find spots)
const MYSTERY_BOX_SPAWNS: { position: [number, number, number]; difficulty: 'easy' | 'medium' | 'hard' }[] = [
  // Easy spots
  { position: [15, 0.5, 30], difficulty: 'easy' },
  { position: [-15, 0.5, 35], difficulty: 'easy' },
  { position: [30, 0.5, 5], difficulty: 'easy' },
  { position: [-30, 0.5, -5], difficulty: 'easy' },
  { position: [5, 0.5, -40], difficulty: 'easy' },
  
  // Medium spots (behind buildings, corners)
  { position: [22, 0.5, 42], difficulty: 'medium' },
  { position: [-22, 0.5, -42], difficulty: 'medium' },
  { position: [55, 0.5, 15], difficulty: 'medium' },
  { position: [-55, 0.5, -15], difficulty: 'medium' },
  { position: [12, 0.5, -55], difficulty: 'medium' },
  
  // Hard spots (hidden areas, near traps)
  { position: [0, 1.2, 0], difficulty: 'hard' }, // On fountain
  { position: [58, 0.5, 48], difficulty: 'hard' }, // Near lake
  { position: [-58, 0.5, -48], difficulty: 'hard' }, // Near lake
  { position: [45, 0.5, 42], difficulty: 'hard' }, // Park corner
  { position: [-45, 0.5, 42], difficulty: 'hard' }, // Park corner
];

// Destructible positions
const DESTRUCTIBLE_SPAWNS: Omit<DestructibleState, 'destroyed'>[] = [
  { id: 'cardboard1', type: 'cardboard', position: [15, 0.5, 32], maxHp: 1, currentHp: 1 },
  { id: 'cardboard2', type: 'cardboard', position: [-15, 0.5, 38], maxHp: 1, currentHp: 1 },
  { id: 'cardboard3', type: 'cardboard', position: [25, 0.5, 8], maxHp: 1, currentHp: 1 },
  { id: 'crate1', type: 'crate', position: [40, 0.5, 12], maxHp: 3, currentHp: 3 },
  { id: 'crate2', type: 'crate', position: [-40, 0.5, -12], maxHp: 3, currentHp: 3 },
  { id: 'trash1', type: 'trash', position: [8, 0.5, 42], maxHp: 2, currentHp: 2 },
  { id: 'trash2', type: 'trash', position: [-8, 0.5, -42], maxHp: 2, currentHp: 2 },
  { id: 'vending1', type: 'vending', position: [20, 0.5, 22], maxHp: 5, currentHp: 5 },
];

// Trap positions
const TRAP_SPAWNS: TrapState[] = [
  { id: 'spike1', type: 'spike', position: [5, 0, 20], isActive: false, pattern: { activeTime: 1000, cooldownTime: 2000 } },
  { id: 'spike2', type: 'spike', position: [-5, 0, -20], isActive: false, pattern: { activeTime: 1000, cooldownTime: 2500 } },
  { id: 'spike3', type: 'spike', position: [35, 0, 5], isActive: false, pattern: { activeTime: 800, cooldownTime: 2000 } },
  { id: 'laser1', type: 'laser', position: [0, 1, 30], isActive: true, pattern: { activeTime: 2000, cooldownTime: 1500 } },
  { id: 'laser2', type: 'laser', position: [50, 1, 0], isActive: true, pattern: { activeTime: 1500, cooldownTime: 2000 } },
  { id: 'pressure1', type: 'pressure', position: [10, 0, 15], isActive: false, pattern: { activeTime: 500, cooldownTime: 3000 } },
];

function generateHuntBoxes(): BoxSpawn[] {
  const boxes: BoxSpawn[] = [];
  const shuffled = [...MYSTERY_BOX_SPAWNS].sort(() => Math.random() - 0.5);
  
  // 5-7 common boxes (easy-medium spots)
  const commonCount = 5 + Math.floor(Math.random() * 3);
  const easyMediumSpots = shuffled.filter(s => s.difficulty !== 'hard');
  for (let i = 0; i < Math.min(commonCount, easyMediumSpots.length); i++) {
    boxes.push({
      id: `common-${i}`,
      position: easyMediumSpots[i].position,
      rarity: 'common',
      isMoving: false,
      collected: false,
    });
  }
  
  // 2-3 rare boxes (medium-hard spots)
  const rareCount = 2 + Math.floor(Math.random() * 2);
  const hardSpots = shuffled.filter(s => s.difficulty === 'hard' || s.difficulty === 'medium');
  for (let i = 0; i < Math.min(rareCount, hardSpots.length); i++) {
    boxes.push({
      id: `rare-${i}`,
      position: hardSpots[i].position,
      rarity: 'rare',
      isMoving: Math.random() > 0.5, // 50% chance to move
      collected: false,
    });
  }
  
  // 0-1 legendary box (hard spots only, 60% chance)
  if (Math.random() > 0.4) {
    const legendarySpots = shuffled.filter(s => s.difficulty === 'hard');
    if (legendarySpots.length > 0) {
      const spot = legendarySpots[Math.floor(Math.random() * legendarySpots.length)];
      boxes.push({
        id: 'legendary-0',
        position: spot.position,
        rarity: 'legendary',
        isMoving: false,
        collected: false,
      });
    }
  }
  
  // 1-2 decoy boxes
  const decoyCount = 1 + Math.floor(Math.random() * 2);
  const remainingSpots = shuffled.filter(s => !boxes.some(b => 
    b.position[0] === s.position[0] && b.position[2] === s.position[2]
  ));
  for (let i = 0; i < Math.min(decoyCount, remainingSpots.length); i++) {
    boxes.push({
      id: `decoy-${i}`,
      position: remainingSpots[i].position,
      rarity: 'decoy',
      isMoving: false,
      collected: false,
    });
  }
  
  return boxes;
}

function generateVoucher(rarity: BoxRarity): Voucher {
  let discountPercent: number;
  
  switch (rarity) {
    case 'legendary':
      discountPercent = 100; // FREE!
      break;
    case 'rare':
      discountPercent = 20 + Math.floor(Math.random() * 21); // 20-40%
      break;
    default:
      discountPercent = 5 + Math.floor(Math.random() * 11); // 5-15%
  }
  
  return {
    id: `voucher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    boxType: rarity,
    discountPercent,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    isUsed: false,
  };
}

function getRandomQuestion(difficulty: 'easy' | 'medium' | 'hard'): Question {
  const filtered = QUESTION_BANK.filter(q => q.difficulty === difficulty);
  return filtered[Math.floor(Math.random() * filtered.length)] || QUESTION_BANK[0];
}

export const useGameStore = create<GameState>((set, get) => ({
  // Existing state
  coins: 100,
  xp: 0,
  level: 1,
  shopsVisited: new Set(),
  coinsCollected: new Set(),
  
  // Hunt System
  isHuntActive: false,
  huntEndTime: null,
  huntCooldownEndTime: null,
  boxSpawns: [],
  totalBoxesThisHunt: 0,
  huntStreak: 0,
  
  // Lives & Damage
  lives: 3,
  maxLives: 3,
  lastDamageTime: 0,
  isInvincible: false,
  
  // Game Over
  isGameOver: false,
  showGameOver: false,
  gameOverStats: { boxesFound: 0, coinsCollected: 0, vouchersEarned: 0, deathsByHazards: 0 },
  
  // Mystery Boxes
  mysteryBoxesFound: new Set(),
  vouchers: [],
  
  // Destructibles
  destructibles: DESTRUCTIBLE_SPAWNS.map(d => ({ ...d, destroyed: false })),
  destroyedObjects: new Set(),
  
  // Punching
  isPunching: false,
  isChargingPunch: false,
  punchChargeStart: null,
  nearbyDestructible: null,
  
  // Questions
  currentQuestion: null,
  questionsAnswered: 0,
  wrongAnswers: 0,
  pendingBoxId: null,
  
  // Traps
  traps: TRAP_SPAWNS,
  triggeredTraps: new Set(),
  
  // Stats
  totalBoxesFound: 0,
  totalVouchersUsed: 0,
  totalDeathsByTraps: 0,
  
  // UI State
  showDamageOverlay: false,
  showVoucherPopup: null,
  showDecoyTroll: false,

  // Existing actions
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

  // Hunt Actions
  startHunt: () => {
    const boxes = generateHuntBoxes();
    set({
      isHuntActive: true,
      huntEndTime: Date.now() + HUNT_DURATION,
      huntCooldownEndTime: null,
      boxSpawns: boxes,
      totalBoxesThisHunt: boxes.filter(b => b.rarity !== 'decoy').length,
      wrongAnswers: 0,
    });
  },
  
  endHunt: () => {
    const state = get();
    const boxesFound = state.boxSpawns.filter(b => b.collected && b.rarity !== 'decoy').length;
    const allFound = boxesFound === state.totalBoxesThisHunt;
    
    set({
      isHuntActive: false,
      huntEndTime: null,
      huntCooldownEndTime: Date.now() + HUNT_COOLDOWN,
      boxSpawns: [],
      huntStreak: allFound ? state.huntStreak + 1 : 0,
    });
  },
  
  collectBox: (boxId) => {
    const state = get();
    const box = state.boxSpawns.find(b => b.id === boxId);
    
    if (!box || box.collected) return;
    
    // For rare/legendary boxes, show a question first
    if (box.rarity === 'rare' || box.rarity === 'legendary') {
      const difficulty = box.rarity === 'legendary' ? 'hard' : 'medium';
      const question = getRandomQuestion(difficulty);
      set({
        currentQuestion: question,
        pendingBoxId: boxId,
        wrongAnswers: 0,
      });
      return;
    }
    
    // Common box - collect immediately
    const voucher = generateVoucher(box.rarity);
    const newBoxes = state.boxSpawns.map(b => 
      b.id === boxId ? { ...b, collected: true } : b
    );
    const newFound = new Set(state.mysteryBoxesFound);
    newFound.add(boxId);
    
    set({
      boxSpawns: newBoxes,
      mysteryBoxesFound: newFound,
      vouchers: [...state.vouchers, voucher],
      showVoucherPopup: voucher,
      totalBoxesFound: state.totalBoxesFound + 1,
      xp: state.xp + 25,
    });
  },
  
  triggerDecoy: (boxId) => {
    const state = get();
    const newBoxes = state.boxSpawns.map(b => 
      b.id === boxId ? { ...b, collected: true } : b
    );
    set({
      boxSpawns: newBoxes,
      showDecoyTroll: true,
    });
    
    // Auto-hide after 2 seconds
    setTimeout(() => {
      set({ showDecoyTroll: false });
    }, 2000);
  },

  // Damage Actions
  takeDamage: (amount: number = 1) => {
    const state = get();
    const now = Date.now();
    
    // Check invincibility
    if (state.isInvincible || now - state.lastDamageTime < INVINCIBILITY_DURATION) {
      return;
    }
    
    const newLives = Math.max(0, state.lives - amount);
    
    // GAME OVER when lives reach 0
    if (newLives <= 0) {
      set({
        lives: 0,
        isGameOver: true,
        showGameOver: true,
        isHuntActive: false,
        huntEndTime: null,
        gameOverStats: {
          boxesFound: state.mysteryBoxesFound.size,
          coinsCollected: state.coinsCollected.size,
          vouchersEarned: state.vouchers.length,
          deathsByHazards: state.totalDeathsByTraps + 1,
        },
        showDamageOverlay: true,
        totalDeathsByTraps: state.totalDeathsByTraps + 1,
      });
      
      setTimeout(() => {
        set({ showDamageOverlay: false });
      }, 500);
      return;
    }
    
    set({
      lives: newLives,
      lastDamageTime: now,
      isInvincible: true,
      showDamageOverlay: true,
    });
    
    // Remove invincibility after duration
    setTimeout(() => {
      set({ isInvincible: false });
    }, INVINCIBILITY_DURATION);
    
    // Hide damage overlay after 500ms
    setTimeout(() => {
      set({ showDamageOverlay: false });
    }, 500);
  },
  
  resetLives: () => set({ lives: 3 }),
  
  // Game Over Actions
  restartGame: () => {
    set({
      lives: 3,
      isGameOver: false,
      showGameOver: false,
      isHuntActive: false,
      huntEndTime: null,
      huntCooldownEndTime: null,
      boxSpawns: [],
      mysteryBoxesFound: new Set(),
      coinsCollected: new Set(),
      gameOverStats: { boxesFound: 0, coinsCollected: 0, vouchersEarned: 0, deathsByHazards: 0 },
    });
  },

  // Punch Actions
  startPunch: () => set({ isPunching: true }),
  endPunch: () => set({ isPunching: false }),
  startChargePunch: () => set({ isChargingPunch: true, punchChargeStart: Date.now() }),
  endChargePunch: () => set({ isChargingPunch: false, punchChargeStart: null }),
  setNearbyDestructible: (id) => set({ nearbyDestructible: id }),
  
  damageDestructible: (id, damage) => {
    const state = get();
    const destructible = state.destructibles.find(d => d.id === id);
    
    if (!destructible || destructible.destroyed) return;
    
    const newHp = Math.max(0, destructible.currentHp - damage);
    const destroyed = newHp <= 0;
    
    const newDestructibles = state.destructibles.map(d => 
      d.id === id ? { ...d, currentHp: newHp, destroyed } : d
    );
    
    if (destroyed) {
      const newDestroyed = new Set(state.destroyedObjects);
      newDestroyed.add(id);
      
      // Random reward
      const rewardChance = Math.random();
      let coinReward = 0;
      
      if (destructible.type === 'vending') {
        coinReward = 50; // Guaranteed reward from vending
      } else if (rewardChance > 0.4) {
        coinReward = destructible.type === 'crate' ? 20 : 10;
      }
      
      set({
        destructibles: newDestructibles,
        destroyedObjects: newDestroyed,
        coins: state.coins + coinReward,
        xp: state.xp + (destroyed ? 15 : 0),
      });
    } else {
      set({ destructibles: newDestructibles });
    }
  },

  // Question Actions
  showQuestion: (question, boxId) => set({ 
    currentQuestion: question, 
    pendingBoxId: boxId,
    wrongAnswers: 0,
  }),
  
  answerQuestion: (answerIndex) => {
    const state = get();
    if (!state.currentQuestion || !state.pendingBoxId) return false;
    
    const correct = answerIndex === state.currentQuestion.correctIndex;
    
    if (correct) {
      // Collect the box
      const box = state.boxSpawns.find(b => b.id === state.pendingBoxId);
      if (box) {
        const voucher = generateVoucher(box.rarity);
        const newBoxes = state.boxSpawns.map(b => 
          b.id === state.pendingBoxId ? { ...b, collected: true } : b
        );
        const newFound = new Set(state.mysteryBoxesFound);
        newFound.add(state.pendingBoxId);
        
        const xpReward = box.rarity === 'legendary' ? 100 : 50;
        
        set({
          boxSpawns: newBoxes,
          mysteryBoxesFound: newFound,
          vouchers: [...state.vouchers, voucher],
          showVoucherPopup: voucher,
          totalBoxesFound: state.totalBoxesFound + 1,
          currentQuestion: null,
          pendingBoxId: null,
          questionsAnswered: state.questionsAnswered + 1,
          wrongAnswers: 0,
          xp: state.xp + xpReward,
        });
      }
      return true;
    } else {
      const newWrongAnswers = state.wrongAnswers + 1;
      
      if (newWrongAnswers >= 3) {
        // Box disappears!
        const newBoxes = state.boxSpawns.map(b => 
          b.id === state.pendingBoxId ? { ...b, collected: true } : b // Mark as collected so it disappears
        );
        set({
          boxSpawns: newBoxes,
          currentQuestion: null,
          pendingBoxId: null,
          wrongAnswers: 0,
        });
      } else {
        set({ wrongAnswers: newWrongAnswers });
      }
      return false;
    }
  },
  
  closeQuestion: () => set({ currentQuestion: null, pendingBoxId: null, wrongAnswers: 0 }),

  // Voucher Actions
  useVoucher: (voucherId) => {
    const state = get();
    const newVouchers = state.vouchers.map(v => 
      v.id === voucherId ? { ...v, isUsed: true } : v
    );
    set({
      vouchers: newVouchers,
      totalVouchersUsed: state.totalVouchersUsed + 1,
    });
  },
  
  closeVoucherPopup: () => set({ showVoucherPopup: null }),

  // Trap Actions
  triggerTrap: (trapId) => {
    const state = get();
    const newTriggered = new Set(state.triggeredTraps);
    newTriggered.add(trapId);
    set({ triggeredTraps: newTriggered });
  },

  // UI Actions
  hideDamageOverlay: () => set({ showDamageOverlay: false }),
  hideDecoyTroll: () => set({ showDecoyTroll: false }),
}));
