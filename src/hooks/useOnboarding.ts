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

  // Start the tour in a "pending" state: step 1 shows at the composer, but
  // the tour isn't bound to a conversation yet — conversations are only
  // created when the first message is sent. `bindConversation` attaches the
  // tour to that conversation at send time. Replays bypass the
  // once-per-account gate and never write the flag (ONBOARDING_PRD §6).
  const startPending = useCallback((isReplay: boolean) => {
    isReplayRef.current = isReplay;
    setTourConversationId('');
    setStep(1);
  }, []);

  const bindConversation = useCallback((conversationId: string) => {
    setTourConversationId(prev => prev || conversationId);
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
    startPending,
    bindConversation,
    advance,
    skip,
    finish
  };
};
