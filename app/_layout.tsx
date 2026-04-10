// app/_layout.tsx
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { PostHogProvider } from 'posthog-react-native'
import React, { useEffect } from 'react'

import { AnalyticsConsentProvider, useAnalyticsConsent } from '@/features/analytics/context/AnalyticsConsentContext'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import GlobalSnackbar from '@/features/feedback/components/GlobalSnackbar'
import { OnboardingProvider } from '@/features/onboarding/context/OnboardingContext'
import { ensureRecipePdfStorageReady } from '@/features/recipes/storage/recipePdfStorage'
import RecipeSyncBootstrap from '@/features/recipes/sync/RecipeSyncBootstrap'
import { StorageStrategyProvider } from '@/features/storage/context/StorageStrategyContext'
import { SubscriptionProvider } from '@/features/subscription/context/SubscriptionContext'
import { runLocalMigrations } from '@/lib/localMigrations'
import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import QueryProvider from '@/providers/QueryProvider'
import { useLoadFonts } from '@/styles/useLoadFonts'

export default function RootLayout() {
  const fontsLoaded = useLoadFonts()
  const posthogEnabled = process.env.EXPO_PUBLIC_ENABLE_POSTHOG === '1'
  const posthogApiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

  useEffect(() => {
    SplashScreen.preventAutoHideAsync()
  }, [])

  useEffect(() => {
    if (fontsLoaded) {
      void runLocalMigrations().then(() => ensureLocalSqliteMigrationReady())
      void ensureRecipePdfStorageReady()
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  const content = (
    <QueryProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <StorageStrategyProvider>
            <RecipeSyncBootstrap />
            <OnboardingProvider>
              <Slot />
              <GlobalSnackbar />
            </OnboardingProvider>
          </StorageStrategyProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryProvider>
  )

  return (
    <AnalyticsConsentProvider>
      <PostHogGate enabled={posthogEnabled} apiKey={posthogApiKey} host={posthogHost}>
        {content}
      </PostHogGate>
    </AnalyticsConsentProvider>
  )
}

function PostHogGate({
  enabled,
  apiKey,
  host,
  children,
}: {
  enabled: boolean
  apiKey?: string
  host: string
  children: React.ReactNode
}) {
    const { analyticsEnabled, isLoaded } = useAnalyticsConsent()

  // For MVP, keep analytics infra but allow a hard off-switch via env.
  if (!enabled || !apiKey || !isLoaded || !analyticsEnabled) {
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
