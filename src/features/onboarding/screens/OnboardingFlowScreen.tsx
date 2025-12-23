// src/features/onboarding/screens/OnboardingFlowScreen.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import OnboardingLayout from '@/features/onboarding/components/OnboardingLayout';
import AddRecipeScreen from '@/features/onboarding/screens/AddRecipeScreen';
import CreateRecipeScreen from '@/features/onboarding/screens/CreateRecipeScreen';
import IdentityScreen from '@/features/onboarding/screens/IdentityScreen';
import ImportSourcesScreen from '@/features/onboarding/screens/ImportSourcesScreen';
import MagicMomentScreen from '@/features/onboarding/screens/MagicMomentScreen';
import SpaceReadyScreen from '@/features/onboarding/screens/SpaceReadyScreen';
import WelcomeScreen from '@/features/onboarding/screens/WelcomeScreen';

import {
  useOnboarding,
  type OnboardingPath,
} from '@/features/onboarding/context/OnboardingContext';

export default function OnboardingFlowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reset?: string }>();
  const didResetRef = useRef(false);
  const didHydrateRef = useRef(false);


  const {
    isLoaded,
    state,
    setPath: persistPath,
    setStep: persistStep,
    markCompleted,
    resetOnboarding,
  } = useOnboarding();

  const [step, setStepLocal] = useState(0);
  const [path, setPathLocal] = useState<OnboardingPath>(null);

  useEffect(() => {
    if (!isLoaded || didHydrateRef.current) return;

  didHydrateRef.current = true;

    // Dev helper: run reset only once, even if state changes
    if (__DEV__ && params.reset === '1' && !didResetRef.current) {
      didResetRef.current = true;

      (async () => {
        await resetOnboarding();

        // Local state reset (safe)
        setStepLocal(0);
        setPathLocal(null);

        // Optional but recommended: remove the query param to prevent accidental re-reset
        router.replace('/onboarding');
      })();

      return;
    }

    // if (state.completed) {
    //   router.replace('/login');
    //   return;
    // }

    setStepLocal(state.step ?? 0);
    setPathLocal(state.path ?? null);
  }, [
    isLoaded,
    params.reset,
    state.completed,
    state.step,
    state.path,
    resetOnboarding,
    router,
  ]);

  const setStep = async (nextStep: number) => {
    setStepLocal(nextStep);
    await persistStep(nextStep);
  };

  const setPath = async (nextPath: OnboardingPath) => {
    setPathLocal(nextPath);
    await persistPath(nextPath);
  };

  const handleAddRecipePath = async () => {
    await setPath('a');
    await setStep(3);
  };

  const handleSkipPath = async () => {
    await setPath('b');
    await setStep(3);
  };

  const goToRegister = async () => {
    await markCompleted();
    router.replace('/register');
  };

  const goToGetStarted = async () => {
    await markCompleted();
    router.replace('/get-started');
  };

  const handleRecipeSaved = async () => {
    await goToRegister();
  };

  const renderScreen = () => {
    if (step === 0) return <WelcomeScreen onContinue={() => setStep(1)} />;
    if (step === 1) return <IdentityScreen onContinue={() => setStep(2)} />;
    if (step === 2) {
      return (
          <SpaceReadyScreen onAddRecipe={handleAddRecipePath} onSkip={handleSkipPath} />
      );
    }

    if (path === 'a') {
      switch (step) {
        case 3:
          return <AddRecipeScreen onSelectManual={() => setStep(4)} />;
        case 4:
          return <CreateRecipeScreen onSave={handleRecipeSaved} onBack={() => setStep(3)} />;
        default:
          return <WelcomeScreen onContinue={() => setStep(1)} />;
      }
    }

    if (path === 'b') {
      switch (step) {
        case 3:
          return <ImportSourcesScreen onContinue={() => setStep(4)} />;
        case 4:
          return <MagicMomentScreen onAddRecipe={() => setStep(5)} onGoGetStarted={goToGetStarted} />;
        case 5:
          return <CreateRecipeScreen onSave={handleRecipeSaved} />;
        default:
          return <WelcomeScreen onContinue={() => setStep(1)} />;
      }
    }

    return <WelcomeScreen onContinue={() => setStep(1)} />;
  };

  const getProgress = () => {
    if (path === 'a') return { current: step + 1, total: 5 };
    if (path === 'b') return { current: step + 1, total: 6 };
    return { current: step + 1, total: 3 };
  };

  const { current, total } = getProgress();

  return (
      <OnboardingLayout step={current} totalSteps={total}>
        <View style={{ flex: 1 }}>{renderScreen()}</View>
      </OnboardingLayout>
  );
}
