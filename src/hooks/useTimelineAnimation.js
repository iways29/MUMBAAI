// src/hooks/useTimelineAnimation.js
import { useState, useRef, useCallback } from 'react';

const useTimelineAnimation = () => {
  const [timelinePosition, setTimelinePosition] = useState(1.0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);

  // Start or stop timeline animation
  const startTimelineAnimation = useCallback(() => {
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      return;
    }

    setIsAnimating(true);
    setTimelinePosition(0);

    animationRef.current = setInterval(() => {
      setTimelinePosition(prev => {
        if (prev >= 1.0) {
          setIsAnimating(false);
          clearInterval(animationRef.current);
          return 1.0;
        }
        return prev + 0.02; // Increment by 2% each frame
      });
    }, 100); // Update every 100ms
  }, [isAnimating]);

  // Reset timeline to the end
  const resetTimeline = useCallback(() => {
    setTimelinePosition(1.0);
    setIsAnimating(false);
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
  }, []);

  // Stop animation (without resetting position)
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
  }, []);

  // Set timeline to specific position
  const setTimelineToPosition = useCallback((position) => {
    const clampedPosition = Math.max(0, Math.min(1, position));
    setTimelinePosition(clampedPosition);
    
    // Stop animation if it's running
    if (isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }
  }, [isAnimating]);

  // Check if a message should be visible based on timeline position
  const isMessageVisible = useCallback((messageTimestamp, allMessages) => {
    if (timelinePosition >= 1.0) return true;

    const messageTime = new Date(messageTimestamp).getTime();
    const now = Date.now();
    const oldestTime = Math.min(...allMessages.map(m => new Date(m.timestamp).getTime()));
    const cutoffTime = oldestTime + (now - oldestTime) * timelinePosition;

    return messageTime <= cutoffTime;
  }, [timelinePosition]);

  // Get timeline percentage as string
  const getTimelinePercentage = useCallback(() => {
    return Math.round(timelinePosition * 100);
  }, [timelinePosition]);

  // Clean up on unmount
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
  }, []);

  return {
    // State
    timelinePosition,
    isAnimating,
    
    // Setters
    setTimelinePosition: setTimelineToPosition,
    
    // Actions
    startTimelineAnimation,
    resetTimeline,
    stopAnimation,
    
    // Utilities
    isMessageVisible,
    getTimelinePercentage,
    cleanup
  };
};

export default useTimelineAnimation;