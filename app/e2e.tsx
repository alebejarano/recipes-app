import { Redirect, router } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import { ActivityIndicator, ScrollView, Text } from 'react-native'

import Button from '@/components/Button'
import { seedHomeScenario, type HomeScenario } from '@/e2e/seedHomeScenario'

const scenarios: { id: HomeScenario; label: string }[] = [
  { id: 'empty', label: 'Empty home' }, { id: 'notes', label: 'Notes only' }, { id: 'import', label: 'Import only' },
  { id: 'one', label: 'One recipe' }, { id: 'five', label: 'Five recipes' }, { id: 'six', label: 'Six recipes' },
  { id: 'nineteen', label: 'Nineteen recipes' }, { id: 'twenty', label: 'Twenty recipes' },
  { id: 'activity', label: 'Recent activity' }, { id: 'meal-fallback', label: 'Meal fallback' },
]

export default function E2eRoute() {
  const [loading, setLoading] = useState<HomeScenario | null>(null)
  const queryClient = useQueryClient()
  if (process.env.EXPO_PUBLIC_E2E !== '1') return <Redirect href="/" />
  const load = async (scenario: HomeScenario) => {
    setLoading(scenario)
    await seedHomeScenario(scenario)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recipes'] }),
      queryClient.invalidateQueries({ queryKey: ['notes'] }),
    ])
    router.replace('/(public)/(tabs)')
  }
  return <ScrollView contentContainerStyle={{ padding: 24, gap: 12 }}>
    <Text>E2E home scenarios</Text>
    {scenarios.map((scenario) => (
      <Button
        key={scenario.id}
        testID={`e2e-home-${scenario.id}`}
        onPress={() => void load(scenario.id)}
      >
        {scenario.label}
      </Button>
    ))}
    {loading ? <ActivityIndicator testID="e2e-seeding" /> : null}
  </ScrollView>
}
