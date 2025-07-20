import React, { useEffect, useState } from 'react';
import { TutorialStep as TutorialStepType } from '../../types/tutorial';
import { ChevronLeft, ChevronRight, X, Play, SkipForward } from 'lucide-react';

interface TutorialStepProps {
  step: TutorialStepType;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onExit: () => void;
  onChoice?: (choiceId: string) => void;
  target?: string;
}

export const TutorialStep: React.FC<TutorialStepProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onExit,
  onChoice,
  target
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for smooth entrance
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [step.id]);

  useEffect(() => {
    if (target) {
      const element = document.querySelector(target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    }
  }, [target, step.id]);

  const getCardPosition = () => {
    if (step.spotlightType === 'full' || !targetRect) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const cardWidth = 400;
    const cardHeight = 200; // Approximate
    const padding = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = targetRect.top;
    let left = targetRect.left;

    // Position based on step.position preference
    switch (step.position) {
      case 'top':
        top = targetRect.top - cardHeight - padding;
        left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + padding;
        left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
        left = targetRect.left - cardWidth - padding;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (cardHeight / 2);
        left = targetRect.right + padding;
        break;
      default:
        // Auto-position to avoid edges
        if (targetRect.bottom + cardHeight + padding > viewportHeight) {
          top = targetRect.top - cardHeight - padding;
        } else {
          top = targetRect.bottom + padding;
        }
        
        if (targetRect.left + cardWidth > viewportWidth) {
          left = viewportWidth - cardWidth - padding;
        } else if (targetRect.left < 0) {
          left = padding;
        } else {
          left = targetRect.left;
        }
        break;
    }

    // Ensure card stays within viewport
    top = Math.max(padding, Math.min(top, viewportHeight - cardHeight - padding));
    left = Math.max(padding, Math.min(left, viewportWidth - cardWidth - padding));

    return {
      position: 'fixed' as const,
      top,
      left,
      width: cardWidth
    };
  };

  const handleAction = () => {
    if (step.actionType === 'continue') {
      onNext();
    } else if (step.actionType === 'interactive') {
      // For interactive steps, we wait for the user to complete the action
      // The parent component should call onNext when the action is completed
    }
  };

  const renderActionButtons = () => {
    if (step.actionType === 'choice' && step.choices) {
      return (
        <div className="space-y-3">
          {step.choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => onChoice?.(choice.id)}
              className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-gray-900">{choice.label}</div>
              {choice.description && (
                <div className="text-sm text-gray-500 mt-1">{choice.description}</div>
              )}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              onClick={onPrevious}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
          )}
          
          {step.skipable && (
            <button
              onClick={onSkip}
              className="flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <SkipForward size={16} />
              Skip
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {step.actionType === 'interactive' ? (
            <div className="text-sm text-blue-600 font-medium flex items-center gap-1">
              <Play size={14} />
              {step.actionDescription || 'Complete the action to continue'}
            </div>
          ) : (
            <button
              onClick={handleAction}
              className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {currentStep === totalSteps - 1 ? 'Finish' : 'Continue'}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`tutorial-card bg-white rounded-xl shadow-lg border border-gray-200 p-6 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={getCardPosition()}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {step.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <button
          onClick={onExit}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors ml-4"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {step.content}
        </p>
      </div>

      {/* Actions */}
      {renderActionButtons()}

      {/* Arrow pointing to target (for positioned cards) */}
      {step.spotlightType === 'element' && targetRect && step.position && (
        <div
          className={`absolute w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45 ${
            step.position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2' :
            step.position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2' :
            step.position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2' :
            step.position === 'right' ? 'left-[-8px] top-1/2 -translate-y-1/2' :
            'bottom-[-8px] left-1/2 -translate-x-1/2'
          }`}
        />
      )}
    </div>
  );
};