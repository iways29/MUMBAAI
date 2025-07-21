import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TutorialSpotlight } from './TutorialSpotlight.tsx';
import { TutorialStep } from './TutorialStep.tsx';
import { useTutorial } from './useTutorial.ts';

interface TutorialOverlayProps {
  onTutorialComplete?: (keepData: boolean, demoConversation?: any) => void;
  onTutorialDataNeeded?: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  onTutorialComplete,
  onTutorialDataNeeded
}) => {
  const {
    state,
    controls,
    currentStepData,
    isLastStep,
    canGoNext,
    canGoPrevious
  } = useTutorial();

  // Handle auto-advance steps
  useEffect(() => {
    if (currentStepData?.autoAdvance && state.isActive) {
      const timer = setTimeout(() => {
        if (canGoNext) {
          controls.nextStep();
        }
      }, currentStepData.autoAdvanceDelay || 3000);

      return () => clearTimeout(timer);
    }
  }, [currentStepData, state.isActive, canGoNext, controls]);

  // Inject demo data when tutorial starts
  useEffect(() => {
    if (state.isActive && state.demoConversation && onTutorialDataNeeded) {
      onTutorialDataNeeded();
    }
  }, [state.isActive, state.demoConversation, onTutorialDataNeeded]);

  const handleChoice = (choiceId: string) => {
    if (choiceId === 'keep') {
      const demoConv = controls.completeTutorial(true);
      onTutorialComplete?.(true, demoConv);
    } else if (choiceId === 'fresh') {
      controls.completeTutorial(false);
      onTutorialComplete?.(false);
    } else if (choiceId === 'replay') {
      controls.goToStep(0);
    }
  };

  const handleStepAction = () => {
    // This is called when user completes an interactive action
    if (canGoNext) {
      controls.nextStep();
    }
  };

  if (!state.isActive || !currentStepData) {
    return null;
  }

  const tutorialContent = (
    <TutorialSpotlight
      target={currentStepData.spotlightTarget}
      type={currentStepData.spotlightType || 'element'}
      isVisible={state.isActive}
    >
      <TutorialStep
        step={currentStepData}
        currentStep={state.currentStep}
        totalSteps={state.totalSteps}
        onNext={controls.nextStep}
        onPrevious={controls.previousStep}
        onSkip={controls.skipStep}
        onExit={controls.exitTutorial}
        onChoice={handleChoice}
        target={currentStepData.spotlightTarget}
      />
    </TutorialSpotlight>
  );

  // Render in portal to ensure it's on top of everything
  return createPortal(tutorialContent, document.body);
};

// Tutorial trigger component for welcome screen
export const TutorialWelcome: React.FC<{
  onStartTutorial: () => void;
  onDismiss?: () => void;
}> = ({ onStartTutorial, onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌟</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to FlowChatAI!
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Transform your conversations into visual trees. Would you like a quick tour to see how it works?
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onStartTutorial}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Start Tutorial (3 minutes)
            </button>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="w-full text-gray-500 py-2 px-4 rounded-lg hover:text-gray-700 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-400 mt-4">
            You can always access the tutorial later from the help menu
          </p>
        </div>
      </div>
    </div>
  );
};