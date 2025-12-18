// app/index.tsx
import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useOnboarding } from '@/features/onboarding/context/OnboardingContext';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoaded: onboardingLoaded, hasCompletedOnboarding } = useOnboarding();

  if (authLoading || !onboardingLoaded) {
    return null;
  }

  if (user) {
    return <Redirect href="/(auth)/(tabs)" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/onboarding" />;
}
