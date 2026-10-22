import { Redirect } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { useOnboarding } from '@/features/onboarding/context/OnboardingContext'

export default function IndexRoute() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const { isLoaded: isOnboardingLoaded, hasCompletedOnboarding } = useOnboarding()

  if (isAuthLoading || !isOnboardingLoaded) {
    return null
  }

  if (user) {
    return <Redirect href="/(auth)/(tabs)" />
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(public)/onboarding" />
  }

  return <Redirect href="/(public)/(tabs)" />
}
