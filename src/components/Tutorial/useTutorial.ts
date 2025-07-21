import { useState, useCallback, useEffect } from 'react';
import { TutorialState, TutorialControls } from '../../types/tutorials.ts';
import { tutorialSteps, getTutorialStepByIndex } from './tutorialSteps.ts';
import { TutorialHelpers } from '../../utils/tutorialHelpers.ts';

export const useTutorial = () => {
  const [state, setState] = useState<TutorialState>({
    isActive: false,
    currentStep: 0,
    totalSteps: tutorialSteps.length,
    isFirstTime: TutorialHelpers.isFirstTimeUser(),
    userHasStarted: false,
    completedSteps: new Set(),
    demoConversation: null
  });

  const currentStepData = getTutorialStepByIndex(state.currentStep);

  // Initialize tutorial state on first load
  useEffect(() => {
    const shouldShowTutorial = state.isFirstTime && !TutorialHelpers.hasCompletedTutorial();
    if (shouldShowTutorial && !state.userHasStarted) {
      // Don't auto-start, just prepare for when user clicks "Start Tutorial"
      setState(prev => ({ ...prev, isFirstTime: true }));
    }
  }, [state.isFirstTime, state.userHasStarted]);

  // Save progress when step changes
  useEffect(() => {
    if (state.isActive && state.currentStep > 0) {
      TutorialHelpers.saveTutorialProgress(state.currentStep);
    }
  }, [state.currentStep, state.isActive]);

  const startTutorial = useCallback(() => {
    // Create demo conversation for tutorial
    const demoConversation = TutorialHelpers.createTutorialConversation();
    
    setState(prev => ({
      ...prev,
      isActive: true,
      currentStep: 0,
      userHasStarted: true,
      completedSteps: new Set(),
      demoConversation
    }));

    TutorialHelpers.markUserAsReturning();
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => {
      const newStep = Math.min(prev.currentStep + 1, prev.totalSteps - 1);
      const newCompletedSteps = new Set(prev.completedSteps);
      newCompletedSteps.add(prev.currentStep);

      // Scroll to target element if specified
      const stepData = getTutorialStepByIndex(newStep);
      if (stepData?.spotlightTarget) {
        setTimeout(() => {
          TutorialHelpers.scrollToElement(stepData.spotlightTarget!);
        }, 300);
      }

      return {
        ...prev,
        currentStep: newStep,
        completedSteps: newCompletedSteps
      };
    });
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0)
    }));
  }, []);

  const skipStep = useCallback(() => {
    const currentStep = getTutorialStepByIndex(state.currentStep);
    if (currentStep?.skipable) {
      nextStep();
    }
  }, [state.currentStep, nextStep]);

  const goToStep = useCallback((stepIndex: number) => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(0, Math.min(stepIndex, prev.totalSteps - 1))
    }));
  }, []);

  const exitTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      userHasStarted: false,
      demoConversation: null
    }));
  }, []);

  const completeTutorial = useCallback((keepData: boolean) => {
    TutorialHelpers.markTutorialCompleted();
    
    setState(prev => ({
      ...prev,
      isActive: false,
      userHasStarted: false,
      demoConversation: keepData ? prev.demoConversation : null
    }));

    // Return the demo conversation if user wants to keep it
    return keepData ? state.demoConversation : null;
  }, [state.demoConversation]);

  const restartTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 0,
      completedSteps: new Set(),
      demoConversation: TutorialHelpers.createTutorialConversation()
    }));
  }, []);

  const shouldShowWelcome = useCallback(() => {
    return state.isFirstTime && !state.userHasStarted && !TutorialHelpers.hasCompletedTutorial();
  }, [state.isFirstTime, state.userHasStarted]);

  const isStepCompleted = useCallback((stepIndex: number) => {
    return state.completedSteps.has(stepIndex);
  }, [state.completedSteps]);

  const getProgress = useCallback(() => {
    return {
      current: state.currentStep + 1,
      total: state.totalSteps,
      percentage: Math.round(((state.currentStep + 1) / state.totalSteps) * 100),
      completed: state.completedSteps.size
    };
  }, [state.currentStep, state.totalSteps, state.completedSteps]);

  const canGoNext = useCallback(() => {
    return state.currentStep < state.totalSteps - 1;
  }, [state.currentStep, state.totalSteps]);

  const canGoPrevious = useCallback(() => {
    return state.currentStep > 0;
  }, [state.currentStep]);

  const isLastStep = useCallback(() => {
    return state.currentStep === state.totalSteps - 1;
  }, [state.currentStep, state.totalSteps]);

  const controls: TutorialControls = {
    startTutorial,
    nextStep,
    previousStep,
    skipStep,
    exitTutorial,
    completeTutorial,
    goToStep
  };

  return {
    state,
    controls,
    currentStepData,
    
    // Helper functions
    shouldShowWelcome,
    isStepCompleted,
    getProgress,
    canGoNext,
    canGoPrevious,
    isLastStep,
    restartTutorial,
    
    // Tutorial data
    getTutorialConversation: () => state.demoConversation
  };
};