// app/_layout.tsx
import { Slot } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'

import { AuthProvider } from '@/features/auth/context/AuthContext'
import { OnboardingProvider } from '@/features/onboarding/context/OnboardingContext'
import { useLoadFonts } from '@/styles/useLoadFonts'
import { QueryProvider } from 'app/QueryProvider'

export default function RootLayout() {
  const fontsLoaded = useLoadFonts()

  useEffect(() => {
    SplashScreen.preventAutoHideAsync()
  }, [])

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <OnboardingProvider>
          <Slot />
        </OnboardingProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
