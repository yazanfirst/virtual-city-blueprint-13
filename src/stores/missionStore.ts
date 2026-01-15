import { create } from 'zustand';
import { CHAPTERS, MISSIONS, Task, Mission, Chapter, getMissionById, getChapterById, getMissionsForChapter } from '@/lib/missions';

type MissionState = {
  // State
  chapters: Chapter[];
  missions: Mission[];
  currentChapterId: string;
  currentMissionId: string | null;
  currentTaskIndex: number;
  
  // UI State
  showMissionComplete: boolean;
  completedMission: Mission | null;
  
  // Computed
  currentMission: Mission | null;
  currentTask: Task | null;
  
  // Actions
  initializeMissions: () => void;
  startMission: (missionId: string) => void;
  updateTaskProgress: (taskType: string, value?: number, boxType?: string) => void;
  completeCurrentTask: () => void;
  completeMission: () => void;
  closeMissionComplete: () => void;
  resetMissions: () => void;
};

export const useMissionStore = create<MissionState>((set, get) => ({
  // Initial state
  chapters: JSON.parse(JSON.stringify(CHAPTERS)),
  missions: JSON.parse(JSON.stringify(MISSIONS)),
  currentChapterId: 'chapter-1',
  currentMissionId: 'mission-1-1',
  currentTaskIndex: 0,
  
  // UI State
  showMissionComplete: false,
  completedMission: null,
  
  // Computed getters
  get currentMission() {
    const state = get();
    return state.missions.find(m => m.id === state.currentMissionId) || null;
  },
  
  get currentTask() {
    const state = get();
    const mission = state.missions.find(m => m.id === state.currentMissionId);
    if (!mission) return null;
    return mission.tasks[state.currentTaskIndex] || null;
  },

  // Actions
  initializeMissions: () => {
    set({
      chapters: JSON.parse(JSON.stringify(CHAPTERS)),
      missions: JSON.parse(JSON.stringify(MISSIONS)),
      currentChapterId: 'chapter-1',
      currentMissionId: 'mission-1-1',
      currentTaskIndex: 0,
    });
  },

  startMission: (missionId: string) => {
    const state = get();
    const mission = state.missions.find(m => m.id === missionId);
    if (!mission || !mission.isUnlocked) return;
    
    set({
      currentMissionId: missionId,
      currentChapterId: mission.chapterId,
      currentTaskIndex: 0,
    });
  },

  updateTaskProgress: (taskType: string, value: number = 1, boxType?: string) => {
    const state = get();
    if (!state.currentMissionId) return;
    
    const missionIndex = state.missions.findIndex(m => m.id === state.currentMissionId);
    if (missionIndex === -1) return;
    
    const mission = state.missions[missionIndex];
    const taskIndex = state.currentTaskIndex;
    const task = mission.tasks[taskIndex];
    
    if (!task || task.completed) return;
    
    // Check if task type matches
    if (task.type !== taskType) {
      // Also check if any incomplete task matches
      const matchingTaskIndex = mission.tasks.findIndex(t => t.type === taskType && !t.completed);
      if (matchingTaskIndex === -1) return;
      
      // Update matching task
      const newMissions = [...state.missions];
      const matchingTask = newMissions[missionIndex].tasks[matchingTaskIndex];
      
      // For box type specific tasks
      if (task.boxType && boxType && task.boxType !== boxType) return;
      
      matchingTask.progress += value;
      
      if (matchingTask.target && matchingTask.progress >= matchingTask.target) {
        matchingTask.completed = true;
        matchingTask.progress = matchingTask.target;
      }
      
      set({ missions: newMissions });
      
      // Check if all tasks complete
      if (newMissions[missionIndex].tasks.every(t => t.completed)) {
        get().completeMission();
      }
      return;
    }
    
    // For box type specific tasks
    if (task.boxType && boxType && task.boxType !== boxType) return;
    
    const newMissions = [...state.missions];
    const currentTask = newMissions[missionIndex].tasks[taskIndex];
    
    currentTask.progress += value;
    
    if (currentTask.target && currentTask.progress >= currentTask.target) {
      currentTask.completed = true;
      currentTask.progress = currentTask.target;
      
      // Move to next task
      const nextIncompleteIndex = newMissions[missionIndex].tasks.findIndex(
        (t, i) => i > taskIndex && !t.completed
      );
      
      if (nextIncompleteIndex !== -1) {
        set({ 
          missions: newMissions,
          currentTaskIndex: nextIncompleteIndex,
        });
      } else if (newMissions[missionIndex].tasks.every(t => t.completed)) {
        set({ missions: newMissions });
        get().completeMission();
      } else {
        set({ missions: newMissions });
      }
    } else {
      set({ missions: newMissions });
    }
  },

  completeCurrentTask: () => {
    const state = get();
    if (!state.currentMissionId) return;
    
    const missionIndex = state.missions.findIndex(m => m.id === state.currentMissionId);
    if (missionIndex === -1) return;
    
    const newMissions = [...state.missions];
    const task = newMissions[missionIndex].tasks[state.currentTaskIndex];
    
    if (task) {
      task.completed = true;
      task.progress = task.target || 1;
    }
    
    // Find next incomplete task
    const nextIndex = newMissions[missionIndex].tasks.findIndex(
      (t, i) => i > state.currentTaskIndex && !t.completed
    );
    
    if (nextIndex !== -1) {
      set({
        missions: newMissions,
        currentTaskIndex: nextIndex,
      });
    } else if (newMissions[missionIndex].tasks.every(t => t.completed)) {
      set({ missions: newMissions });
      get().completeMission();
    } else {
      set({ missions: newMissions });
    }
  },

  completeMission: () => {
    const state = get();
    if (!state.currentMissionId) return;
    
    const missionIndex = state.missions.findIndex(m => m.id === state.currentMissionId);
    if (missionIndex === -1) return;
    
    const newMissions = [...state.missions];
    const completedMission = { ...newMissions[missionIndex] };
    completedMission.isCompleted = true;
    newMissions[missionIndex] = completedMission;
    
    // Find and unlock next mission
    const currentChapterMissions = newMissions.filter(m => m.chapterId === state.currentChapterId);
    const currentIndex = currentChapterMissions.findIndex(m => m.id === state.currentMissionId);
    
    let nextMissionId: string | null = null;
    let nextChapterId = state.currentChapterId;
    
    if (currentIndex < currentChapterMissions.length - 1) {
      // Unlock next mission in chapter
      const nextMission = currentChapterMissions[currentIndex + 1];
      const nextMissionIndex = newMissions.findIndex(m => m.id === nextMission.id);
      newMissions[nextMissionIndex].isUnlocked = true;
      nextMissionId = nextMission.id;
    } else {
      // Chapter complete - unlock next chapter
      const newChapters = [...state.chapters];
      const chapterIndex = newChapters.findIndex(c => c.id === state.currentChapterId);
      newChapters[chapterIndex].isCompleted = true;
      
      if (chapterIndex < newChapters.length - 1) {
        newChapters[chapterIndex + 1].isUnlocked = true;
        nextChapterId = newChapters[chapterIndex + 1].id;
        
        // Unlock first mission of next chapter
        const nextChapterMissions = newMissions.filter(m => m.chapterId === nextChapterId);
        if (nextChapterMissions.length > 0) {
          const firstMissionIndex = newMissions.findIndex(m => m.id === nextChapterMissions[0].id);
          newMissions[firstMissionIndex].isUnlocked = true;
          nextMissionId = nextChapterMissions[0].id;
        }
      }
      
      set({ chapters: newChapters });
    }
    
    set({
      missions: newMissions,
      currentMissionId: nextMissionId,
      currentChapterId: nextChapterId,
      currentTaskIndex: 0,
      showMissionComplete: true,
      completedMission,
    });
  },

  closeMissionComplete: () => {
    set({
      showMissionComplete: false,
      completedMission: null,
    });
  },

  resetMissions: () => {
    set({
      chapters: JSON.parse(JSON.stringify(CHAPTERS)),
      missions: JSON.parse(JSON.stringify(MISSIONS)),
      currentChapterId: 'chapter-1',
      currentMissionId: 'mission-1-1',
      currentTaskIndex: 0,
      showMissionComplete: false,
      completedMission: null,
    });
  },
}));
