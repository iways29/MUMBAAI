import React, { useEffect, useState } from 'react';

interface TutorialSpotlightProps {
  target?: string; // CSS selector
  type: 'element' | 'area' | 'full';
  isVisible: boolean;
  children?: React.ReactNode;
}

export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
  target,
  type,
  isVisible,
  children
}) => {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!target || !isVisible) {
      setElementRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(target);
      if (element) {
        setElementRect(element.getBoundingClientRect());
      }
    };

    // Initial calculation
    updateRect();

    // Update on resize and scroll
    const handleUpdate = () => {
      requestAnimationFrame(updateRect);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    // Observer for dynamic content
    const observer = new MutationObserver(handleUpdate);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
      observer.disconnect();
    };
  }, [target, isVisible]);

  if (!isVisible) return null;

  const renderSpotlight = () => {
    if (type === 'full') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300">
          {children}
        </div>
      );
    }

    if (!elementRect) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300">
          {children}
        </div>
      );
    }

    const padding = type === 'element' ? 8 : 16;
    const spotlightRect = {
      top: elementRect.top - padding,
      left: elementRect.left - padding,
      width: elementRect.width + (padding * 2),
      height: elementRect.height + (padding * 2)
    };

    return (
      <div className="fixed inset-0 z-40 transition-all duration-300">
        {/* Overlay with cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx={type === 'element' ? 12 : 8}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Highlighted border around target */}
        <div
          className="absolute border-2 border-blue-400 rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
          }}
        />

        {/* Pulsing effect */}
        <div
          className="absolute border-2 border-blue-300 rounded-xl pointer-events-none animate-ping opacity-30"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height
          }}
        />

        {children}
      </div>
    );
  };

  return renderSpotlight();
};