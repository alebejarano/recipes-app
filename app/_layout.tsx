// app/_layout.tsx
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { PostHogProvider, usePostHog } from 'posthog-react-native'
import React, { useEffect, useRef } from 'react'
import { AppState, LogBox } from 'react-native'

import { AnalyticsConsentProvider, useAnalyticsConsent } from '@/features/analytics/context/AnalyticsConsentContext'
import { AnalyticsCaptureProvider } from '@/features/analytics/events'
import { AuthProvider } from '@/features/auth/context/AuthContext'
import GlobalSnackbar from '@/features/feedback/components/GlobalSnackbar'
import { OnboardingProvider } from '@/features/onboarding/context/OnboardingContext'
import { ensureRecipePdfStorageReady } from '@/features/recipes/storage/recipePdfStorage'
import RecipeSyncBootstrap from '@/features/recipes/sync/RecipeSyncBootstrap'
import { StorageStrategyProvider } from '@/features/storage/context/StorageStrategyContext'
import PremiumUpgradeMigrationBootstrap from '@/features/subscription/components/PremiumUpgradeMigrationBootstrap'
import { SubscriptionProvider } from '@/features/subscription/context/SubscriptionContext'
import { runLocalMigrations } from '@/lib/localMigrations'
import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { setProductionLogCapture } from '@/lib/productionLogger'
import { LocalizationProvider } from '@/localization'
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
    LogBox.ignoreLogs([
      'fetch failed: java.net.UnknownHostException',
      'Unable to resolve host',
      'No address associated with hostname',
    ])
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
    <LocalizationProvider>
      <QueryProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <StorageStrategyProvider>
              <PremiumUpgradeMigrationBootstrap />
              <RecipeSyncBootstrap />
              <OnboardingProvider>
                <Slot />
                <GlobalSnackbar />
              </OnboardingProvider>
            </StorageStrategyProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryProvider>
    </LocalizationProvider>
  )

  return (
    <AnalyticsConsentProvider>
      <StatusBar style="dark" />
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
  const isActive = enabled && Boolean(apiKey) && isLoaded && analyticsEnabled

  useEffect(() => {
    if (!isActive) {
      setProductionLogCapture(null)
    }
  }, [isActive])

  // For MVP, keep analytics infra but allow a hard off-switch via env.
  if (!isActive || !apiKey) {
    return <AnalyticsCaptureProvider>{children}</AnalyticsCaptureProvider>
  }

  return (
    <PostHogProvider
      key={'posthog-on'}
      apiKey={apiKey}
      autocapture={false}
      options={{
        host,
        captureAppLifecycleEvents: false,
        disableGeoip: true,
        enableSessionReplay: false,
      }}
    >
      <ProductionLoggingBridge>{children}</ProductionLoggingBridge>
    </PostHogProvider>
  )
}

function ProductionLoggingBridge({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog()
  const appStateRef = useRef(AppState.currentState)

  useEffect(() => {
    setProductionLogCapture((event, properties) => {
      posthog.capture(event, properties)
    })

    return () => setProductionLogCapture(null)
  }, [posthog])

  useEffect(() => {
    posthog.capture('app_opened', { source: 'cold_start' })

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current
      appStateRef.current = nextState

      if (previousState.match(/inactive|background/) && nextState === 'active') {
        posthog.capture('app_opened', { source: 'foreground' })
      }
    })

    return () => subscription.remove()
  }, [posthog])

  return <AnalyticsCaptureProvider posthog={posthog}>{children}</AnalyticsCaptureProvider>
}
