import { useState, useEffect, useCallback } from 'react';

export type TutorialStep = 
  | 'movement'              // First time in game - show WASD controls
  | 'shop_nearby'           // First time near a shop - show how to enter
  | 'shop_inside'           // First time inside shop (exploration) - browse, website, exit
  | 'shop_exit_missions'    // After first shop exit - introduce missions for coins
  | 'mission_activated'     // After clicking activate - what happens in mission
  | 'mission_escape'        // In escape phase - zombie chase and traps
  | 'mission_observation'   // Inside target shop during mission - memorize & exit to answer
  | 'mission_question';     // Question phase - answer carefully

const STORAGE_KEY = 'game_tutorial_progress';

interface TutorialProgress {
  completedSteps: TutorialStep[];
  hasSeenTutorial: boolean;
}

const getInitialProgress = (): TutorialProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { completedSteps: [], hasSeenTutorial: false };
};

export const useTutorialProgress = () => {
  const [progress, setProgress] = useState<TutorialProgress>(getInitialProgress);
  const [activeTooltip, setActiveTooltip] = useState<TutorialStep | null>(null);

  // Save to localStorage whenever progress changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  // Check if a step has been completed
  const isStepCompleted = useCallback((step: TutorialStep): boolean => {
    return progress.completedSteps.includes(step);
  }, [progress.completedSteps]);

  // Show a tooltip if the step hasn't been completed yet
  const showTutorialStep = useCallback((step: TutorialStep): boolean => {
    if (isStepCompleted(step)) {
      return false;
    }
    setActiveTooltip(step);
    return true;
  }, [isStepCompleted]);

  // Mark a step as completed and hide tooltip
  const completeStep = useCallback((step: TutorialStep) => {
    setProgress(prev => {
      if (prev.completedSteps.includes(step)) {
        return prev;
      }
      return {
        ...prev,
        completedSteps: [...prev.completedSteps, step],
        hasSeenTutorial: true,
      };
    });
    setActiveTooltip(null);
  }, []);

  // Dismiss current tooltip without completing
  const dismissTooltip = useCallback(() => {
    if (activeTooltip) {
      completeStep(activeTooltip);
    }
  }, [activeTooltip, completeStep]);

  // Reset all tutorial progress (for testing)
  const resetTutorial = useCallback(() => {
    setProgress({ completedSteps: [], hasSeenTutorial: false });
    setActiveTooltip(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    activeTooltip,
    isStepCompleted,
    showTutorialStep,
    completeStep,
    dismissTooltip,
    resetTutorial,
    hasSeenTutorial: progress.hasSeenTutorial,
  };
};
