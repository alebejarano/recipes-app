// app/_layout.tsx
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'

import { AuthProvider } from '@/features/auth/context/AuthContext'
import { OnboardingProvider } from '@/features/onboarding/context/OnboardingContext'
import { runLocalMigrations } from '@/lib/localMigrations'
import QueryProviderComponent from '@/providers/QueryProvider'
import { useLoadFonts } from '@/styles/useLoadFonts'


export default function RootLayout() {
  const fontsLoaded = useLoadFonts()

  useEffect(() => {
    SplashScreen.preventAutoHideAsync()
  }, [])

  useEffect(() => {
    if (fontsLoaded) {
      void runLocalMigrations()
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <QueryProviderComponent>
      <AuthProvider>
        <OnboardingProvider>
          <Slot />
        </OnboardingProvider>
      </AuthProvider>
    </QueryProviderComponent>
  )
}
