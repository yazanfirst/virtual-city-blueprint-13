export type LevelNumber = 1 | 2 | 3 | 4 | 5;

export interface ZombieLevelConfig {
  level: LevelNumber;
  zombieCount: number;
  zombieSpeed: number;
  minSpawnDistance: number;
  activeTrapCount: number;
  timeLimit: number;
  lives: number;
}

export interface GhostHuntLevelConfig {
  level: LevelNumber;
  timeLimit: number;
  requiredCaptures: number;
  ghostCount: number;
  ghostSpeedMultiplier: number;
  emfDrainPerSecond: number;
  flashlightDrainPerUse: number;
  trapCharges: number;
  playerLives: number;
}

export interface MirrorWorldLevelConfig {
  level: LevelNumber;
  requiredAnchors: number;
  baseTime: number;
  anchorBonus: number;
  shadowSpeed: number;
  shadowCount: number;
  collisionDistance: number;
  lives: number;
  chaseAnchorSpeed: number;
}

export const ZOMBIE_LEVELS: ZombieLevelConfig[] = [
  { level: 1, zombieCount: 6, zombieSpeed: 0.042, minSpawnDistance: 38, activeTrapCount: 6, timeLimit: 120, lives: 4 },
  { level: 2, zombieCount: 8, zombieSpeed: 0.047, minSpawnDistance: 32, activeTrapCount: 9, timeLimit: 110, lives: 3 },
  { level: 3, zombieCount: 10, zombieSpeed: 0.053, minSpawnDistance: 26, activeTrapCount: 12, timeLimit: 100, lives: 3 },
  { level: 4, zombieCount: 11, zombieSpeed: 0.059, minSpawnDistance: 20, activeTrapCount: 14, timeLimit: 92, lives: 2 },
  { level: 5, zombieCount: 12, zombieSpeed: 0.065, minSpawnDistance: 15, activeTrapCount: 16, timeLimit: 85, lives: 2 },
];

export const GHOST_HUNT_LEVELS: GhostHuntLevelConfig[] = [
  { level: 1, timeLimit: 90, requiredCaptures: 2, ghostCount: 3, ghostSpeedMultiplier: 1, emfDrainPerSecond: 1, flashlightDrainPerUse: 10, trapCharges: 4, playerLives: 3 },
  { level: 2, timeLimit: 85, requiredCaptures: 3, ghostCount: 4, ghostSpeedMultiplier: 1.1, emfDrainPerSecond: 2, flashlightDrainPerUse: 12, trapCharges: 3, playerLives: 3 },
  { level: 3, timeLimit: 80, requiredCaptures: 3, ghostCount: 5, ghostSpeedMultiplier: 1.15, emfDrainPerSecond: 2, flashlightDrainPerUse: 15, trapCharges: 3, playerLives: 2 },
  { level: 4, timeLimit: 75, requiredCaptures: 4, ghostCount: 6, ghostSpeedMultiplier: 1.2, emfDrainPerSecond: 3, flashlightDrainPerUse: 18, trapCharges: 2, playerLives: 2 },
  { level: 5, timeLimit: 70, requiredCaptures: 4, ghostCount: 7, ghostSpeedMultiplier: 1.25, emfDrainPerSecond: 3, flashlightDrainPerUse: 20, trapCharges: 2, playerLives: 2 },
];

export const MIRROR_WORLD_LEVELS: MirrorWorldLevelConfig[] = [
  { level: 1, requiredAnchors: 2, baseTime: 110, anchorBonus: 10, shadowSpeed: 0.35, shadowCount: 1, collisionDistance: 1.8, lives: 3, chaseAnchorSpeed: 0.08 },
  { level: 2, requiredAnchors: 3, baseTime: 105, anchorBonus: 9, shadowSpeed: 0.4, shadowCount: 2, collisionDistance: 1.9, lives: 3, chaseAnchorSpeed: 0.1 },
  { level: 3, requiredAnchors: 4, baseTime: 100, anchorBonus: 8, shadowSpeed: 0.45, shadowCount: 2, collisionDistance: 2, lives: 2, chaseAnchorSpeed: 0.11 },
  { level: 4, requiredAnchors: 5, baseTime: 95, anchorBonus: 8, shadowSpeed: 0.5, shadowCount: 3, collisionDistance: 2, lives: 2, chaseAnchorSpeed: 0.12 },
  { level: 5, requiredAnchors: 5, baseTime: 90, anchorBonus: 7, shadowSpeed: 0.55, shadowCount: 3, collisionDistance: 2.1, lives: 2, chaseAnchorSpeed: 0.13 },
];

export const getZombieLevelConfig = (level: number) =>
  ZOMBIE_LEVELS.find((config) => config.level === level) ?? ZOMBIE_LEVELS[0];

export const getGhostHuntLevelConfig = (level: number) =>
  GHOST_HUNT_LEVELS.find((config) => config.level === level) ?? GHOST_HUNT_LEVELS[0];

export const getMirrorWorldLevelConfig = (level: number) =>
  MIRROR_WORLD_LEVELS.find((config) => config.level === level) ?? MIRROR_WORLD_LEVELS[0];
