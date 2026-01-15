// Mission Definitions - All chapters, missions, and tasks

export type TaskType = 
  | 'move_to' 
  | 'collect_coins' 
  | 'visit_shop' 
  | 'punch_object' 
  | 'destroy_count' 
  | 'avoid_trap' 
  | 'start_hunt' 
  | 'find_box' 
  | 'answer_question' 
  | 'complete_hunt' 
  | 'survive_lives'
  | 'collect_voucher';

export type Task = {
  id: string;
  description: string;
  type: TaskType;
  target?: number;
  targetLocation?: { x: number; z: number; radius: number };
  boxType?: 'common' | 'rare' | 'legendary';
  progress: number;
  completed: boolean;
};

export type Mission = {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  tasks: Task[];
  rewards: { coins: number; xp: number };
  isUnlocked: boolean;
  isCompleted: boolean;
};

export type Chapter = {
  id: string;
  title: string;
  subtitle: string;
  missions: string[]; // Mission IDs
  isUnlocked: boolean;
  isCompleted: boolean;
};

// Chapter Definitions
export const CHAPTERS: Chapter[] = [
  {
    id: 'chapter-1',
    title: 'Chapter 1',
    subtitle: 'Welcome to the City',
    missions: ['mission-1-1', 'mission-1-2', 'mission-1-3'],
    isUnlocked: true,
    isCompleted: false,
  },
  {
    id: 'chapter-2',
    title: 'Chapter 2',
    subtitle: 'The Hunt Begins',
    missions: ['mission-2-1', 'mission-2-2', 'mission-2-3'],
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 'chapter-3',
    title: 'Chapter 3',
    subtitle: 'Expert Hunter',
    missions: ['mission-3-1', 'mission-3-2'],
    isUnlocked: false,
    isCompleted: false,
  },
];

