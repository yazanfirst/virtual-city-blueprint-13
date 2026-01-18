import { useState, useEffect, useCallback } from 'react';

export type TutorialStep = 
  | 'movement'      // First time in game - show WASD controls
  | 'mission'       // First time near mission panel - explain missions
  | 'shop_nearby'   // First time near a shop - show how to enter
  | 'shop_inside'   // First time inside shop - show exit button
  | 'mission_escape' // First time in escape phase - explain zombie chase
  | 'mission_question'; // First time in question phase - explain answering

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
