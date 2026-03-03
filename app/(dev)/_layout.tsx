import React from 'react'
import { Stack } from 'expo-router'

export default function DevLayout() {
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
