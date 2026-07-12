// src/hooks/useOnboarding.ts
// First-run guided tour state. See ONBOARDING_PRD.md §5–§7.
// The flag only ever means "don't auto-start this again" — replays never touch it.
import { useState, useCallback, useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';

export type TutorialStep = 0 | 1 | 2 | 3 | 4 | 5;

const flagKey = (userId: string) => `mumbaai_onboarded_${userId}`;

export const useOnboarding = (user: User | null) => {
  // 0 = inactive; 1–5 = active step
  const [step, setStep] = useState<TutorialStep>(0);
  const isReplayRef = useRef(false);
  // The conversation the tour is bound to — the tour ignores events from others.
  const [tourConversationId, setTourConversationId] = useState<string>('');

  const hasSeenTour = useCallback(() => {
    if (!user) return true;
    try {
      return localStorage.getItem(flagKey(user.id)) === '1';
    } catch {
      return true;
    }
  }, [user]);

  const markSeen = useCallback(() => {
    if (!user) return;
    try {
      localStorage.setItem(flagKey(user.id), '1');
    } catch {
      // localStorage unavailable — soft flag, nothing to do
    }
  }, [user]);

  // Grandfather pre-existing users: accounts that already have conversations
  // never get ambushed by the auto-tour (ONBOARDING_PRD §9).
  const grandfatherIfExistingUser = useCallback((conversationCount: number) => {
    if (conversationCount > 0 && !hasSeenTour()) {
      markSeen();
    }
  }, [hasSeenTour, markSeen]);

  // Auto-trigger: only on the account's genuinely first conversation.
  const maybeStartFirstRunTour = useCallback((conversationCountBeforeCreate: number, newConversationId: string) => {
    if (conversationCountBeforeCreate === 0 && !hasSeenTour()) {
      isReplayRef.current = false;
      setTourConversationId(newConversationId);
      setStep(1);
      return true;
    }
    return false;
  }, [hasSeenTour]);

  // Explicit user-initiated replay — bypasses the once-per-account gate and
  // never writes the flag in either direction (ONBOARDING_PRD §6).
  const startReplay = useCallback((newConversationId: string) => {
    isReplayRef.current = true;
    setTourConversationId(newConversationId);
    setStep(1);
  }, []);

  const advance = useCallback(() => {
    setStep(prev => (prev >= 1 && prev < 5 ? ((prev + 1) as TutorialStep) : prev));
  }, []);

  const finish = useCallback(() => {
    if (!isReplayRef.current) markSeen();
    setStep(0);
    setTourConversationId('');
  }, [markSeen]);

  // Skipping is a final decision, not "ask me later" (§5) — same flag write.
  const skip = useCallback(() => {
    finish();
  }, [finish]);

  // If the user signs out mid-tour, drop it.
  useEffect(() => {
    if (!user) {
      setStep(0);
      setTourConversationId('');
    }
  }, [user]);

  return {
    step,
    isActive: step > 0,
    tourConversationId,
    hasSeenTour,
    grandfatherIfExistingUser,
    maybeStartFirstRunTour,
    startReplay,
    advance,
    skip,
    finish
  };
};
