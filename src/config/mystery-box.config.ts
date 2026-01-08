// Mystery Box Configuration - DB-ready structure
// All templates and configs can later migrate to database tables

export type ClueType = 'symbolic' | 'spatial' | 'exclusionary';
export type IndicatorType = 'billboard' | 'arrow' | 'glow' | 'flag' | 'flicker';
export type DecoyTell = 'glitch' | 'fade' | 'reversed' | 'cold';

// Symbolic clues - poetic hints about category/theme
export interface SymbolicClueTemplate {
  id: string;
  pattern: string;
  categories: string[];
}

export const SYMBOLIC_CLUES: SymbolicClueTemplate[] = [
  { id: 'heat', pattern: 'Where flames dance and spices sing, seek the hidden thing.', categories: ['restaurant', 'fast-food', 'grill'] },
  { id: 'sweet', pattern: 'Sugar and dreams await the seeker of sweetness.', categories: ['bakery', 'dessert', 'ice-cream'] },
  { id: 'brew', pattern: 'Liquid warmth rises in a cup of comfort.', categories: ['cafe', 'coffee', 'tea'] },
  { id: 'feast', pattern: 'Tables laden with culinary tales hold secrets.', categories: ['restaurant', 'dining'] },
  { id: 'quick', pattern: 'Fast bites for the hurried soul conceal treasures.', categories: ['fast-food', 'quick-service'] },
  { id: 'fresh', pattern: 'The garden\'s bounty whispers of hidden rewards.', categories: ['salad', 'healthy', 'organic'] },
  { id: 'sizzle', pattern: 'Where oil meets flame, fortune awaits.', categories: ['grill', 'bbq', 'steakhouse'] },
  { id: 'chill', pattern: 'Cold delights freeze time around the prize.', categories: ['ice-cream', 'frozen', 'smoothie'] },
  { id: 'dough', pattern: 'Kneaded with care, risen to perfection, it hides.', categories: ['bakery', 'pizza', 'bread'] },
  { id: 'exotic', pattern: 'Flavors from distant lands guard this secret.', categories: ['asian', 'mexican', 'indian', 'international'] },
];

// Spatial clues - position-based hints
export interface SpatialClueTemplate {
  id: string;
  pattern: string;
  filterFn: (shopX: number, shopZ: number, allShops: { x: number; z: number }[]) => boolean;
}

export const SPATIAL_CLUES: SpatialClueTemplate[] = [
  { 
    id: 'north', 
    pattern: 'Look where the numbers rise, toward the city\'s crown.',
    filterFn: (x, z, all) => {
      const medianZ = all.map(s => s.z).sort((a, b) => a - b)[Math.floor(all.length / 2)];
      return z > medianZ;
    }
  },
  { 
    id: 'south', 
    pattern: 'The treasure hides where shadows grow long, at the street\'s end.',
    filterFn: (x, z, all) => {
      const medianZ = all.map(s => s.z).sort((a, b) => a - b)[Math.floor(all.length / 2)];
      return z < medianZ;
    }
  },
  { 
    id: 'east', 
    pattern: 'The morning sun knows the way. Follow its light.',
    filterFn: (x, z, all) => {
      const medianX = all.map(s => s.x).sort((a, b) => a - b)[Math.floor(all.length / 2)];
      return x > medianX;
    }
  },
  { 
    id: 'west', 
    pattern: 'Follow the setting sun to find what you seek.',
    filterFn: (x, z, all) => {
      const medianX = all.map(s => s.x).sort((a, b) => a - b)[Math.floor(all.length / 2)];
      return x < medianX;
    }
  },
  { 
    id: 'center', 
    pattern: 'At the heart of commerce, where paths converge.',
    filterFn: (x, z) => Math.abs(x) < 12 && Math.abs(z) < 20
  },
  { 
    id: 'edge', 
    pattern: 'On the periphery, away from the bustling center.',
    filterFn: (x, z) => Math.abs(x) >= 12 || Math.abs(z) >= 20
  },
  { 
    id: 'left_side', 
    pattern: 'Stand at the entrance, look left. The prize awaits.',
    filterFn: (x) => x < 0
  },
  { 
    id: 'right_side', 
    pattern: 'Stand at the entrance, look right. Fortune favors the bold.',
    filterFn: (x) => x > 0
  },
];

