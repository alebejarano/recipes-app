// src/features/onboarding/screens/OnboardingFlowScreen.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import OnboardingLayout from '@/features/onboarding/components/OnboardingLayout';
import ChooseAddMethodScreen from '@/features/onboarding/screens/ChooseAddMethodScreen';
import IdentityScreen from '@/features/onboarding/screens/IdentityScreen';
import SpaceReadyScreen from '@/features/onboarding/screens/SpaceReadyScreen';
import WelcomeScreen from '@/features/onboarding/screens/WelcomeScreen';
import PublicCreateRecipeScreen from '@/features/recipes/screens/PublicCreateRecipeScreen';
import type { CreateRecipeEntry } from '@/features/recipes/screens/CreateRecipeScreen';

import {
  useOnboarding,
  type OnboardingPath,
} from '@/features/onboarding/context/OnboardingContext';

export default function OnboardingFlowScreen() {
  const router = useRouter();
  const didHydrateRef = useRef(false);

  const {
    isLoaded,
    state,
    setPath: persistPath,
    setStep: persistStep,
    markCompleted,
  } = useOnboarding();

  const [step, setStepLocal] = useState(0);
  const [path, setPathLocal] = useState<OnboardingPath>(null);

  useEffect(() => {
    if (!isLoaded || didHydrateRef.current) return;

    didHydrateRef.current = true;

    // if (state.completed) {
    //   router.replace('/login');
    //   return;
    // }

    setStepLocal(state.step ?? 0);
    setPathLocal(state.path ?? null);
  }, [
    isLoaded,
    state.completed,
    state.step,
    state.path,
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
    await setPath('choose');
    await setStep(3);
  };

  const handleChooseBack = async () => {
    await setPath(null);
    await setStep(2);
  };

  const handleSelectEntry = async (entry: CreateRecipeEntry) => {
    await setPath(entry);
    await setStep(4);
  };

  const handleCreateBack = async () => {
    await setPath('choose');
    await setStep(3);
  };

  const handleSkipPath = async () => {
    await markCompleted();
    router.replace('/(public)/(tabs)');
  };

  const handleRecipeSaved = async (recipeId?: string) => {
    await markCompleted();
    router.replace({
      pathname: '/(public)/(tabs)',
      params: { banner: 'recipe-saved', recipeId: recipeId ?? '' },
    });
  };

  const renderScreen = () => {
    if (step === 0) return <WelcomeScreen onContinue={() => setStep(1)} />;
    if (step === 1) return <IdentityScreen onContinue={() => setStep(2)} />;
    if (step === 2) {
      return (
        <SpaceReadyScreen
          onAddRecipe={handleAddRecipePath}
          onSkip={handleSkipPath}
        />
      );
    }

    if (path === 'choose' || path === 'scratch' || path === 'pdf') {
      switch (step) {
        case 3:
          return (
            <ChooseAddMethodScreen
              onSelectScratch={() => handleSelectEntry('scratch')}
              onSelectFile={() => handleSelectEntry('pdf')}
            />
          );
        case 4:
          return (
            <PublicCreateRecipeScreen
              entry={path === 'pdf' ? 'pdf' : 'scratch'}
              onSaved={(id) => handleRecipeSaved(id)}
              onBack={handleCreateBack}
            />
          );
        default:
          return <WelcomeScreen onContinue={() => setStep(1)} />;
      }
    }

    return <WelcomeScreen onContinue={() => setStep(1)} />;
  };

  const getProgress = () => {
    if (path === 'choose' || path === 'scratch' || path === 'pdf') {
      return { current: Math.min(step + 1, 4), total: 4 };
    }
    return { current: step + 1, total: 3 };
  };

  const { current, total } = getProgress();

  const isEmbeddedScrollStep = (path === 'scratch' || path === 'pdf') && step === 4;
  const showBackButton =
    (path === 'choose' && step === 3) ||
    ((path === 'scratch' || path === 'pdf') && step === 4);

  return (
    <OnboardingLayout
      step={current}
      totalSteps={total}
      showBackButton={showBackButton}
      onBackPress={
        showBackButton
          ? step === 4
            ? handleCreateBack
            : handleChooseBack
          : undefined
      }
      scrollEnabled={!isEmbeddedScrollStep}
    >
      <View style={{ flex: 1 }}>{renderScreen()}</View>
    </OnboardingLayout>
  );
}
