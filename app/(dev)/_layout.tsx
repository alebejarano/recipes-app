import React from 'react'
import { Redirect, Stack } from 'expo-router'

import { isDevelopmentAppEnv } from '@/lib/appEnv'

export default function DevLayout() {
  if (!__DEV__ && !isDevelopmentAppEnv) {
    return <Redirect href="/" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Tabs live as one stack screen */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Detail screens live alongside tabs */}
      <Stack.Screen name="collections/[key]" options={{ headerShown: false }} />
      <Stack.Screen name="current-plan-mock" options={{ headerShown: false }} />
      <Stack.Screen name="limit-qa" options={{ headerShown: false }} />
    </Stack>
  )
}
