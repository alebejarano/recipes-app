// app/_layout.tsx
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { PostHogProvider } from 'posthog-react-native'
import React, { useEffect } from 'react'

import { AnalyticsConsentProvider, useAnalyticsConsent } from '@/features/analytics/context/AnalyticsConsentContext'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import { OnboardingProvider } from '@/features/onboarding/context/OnboardingContext'
import { ensureRecipePdfStorageReady } from '@/features/recipes/storage/recipePdfStorage'
import { runLocalMigrations } from '@/lib/localMigrations'
import QueryProviderComponent from '@/providers/QueryProvider'
import { useLoadFonts } from '@/styles/useLoadFonts'

export default function RootLayout() {
  const fontsLoaded = useLoadFonts()
  const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

  useEffect(() => {
    SplashScreen.preventAutoHideAsync()
  }, [])

  useEffect(() => {
    if (fontsLoaded) {
      void runLocalMigrations()
      void ensureRecipePdfStorageReady()
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  const content = (
    <QueryProviderComponent>
      <AuthProvider>
        <OnboardingProvider>
          <Slot />
        </OnboardingProvider>
      </AuthProvider>
    </QueryProviderComponent>
  )

  return (
    <AnalyticsConsentProvider>
      <PostHogGate apiKey={posthogApiKey} host={posthogHost}>
        {content}
      </PostHogGate>
    </AnalyticsConsentProvider>
  )
}

function PostHogGate({
  apiKey,
  host,
  children,
}: {
  apiKey?: string
  host: string
  children: React.ReactNode
}) {
    const { analyticsEnabled, isLoaded } = useAnalyticsConsent()

  // If analytics is off (or not ready), do not initialize PostHog at all.
  if (!apiKey || !isLoaded || !analyticsEnabled) {
    return <>{children}</>
  }

  return (
    <PostHogProvider
      key={'posthog-on'}
      apiKey={apiKey}
      options={{
        host,
      }}
    >
      {children}
    </PostHogProvider>
  )
}
