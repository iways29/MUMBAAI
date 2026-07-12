// src/hooks/useTheme.ts
// App-level theme preference: dark (the system default) / light / system.
// Light mode uses the paper palette from tokens.css ([data-theme='light'] —
// #FAFAF8, deliberately not pure white). Marketing pages are always dark per
// design.md, so the attribute is applied only while the app shell is mounted
// and removed on unmount.
import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'mumbaai_theme';

export const useTheme = () => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light' || stored === 'system') return stored;
    } catch {
      // localStorage unavailable
    }
    return 'dark';
  });

  const [systemPrefersLight, setSystemPrefersLight] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersLight(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const effective: 'dark' | 'light' =
    preference === 'system' ? (systemPrefersLight ? 'light' : 'dark') : preference;

  useEffect(() => {
    if (effective === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Leaving the app (unmount) always restores dark — marketing stays dark.
    return () => document.documentElement.removeAttribute('data-theme');
  }, [effective]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      // best effort
    }
  }, []);

  return { preference, setPreference, effective };
};
