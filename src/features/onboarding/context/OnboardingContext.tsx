import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type OnboardingPath = 'a' | null;

type OnboardingState = {
  path: OnboardingPath;
  step: number; // 0-based step index in your flow controller
  completed: boolean;
  updatedAt: number;
};

type OnboardingContextValue = {
  // state
  isLoaded: boolean;
  state: OnboardingState;

  // derived
  hasCompletedOnboarding: boolean;
  shouldResumeOnboarding: boolean;

  // actions
  setPath: (path: OnboardingPath) => Promise<void>;
  setStep: (step: number) => Promise<void>;
  markCompleted: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

const STORAGE_KEY = 'onboarding:state';

const DEFAULT_STATE: OnboardingState = {
  path: null,
  step: 0,
  completed: false,
  updatedAt: Date.now(),
};

const normalizePath = (path: unknown): OnboardingPath => {
  return path === 'a' ? 'a' : null;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);

  // Load from storage on app start
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as OnboardingState;

          // Basic sanity
          if (typeof parsed.step === 'number' && typeof parsed.completed === 'boolean') {
            setState({
              ...DEFAULT_STATE,
              ...parsed,
              path: normalizePath(parsed.path),
            });
          } else {
            setState(DEFAULT_STATE);
          }
        } else {
          setState(DEFAULT_STATE);
        }
      } finally {
        setIsLoaded(true);
      }
    };

    load();
  }, []);

  const persist = useCallback(async (next: OnboardingState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const setPath = useCallback(async (path: OnboardingPath) => {
    const next: OnboardingState = {
      ...state,
      path,
      updatedAt: Date.now(),
    };
    await persist(next);
  }, [persist, state]);

  const setStep = useCallback(async (step: number) => {
    const next: OnboardingState = {
      ...state,
      step,
      updatedAt: Date.now(),
    };
    await persist(next);
  }, [persist, state]);

  const markCompleted = useCallback(async () => {
    const next: OnboardingState = {
      ...state,
      completed: true,
      updatedAt: Date.now(),
    };
    await persist(next);
  }, [persist, state]);

  const resetOnboarding = useCallback(async () => {
    // Reset in-memory state immediately (fast UI feedback)
    setState({ ...DEFAULT_STATE, updatedAt: Date.now() });

    // Remove persisted state so next cold start behaves like first run
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);


  const value = useMemo<OnboardingContextValue>(() => {
    const hasCompletedOnboarding = state.completed;

    // “resume” means: user hasn’t completed, but they moved forward at least once
    const shouldResumeOnboarding =
      !state.completed && (state.step > 0 || state.path !== null);

    return {
      isLoaded,
      state,
      hasCompletedOnboarding,
      shouldResumeOnboarding,
      setPath,
      setStep,
      markCompleted,
      resetOnboarding,
    };
  }, [isLoaded, markCompleted, resetOnboarding, setPath, setStep, state]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return ctx;
}