// Exclusionary clues - eliminate wrong options
export interface ExclusionaryClueTemplate {
  id: string;
  pattern: string;
  excludeCategories?: string[];
  filterFn?: (shopX: number, shopZ: number) => boolean;
}

export const EXCLUSIONARY_CLUES: ExclusionaryClueTemplate[] = [
  { 
    id: 'not_sweet', 
    pattern: 'Not where sweetness reigns supreme. Avoid the sugar temples.',
    excludeCategories: ['bakery', 'dessert', 'ice-cream']
  },
  { 
    id: 'not_hot', 
    pattern: 'Away from the kitchen\'s fire. Cold establishments only.',
    excludeCategories: ['restaurant', 'fast-food', 'grill', 'bbq']
  },
  { 
    id: 'not_drinks', 
    pattern: 'No liquid gold here. The treasure prefers solid ground.',
    excludeCategories: ['cafe', 'coffee', 'bar', 'smoothie']
  },
  { 
    id: 'not_corner', 
    pattern: 'Avoid the corners. The prize prefers the middle ground.',
    filterFn: (x, z) => !(Math.abs(x) > 15 && Math.abs(z) > 30)
  },
  { 
    id: 'not_front', 
    pattern: 'Not at the street\'s mouth. Venture deeper.',
    filterFn: (x, z) => z < 25
  },
  { 
    id: 'not_back', 
    pattern: 'Not in the shadows of the street\'s end. Stay visible.',
    filterFn: (x, z) => z > -40
  },
];

// Indicator configuration
export interface IndicatorConfig {
  type: IndicatorType;
  trueColor: string;
  decoyColor: string;
  glowIntensity: number;
  description: string;
}

export const INDICATOR_CONFIGS: Record<IndicatorType, IndicatorConfig> = {
  billboard: {
    type: 'billboard',
    trueColor: '#FFD700',
    decoyColor: '#8B7500',
    glowIntensity: 1.5,
    description: 'A glowing billboard with a mystery symbol'
  },
  arrow: {
    type: 'arrow',
    trueColor: '#00FF88',
    decoyColor: '#004422',
    glowIntensity: 1.2,
    description: 'An arrow pointing toward secrets'
  },
  glow: {
    type: 'glow',
    trueColor: '#FF69B4',
    decoyColor: '#4A1F3D',
    glowIntensity: 2.0,
    description: 'A mysterious aura surrounds this place'
  },
  flag: {
    type: 'flag',
    trueColor: '#00BFFF',
    decoyColor: '#003344',
    glowIntensity: 1.0,
    description: 'A banner flutters with hidden meaning'
  },
  flicker: {
    type: 'flicker',
    trueColor: '#FFAA00',
    decoyColor: '#332200',
    glowIntensity: 1.8,
    description: 'Windows pulse with inner light'
  },
};

// Decoy tell behaviors
export const DECOY_TELL_BEHAVIORS: Record<DecoyTell, { description: string; intensity: number }> = {
  glitch: { description: 'Position wobbles erratically', intensity: 0.3 },
  fade: { description: 'Opacity pulses between 50-100%', intensity: 0.5 },
  reversed: { description: 'Arrow points wrong direction', intensity: 1.0 },
  cold: { description: 'Cold blue tint instead of warm', intensity: 0.7 },
};

// Mission configuration
export const MISSION_CONFIG = {
  maxShopVisits: 3,
  clueRevealCost: 1, // Number of visits to unlock next clue
  boxCollectionReward: {
    coins: 50,
    xp: 100,
  },
  streakBonusMultiplier: 1.5,
  maxDecoyIndicators: 2,
  minDecoyIndicators: 0,
} as const;

// Seeded random number generator for determinism
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

// Generate a session seed based on current time (changes each session)
export function generateSessionSeed(): number {
  return Math.floor(Date.now() / 1000) ^ Math.floor(Math.random() * 1000000);
}