// Mission Definitions
export const MISSIONS: Mission[] = [
  // Chapter 1 - Tutorial
  {
    id: 'mission-1-1',
    chapterId: 'chapter-1',
    title: 'First Steps',
    description: 'Learn the basics of exploring the city',
    tasks: [
      {
        id: 'task-1-1-1',
        description: 'Walk to the fountain in the center',
        type: 'move_to',
        target: 1,
        targetLocation: { x: 0, z: 0, radius: 5 },
        progress: 0,
        completed: false,
      },
      {
        id: 'task-1-1-2',
        description: 'Collect 3 coins',
        type: 'collect_coins',
        target: 3,
        progress: 0,
        completed: false,
      },
      {
        id: 'task-1-1-3',
        description: 'Visit any shop (click on it)',
        type: 'visit_shop',
        target: 1,
        progress: 0,
        completed: false,
      },
    ],
    rewards: { coins: 50, xp: 100 },
    isUnlocked: true,
    isCompleted: false,
  },
  {
    id: 'mission-1-2',
    chapterId: 'chapter-1',
    title: 'Learning to Fight',
    description: 'Master the art of punching objects',
    tasks: [
      {
        id: 'task-1-2-1',
        description: 'Find a cardboard box',
        type: 'move_to',
        target: 1,
        targetLocation: { x: 15, z: 32, radius: 3 },
        progress: 0,
        completed: false,
      },
      {
        id: 'task-1-2-2',
        description: 'Punch to destroy it (Press E)',
        type: 'destroy_count',
        target: 1,
        progress: 0,
        completed: false,
      },
      {
        id: 'task-1-2-3',
        description: 'Destroy 2 more objects',
        type: 'destroy_count',
        target: 2,
        progress: 0,
        completed: false,
      },
    ],
    rewards: { coins: 30, xp: 75 },
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 'mission-1-3',
    chapterId: 'chapter-1',
    title: 'Danger Awareness',
    description: 'Learn to avoid deadly traps',
    tasks: [
      {
        id: 'task-1-3-1',
        description: 'Find a spike trap (look for red danger!)',
        type: 'move_to',
        target: 1,
        targetLocation: { x: 5, z: 20, radius: 5 },
        progress: 0,
        completed: false,
      },
      {
        id: 'task-1-3-2',
        description: 'Survive with all 3 lives',
        type: 'survive_lives',
        target: 3,
        progress: 3,
        completed: false,
      },
      {
        id: 'task-1-3-3',
        description: 'Collect 5 more coins',
        type: 'collect_coins',
        target: 5,
        progress: 0,
        completed: false,
      },
    ],
    rewards: { coins: 40, xp: 100 },
    isUnlocked: false,
    isCompleted: false,
  },

  // Chapter 2 - The Hunt
  {
    id: 'mission-2-1',
    chapterId: 'chapter-2',
    title: 'Your First Hunt',
    description: 'Start hunting for mystery boxes!',
    tasks: [
      {
        id: 'task-2-1-1',
        description: 'Press START HUNT to begin',
        type: 'start_hunt',
        target: 1,
        progress: 0,
        completed: false,
      },
      {
        id: 'task-2-1-2',
        description: 'Find 2 mystery boxes',
        type: 'find_box',
        target: 2,
        progress: 0,
        completed: false,
      },
      {
        id: 'task-2-1-3',
        description: 'Collect your first voucher',
        type: 'collect_voucher',
        target: 1,
        progress: 0,
        completed: false,
      },
    ],
    rewards: { coins: 75, xp: 150 },
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 'mission-2-2',
    chapterId: 'chapter-2',
    title: 'Rare Treasure',
    description: 'Find the valuable rare boxes',
    tasks: [
      {
        id: 'task-2-2-1',
        description: 'Find a RARE (silver) box',
        type: 'find_box',
        target: 1,
        boxType: 'rare',
        progress: 0,
        completed: false,
      },
      {
        id: 'task-2-2-2',
        description: 'Answer the question correctly',
        type: 'answer_question',
        target: 1,
        progress: 0,
        completed: false,
      },
    ],
    rewards: { coins: 100, xp: 200 },
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 'mission-2-3',
    chapterId: 'chapter-2',
    title: 'Decoy Alert!',
    description: 'Watch out for fake boxes!',
    tasks: [
      {
        id: 'task-2-3-1',
        description: 'Find 4 boxes (avoid decoys!)',
        type: 'find_box',
        target: 4,
        progress: 0,
        completed: false,
      },
      {
        id: 'task-2-3-2',
        description: 'Complete hunt with 2+ lives',
        type: 'survive_lives',
        target: 2,
        progress: 3,
        completed: false,
      },
    ],
    rewards: { coins: 80, xp: 175 },
    isUnlocked: false,
    isCompleted: false,
  },

  // Chapter 3 - Expert
  {
    id: 'mission-3-1',
    chapterId: 'chapter-3',
    title: 'Speed Run',
    description: 'Test your skills under pressure',
    tasks: [
      {
        id: 'task-3-1-1',
        description: 'Find 5 boxes in one hunt',
        type: 'find_box',
        target: 5,
        progress: 0,
        completed: false,
      },
      {
        id: 'task-3-1-2',
        description: 'Destroy 5 objects',
        type: 'destroy_count',
        target: 5,
        progress: 0,
        completed: false,
      },
    ],
    rewards: { coins: 150, xp: 300 },
    isUnlocked: false,
    isCompleted: false,
  },
  {
    id: 'mission-3-2',
    chapterId: 'chapter-3',
    title: 'The Legendary Quest',
    description: 'Find the ultimate treasure!',
    tasks: [
      {
        id: 'task-3-2-1',
        description: 'Find the LEGENDARY (gold) box',
        type: 'find_box',
        target: 1,
        boxType: 'legendary',
        progress: 0,
        completed: false,
      },
      {
        id: 'task-3-2-2',
        description: 'Answer all questions correctly',
        type: 'answer_question',
        target: 3,
        progress: 0,
        completed: false,
      },
    ],
    rewards: { coins: 200, xp: 500 },
    isUnlocked: false,
    isCompleted: false,
  },
];

// Get mission by ID
export function getMissionById(id: string): Mission | undefined {
  return MISSIONS.find(m => m.id === id);
}

// Get chapter by ID
export function getChapterById(id: string): Chapter | undefined {
  return CHAPTERS.find(c => c.id === id);
}

// Get missions for a chapter
export function getMissionsForChapter(chapterId: string): Mission[] {
  return MISSIONS.filter(m => m.chapterId === chapterId);
}
