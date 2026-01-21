import { create } from 'zustand';

// Drone patrol behavior types
export type DroneType = 'patrol' | 'sentinel' | 'hunter' | 'scanner';

// Mission phases
export type HeistPhase =
  | 'inactive'
  | 'briefing'
  | 'infiltrating'
  | 'hacking'
  | 'escaping'
  | 'completed'
  | 'failed';

// Reason for mission failure
export type HeistFailReason = 'detected' | 'laser' | 'time' | 'hacking';

// Security drone data structure
export interface DroneData {
  id: string;
  type: DroneType;
  position: [number, number, number];
  patrolPath: [number, number, number][];
  currentWaypointIndex: number;
  rotation: number;
  detectionConeAngle: number;
  detectionRange: number;
  isAlerted: boolean;
  alertLevel: number;
  speed: number;
}

// Laser grid data
export interface LaserGridData {
  id: string;
  position: [number, number, number];
  rotation: number;
  width: number;
  height: number;
  pattern: 'static' | 'sweep' | 'pulse' | 'random';
  isActive: boolean;
  cycleTime: number;
}

// Hackable terminal data
export interface TerminalData {
  id: string;
  position: [number, number, number];
  rotation: number;
  controlsLaserId?: string;
  isHacked: boolean;
  difficulty: number;
}

// Equipment state
export interface HeistEquipment {
  empCharges: number;
  smokeGrenades: number;
  hackerTool: boolean;
  silentFootsteps: boolean;
  silentCooldown: number;
}

export interface HeistState {
  isActive: boolean;
  phase: HeistPhase;
  failReason: HeistFailReason | null;

  timeRemaining: number;
  startTime: number | null;

  targetShopId: string | null;
  targetShopName: string | null;
  targetItemName: string;
  hasItem: boolean;

  drones: DroneData[];
  laserGrids: LaserGridData[];
  terminals: TerminalData[];

  detectionLevel: number;
  isHidden: boolean;
  lastDetectedBy: string | null;

  equipment: HeistEquipment;
  difficultyLevel: number;
  playerLives: number;
  isProtected: boolean;

  hackingTerminalId: string | null;
  hackSequence: string[];
  playerSequence: string[];

  startMission: (targetShopId: string, targetShopName: string, targetItem: string) => void;
  completeBriefing: () => void;
  updateTimer: (delta: number) => void;

  updateDetection: (level: number) => void;
  updateDroneAlert: (droneId: string, level: number) => void;
  alertDrone: (droneId: string) => void;
  resetDroneAlert: (droneId: string) => void;
  enterHiding: () => void;
  exitHiding: () => void;

  useEMP: () => void;
  useSmoke: () => void;
  activateSilentFootsteps: () => void;

  startHacking: (terminalId: string) => void;
  inputHackKey: (key: string) => void;
  cancelHacking: () => void;
  completeHacking: () => void;

  hitByLaser: () => void;
  disableLaser: (laserId: string) => void;

  collectItem: () => void;

  moveDrone: (droneId: string, position: [number, number, number], rotation: number) => void;
  advanceDroneWaypoint: (droneId: string) => void;

  completeMission: () => void;
  failMission: (reason: HeistFailReason) => void;
  resetMission: () => void;
}

const DRONE_CONFIGS: {
  position: [number, number, number];
  path: [number, number, number][];
  type: DroneType;
}[] = [
  {
    position: [0, 3, 30],
    path: [[0, 3, 30], [15, 3, 30], [15, 3, -30], [0, 3, -30], [-15, 3, -30], [-15, 3, 30]],
    type: 'patrol',
  },
  {
    position: [18, 2.5, 40],
    path: [[18, 2.5, 40], [18, 2.5, 35]],
    type: 'sentinel',
  },
  {
    position: [-18, 2.5, 40],
    path: [[-18, 2.5, 40], [-18, 2.5, 35]],
    type: 'sentinel',
  },
];

const LASER_CONFIGS = [
  { position: [10, 0.6, 25], width: 5, height: 3, pattern: 'sweep' as const },
  { position: [-10, 0.6, 25], width: 5, height: 3, pattern: 'pulse' as const },
  { position: [0, 0.6, -10], width: 6, height: 3, pattern: 'static' as const },
];

const HACK_SYMBOLS = ['▲', '●', '■', '◆'];

function getTimeLimit(difficulty: number): number {
  return Math.max(70, 120 - (difficulty - 1) * 10);
}

function generateDrones(difficulty: number, seed: number): DroneData[] {
  const count = Math.min(DRONE_CONFIGS.length, 2 + Math.floor(difficulty / 2));
  return DRONE_CONFIGS.slice(0, count).map((config, index) => ({
    id: `heist-drone-${seed}-${index}`,
    type: config.type,
    position: [...config.position] as [number, number, number],
    patrolPath: config.path,
    currentWaypointIndex: 0,
    rotation: 0,
    detectionConeAngle: config.type === 'sentinel' ? 90 : 60,
    detectionRange: config.type === 'hunter' ? 15 : 12,
    isAlerted: false,
    alertLevel: 0,
    speed: config.type === 'hunter' ? 0.05 : 0.03,
  }));
}

