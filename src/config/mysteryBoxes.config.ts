// Mystery Box Configuration - DB-ready static config
// Later can be replaced with database rows without changing logic

export type BoxRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type RewardType = 'coins' | 'gems' | 'xp' | 'mystery';

export type Reward = {
  type: RewardType;
  amount: number;
  label: string;
};

export type MysteryBoxConfig = {
  id: string;
  position: [number, number, number];
  rarity: BoxRarity;
  respawnSeconds: number;
};

// Rarity visual configs
export const RARITY_CONFIG: Record<BoxRarity, {
  color: string;
  glowColor: string;
  particleColor: string;
  glowIntensity: number;
  scale: number;
  spinSpeed: number;
  bounceHeight: number;
}> = {
  common: {
    color: '#CD7F32', // Bronze
    glowColor: '#FFD700',
    particleColor: '#FFA500',
    glowIntensity: 0.5,
    scale: 0.8,
    spinSpeed: 1,
    bounceHeight: 0.15,
  },
  rare: {
    color: '#C0C0C0', // Silver
    glowColor: '#87CEEB',
    particleColor: '#00BFFF',
    glowIntensity: 0.7,
    scale: 0.9,
    spinSpeed: 1.5,
    bounceHeight: 0.2,
  },
  epic: {
    color: '#FFD700', // Gold
    glowColor: '#FF69B4',
    particleColor: '#FF1493',
    glowIntensity: 1.0,
    scale: 1.0,
    spinSpeed: 2,
    bounceHeight: 0.25,
  },
  legendary: {
    color: '#E0FFFF', // Diamond/Crystal
    glowColor: '#00FFFF',
    particleColor: '#FF00FF',
    glowIntensity: 1.5,
    scale: 1.1,
    spinSpeed: 2.5,
    bounceHeight: 0.3,
  },
};

// Reward tables by rarity
export const REWARD_TABLES: Record<BoxRarity, { reward: Reward; weight: number }[]> = {
  common: [
    { reward: { type: 'coins', amount: 5, label: '+5 Coins' }, weight: 50 },
    { reward: { type: 'coins', amount: 10, label: '+10 Coins' }, weight: 30 },
    { reward: { type: 'xp', amount: 10, label: '+10 XP' }, weight: 15 },
    { reward: { type: 'gems', amount: 1, label: '+1 Gem' }, weight: 5 },
  ],
  rare: [
    { reward: { type: 'coins', amount: 15, label: '+15 Coins' }, weight: 35 },
    { reward: { type: 'coins', amount: 25, label: '+25 Coins' }, weight: 25 },
    { reward: { type: 'xp', amount: 25, label: '+25 XP' }, weight: 20 },
    { reward: { type: 'gems', amount: 2, label: '+2 Gems' }, weight: 15 },
    { reward: { type: 'gems', amount: 5, label: '+5 Gems' }, weight: 5 },
  ],
  epic: [
    { reward: { type: 'coins', amount: 50, label: '+50 Coins' }, weight: 30 },
    { reward: { type: 'coins', amount: 75, label: '+75 Coins' }, weight: 20 },
    { reward: { type: 'xp', amount: 50, label: '+50 XP' }, weight: 15 },
    { reward: { type: 'gems', amount: 5, label: '+5 Gems' }, weight: 20 },
    { reward: { type: 'gems', amount: 10, label: '+10 Gems' }, weight: 10 },
    { reward: { type: 'mystery', amount: 1, label: 'Mystery Prize!' }, weight: 5 },
  ],
  legendary: [
    { reward: { type: 'coins', amount: 100, label: '+100 Coins' }, weight: 20 },
    { reward: { type: 'coins', amount: 200, label: '+200 Coins' }, weight: 15 },
    { reward: { type: 'xp', amount: 100, label: '+100 XP' }, weight: 15 },
    { reward: { type: 'gems', amount: 15, label: '+15 Gems' }, weight: 20 },
    { reward: { type: 'gems', amount: 25, label: '+25 Gems' }, weight: 15 },
    { reward: { type: 'mystery', amount: 1, label: 'JACKPOT!' }, weight: 15 },
  ],
};

// Mystery box spawn locations (DB-ready - can be fetched from DB later)
export const MYSTERY_BOXES: MysteryBoxConfig[] = [
  // Common boxes - scattered around main areas
  { id: 'box_common_1', position: [15, 0.5, 30], rarity: 'common', respawnSeconds: 30 },
  { id: 'box_common_2', position: [-15, 0.5, 25], rarity: 'common', respawnSeconds: 30 },
  { id: 'box_common_3', position: [35, 0.5, 8], rarity: 'common', respawnSeconds: 30 },
  { id: 'box_common_4', position: [-35, 0.5, -8], rarity: 'common', respawnSeconds: 30 },
  { id: 'box_common_5', position: [5, 0.5, -25], rarity: 'common', respawnSeconds: 30 },
  { id: 'box_common_6', position: [-5, 0.5, -40], rarity: 'common', respawnSeconds: 30 },
  
  // Rare boxes - slightly hidden spots
  { id: 'box_rare_1', position: [50, 0.5, 12], rarity: 'rare', respawnSeconds: 60 },
  { id: 'box_rare_2', position: [-50, 0.5, 5], rarity: 'rare', respawnSeconds: 60 },
  { id: 'box_rare_3', position: [8, 0.5, 45], rarity: 'rare', respawnSeconds: 60 },
  { id: 'box_rare_4', position: [-8, 0.5, -50], rarity: 'rare', respawnSeconds: 60 },
  
  // Epic boxes - special locations
  { id: 'box_epic_1', position: [55, 0.5, -15], rarity: 'epic', respawnSeconds: 120 },
  { id: 'box_epic_2', position: [-55, 0.5, -42], rarity: 'epic', respawnSeconds: 120 },
  
  // Legendary box - very rare, center of action
  { id: 'box_legend_1', position: [0, 0.5, 5], rarity: 'legendary', respawnSeconds: 300 },
];

// Helper function to pick random reward based on weights
export function pickRandomReward(rarity: BoxRarity): Reward {
  const table = REWARD_TABLES[rarity];
  const totalWeight = table.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of table) {
    random -= item.weight;
    if (random <= 0) {
      return item.reward;
    }
  }
  
  return table[0].reward;
}
