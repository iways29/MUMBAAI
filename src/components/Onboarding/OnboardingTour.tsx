import React, { useEffect, useState, useCallback } from 'react';
import { TutorialStep } from '../../hooks/useOnboarding.ts';

// Callout copy per step — see ONBOARDING_PRD.md §5 for the script.
const STEP_CONTENT: Record<number, { text: string; targetSelector: string; actionLabel?: string }> = {
  1: {
    text: 'Ask anything to start. Your reply becomes the first point on a map you can branch and merge later.',
    targetSelector: '[data-tutorial-input]',
  },
  2: {
    text: "That's your conversation, mapped. Every reply can branch into its own direction — nothing gets lost or scrolled away.",
    targetSelector: '[data-node-type="assistant"]',
    actionLabel: 'Got it',
  },
  3: {
    text: "Click Branch on your first message to explore a different direction — it won't touch your first reply. Then send a new question.",
    targetSelector: '[data-node-type="user"] [data-tutorial-branch]',
  },
  4: {
    text: 'Now select both replies — tap the circle top-right of each node, or Ctrl+click — and merge them into one synthesized answer.',
    targetSelector: '[data-node-type="assistant"] [data-tutorial-merge]',
  },
  5: {
    text: 'Hit Smart Merge — it combines both directions into one answer.',
    targetSelector: '[data-tutorial-smartmerge]',
  },
};

const DONE_TEXT = "That's the whole loop — branch, explore, merge. Tour complete.";

interface OnboardingTourProps {
  step: TutorialStep;
  // True once step 5's completion condition fired — shows the closing callout.
  showClosing: boolean;
  onAdvance: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

// Positions a hairline callout near its target element. Targets move (canvas
// pan/zoom, streaming layout shifts), so we re-measure on an interval — cheap
// and robust versus wiring into ReactFlow internals.
export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  step,
  showClosing,
  onAdvance,
  onSkip,
  onFinish
}) => {
  const [pos, setPos] = useState<{ top: number; left: number; anchored: boolean }>({
    top: 0,
    left: 0,
    anchored: false
  });

  const content = STEP_CONTENT[step];

  const measure = useCallback(() => {
    if (!content) return;
    const target = document.querySelector(content.targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      const calloutWidth = 320;
      // Place above the target, clamped to the viewport.
      let left = rect.left + rect.width / 2 - calloutWidth / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - calloutWidth - 12));
      let top = rect.top - 12; // callout bottom sits above the target
      setPos({ top, left, anchored: true });
    } else {
      setPos(prev => ({ ...prev, anchored: false }));
    }
  }, [content]);

  useEffect(() => {
    if (step === 0) return;
    measure();
    const interval = setInterval(measure, 400);
    window.addEventListener('resize', measure);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', measure);
    };
  }, [step, measure]);

  if (step === 0) return null;

  const calloutBody = showClosing ? DONE_TEXT : content?.text;
  if (!calloutBody) return null;

  const style: React.CSSProperties = pos.anchored && !showClosing
    ? {
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform: 'translateY(-100%)',
        width: 320,
        zIndex: 80
      }
    : {
        // Fallback / closing: centered near the bottom, out of the way.
        position: 'fixed',
        bottom: 96,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 340,
        zIndex: 80
      };

  return (
    <div style={style} className="bg-panel border border-hairline rounded-node p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-plum shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-kicker text-smoke">
          {showClosing ? 'Tour complete' : `${step} of 5`}
        </span>
      </div>
      <p className="text-[13px] text-ash leading-relaxed tracking-body">
        {calloutBody}
      </p>
      <div className="flex items-center justify-between mt-3">
        {showClosing ? (
          <button
            onClick={onFinish}
            className="px-4 py-1.5 bg-plum hover:bg-plum-hover text-bone rounded-pill text-[11px] font-semibold uppercase tracking-kicker transition-colors duration-fast"
          >
            Done
          </button>
        ) : content?.actionLabel ? (
          <button
            onClick={onAdvance}
            className="px-4 py-1.5 bg-plum hover:bg-plum-hover text-bone rounded-pill text-[11px] font-semibold uppercase tracking-kicker transition-colors duration-fast"
          >
            {content.actionLabel}
          </button>
        ) : (
          <span className="text-[11px] text-smoke">Waiting for you…</span>
        )}
        {!showClosing && (
          <button
            onClick={onSkip}
            className="text-[12px] text-smoke hover:text-bone transition-colors duration-fast"
          >
            Skip tour
          </button>
        )}
      </div>
    </div>
  );
};
