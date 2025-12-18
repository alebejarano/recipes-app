import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type OnboardingPath = 'a' | 'b' | null;

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

  const persist = async (next: OnboardingState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setPath = async (path: OnboardingPath) => {
    const next: OnboardingState = {
      ...state,
      path,
      updatedAt: Date.now(),
    };
    await persist(next);
  };

  const setStep = async (step: number) => {
    const next: OnboardingState = {
      ...state,
      step,
      updatedAt: Date.now(),
    };
    await persist(next);
  };

  const markCompleted = async () => {
    const next: OnboardingState = {
      ...state,
      completed: true,
      updatedAt: Date.now(),
    };
    await persist(next);
  };

  const resetOnboarding = async () => {
    await persist({
      ...DEFAULT_STATE,
      updatedAt: Date.now(),
    });
  };

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
  }, [isLoaded, state]);

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