function generateLaserGrids(difficulty: number): LaserGridData[] {
  const count = Math.min(LASER_CONFIGS.length, 2 + Math.floor(difficulty / 2));
  return LASER_CONFIGS.slice(0, count).map((config, index) => ({
    id: `heist-laser-${index}`,
    position: [...config.position] as [number, number, number],
    rotation: 0,
    width: config.width,
    height: config.height,
    pattern: config.pattern,
    isActive: true,
    cycleTime: config.pattern === 'pulse' ? 2.5 : 2,
  }));
}

function generateTerminals(laserGrids: LaserGridData[]): TerminalData[] {
  return laserGrids.map((laser, index) => ({
    id: `heist-terminal-${index}`,
    position: [laser.position[0] + 3, 0.6, laser.position[2] + 2],
    rotation: 0,
    controlsLaserId: laser.id,
    isHacked: false,
    difficulty: Math.min(5, 1 + index),
  }));
}

function generateHackSequence(difficulty: number): string[] {
  const length = Math.min(8, 3 + difficulty);
  return Array.from({ length }, () => HACK_SYMBOLS[Math.floor(Math.random() * HACK_SYMBOLS.length)]);
}

export const useHeistStore = create<HeistState>((set, get) => ({
  isActive: false,
  phase: 'inactive',
  failReason: null,

  timeRemaining: 120,
  startTime: null,

  targetShopId: null,
  targetShopName: null,
  targetItemName: 'Classified Item',
  hasItem: false,

  drones: [],
  laserGrids: [],
  terminals: [],

  detectionLevel: 0,
  isHidden: false,
  lastDetectedBy: null,

  equipment: {
    empCharges: 2,
    smokeGrenades: 2,
    hackerTool: true,
    silentFootsteps: false,
    silentCooldown: 0,
  },

  difficultyLevel: 1,
  playerLives: 3,
  isProtected: false,

  hackingTerminalId: null,
  hackSequence: [],
  playerSequence: [],

  startMission: (targetShopId, targetShopName, targetItem) => {
    const seed = Date.now();
    const difficulty = get().difficultyLevel;
    const lasers = generateLaserGrids(difficulty);
    set({
      isActive: true,
      phase: 'briefing',
      failReason: null,
      targetShopId,
      targetShopName,
      targetItemName: targetItem,
      hasItem: false,
      timeRemaining: getTimeLimit(difficulty),
      startTime: null,
      detectionLevel: 0,
      drones: generateDrones(difficulty, seed),
      laserGrids: lasers,
      terminals: generateTerminals(lasers),
      equipment: {
        empCharges: Math.max(1, 3 - Math.floor(difficulty / 2)),
        smokeGrenades: 2,
        hackerTool: true,
        silentFootsteps: false,
        silentCooldown: 0,
      },
      playerLives: 3,
      isProtected: true,
    });
  },

  completeBriefing: () => {
    set({
      phase: 'infiltrating',
      startTime: Date.now(),
    });
  },

  updateTimer: (delta) => {
    const state = get();
    if (!state.isActive || state.phase === 'inactive' || state.phase === 'briefing') return;
    const nextTime = Math.max(0, state.timeRemaining - delta);
    const nextCooldown = Math.max(0, state.equipment.silentCooldown - delta);
    set({
      timeRemaining: nextTime,
      equipment: {
        ...state.equipment,
        silentCooldown: nextCooldown,
        silentFootsteps: nextCooldown === 0 ? false : state.equipment.silentFootsteps,
      },
    });
    if (nextTime <= 0) {
      get().failMission('time');
    }
  },

  updateDetection: (level) => {
    const nextLevel = Math.min(100, Math.max(0, level));
    set({ detectionLevel: nextLevel });
    if (nextLevel >= 100) {
      get().failMission('detected');
    }
  },

  updateDroneAlert: (droneId, level) => {
    set((state) => ({
      drones: state.drones.map((drone) =>
        drone.id === droneId ? { ...drone, alertLevel: level } : drone
      ),
    }));
  },

  alertDrone: (droneId) => {
    set((state) => ({
      lastDetectedBy: droneId,
      drones: state.drones.map((drone) =>
        drone.id === droneId ? { ...drone, isAlerted: true, alertLevel: 100 } : drone
      ),
    }));
  },

  resetDroneAlert: (droneId) => {
    set((state) => ({
      drones: state.drones.map((drone) =>
        drone.id === droneId ? { ...drone, isAlerted: false, alertLevel: 0 } : drone
      ),
    }));
  },

  enterHiding: () => set({ isHidden: true }),
  exitHiding: () => set({ isHidden: false }),

  useEMP: () => {
    const state = get();
    if (state.equipment.empCharges <= 0) return;
    set({
      equipment: {
        ...state.equipment,
        empCharges: state.equipment.empCharges - 1,
      },
      drones: state.drones.map((drone) => ({ ...drone, isAlerted: false, alertLevel: 0 })),
    });
  },

  useSmoke: () => {
    const state = get();
    if (state.equipment.smokeGrenades <= 0) return;
    set({
      equipment: {
        ...state.equipment,
        smokeGrenades: state.equipment.smokeGrenades - 1,
      },
      detectionLevel: Math.max(0, state.detectionLevel - 25),
    });
  },

  activateSilentFootsteps: () => {
    const state = get();
    if (state.equipment.silentCooldown > 0) return;
    set({
      equipment: {
        ...state.equipment,
        silentFootsteps: true,
        silentCooldown: 30,
      },
    });
  },

  startHacking: (terminalId) => {
    const terminal = get().terminals.find((t) => t.id === terminalId);
    if (!terminal || terminal.isHacked) return;
    set({
      phase: 'hacking',
      hackingTerminalId: terminalId,
      hackSequence: generateHackSequence(terminal.difficulty),
      playerSequence: [],
    });
  },

  inputHackKey: (key) => {
    const state = get();
    if (state.phase !== 'hacking') return;
    const nextSequence = [...state.playerSequence, key];
    const expected = state.hackSequence[nextSequence.length - 1];
    if (expected !== key) {
      set({
        playerSequence: [],
      });
      get().updateDetection(state.detectionLevel + 10);
      return;
    }
    if (nextSequence.length >= state.hackSequence.length) {
      set({ playerSequence: nextSequence });
      get().completeHacking();
      return;
    }
    set({ playerSequence: nextSequence });
  },

  cancelHacking: () => {
    set({
      phase: 'infiltrating',
      hackingTerminalId: null,
      hackSequence: [],
      playerSequence: [],
    });
  },

  completeHacking: () => {
    const state = get();
    const terminalId = state.hackingTerminalId;
    if (!terminalId) return;
    set({
      phase: 'infiltrating',
      hackingTerminalId: null,
      terminals: state.terminals.map((terminal) =>
        terminal.id === terminalId ? { ...terminal, isHacked: true } : terminal
      ),
    });
    const terminal = state.terminals.find((t) => t.id === terminalId);
    if (terminal?.controlsLaserId) {
      get().disableLaser(terminal.controlsLaserId);
    }
  },

  hitByLaser: () => {
    const state = get();
    if (state.isProtected) return;
    const nextLives = Math.max(0, state.playerLives - 1);
    set({ playerLives: nextLives, isProtected: true });
    if (nextLives <= 0) {
      get().failMission('laser');
    }
    setTimeout(() => set({ isProtected: false }), 1000);
  },

  disableLaser: (laserId) => {
    set((state) => ({
      laserGrids: state.laserGrids.map((laser) =>
        laser.id === laserId ? { ...laser, isActive: false } : laser
      ),
    }));
  },

  collectItem: () => {
    set({
      hasItem: true,
      phase: 'escaping',
    });
  },

  moveDrone: (droneId, position, rotation) => {
    set((state) => ({
      drones: state.drones.map((drone) =>
        drone.id === droneId 
          ? { ...drone, position: [...position] as [number, number, number], rotation } 
          : drone
      ),
    }));
  },

  advanceDroneWaypoint: (droneId) => {
    set((state) => ({
      drones: state.drones.map((drone) =>
        drone.id === droneId
          ? {
              ...drone,
              currentWaypointIndex: (drone.currentWaypointIndex + 1) % drone.patrolPath.length,
            }
          : drone
      ),
    }));
  },

  completeMission: () => {
    const state = get();
    set({
      phase: 'completed',
      difficultyLevel: Math.min(5, state.difficultyLevel + 1),
    });
  },

  failMission: (reason) => {
    set({
      phase: 'failed',
      failReason: reason,
    });
  },

  resetMission: () => {
    set({
      isActive: false,
      phase: 'inactive',
      failReason: null,
      timeRemaining: getTimeLimit(get().difficultyLevel),
      startTime: null,
      targetShopId: null,
      targetShopName: null,
      targetItemName: 'Classified Item',
      hasItem: false,
      drones: [],
      laserGrids: [],
      terminals: [],
      detectionLevel: 0,
      isHidden: false,
      lastDetectedBy: null,
      equipment: {
        empCharges: 2,
        smokeGrenades: 2,
        hackerTool: true,
        silentFootsteps: false,
        silentCooldown: 0,
      },
      playerLives: 3,
      isProtected: false,
      hackingTerminalId: null,
      hackSequence: [],
      playerSequence: [],
    });
  },
}));
