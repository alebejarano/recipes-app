import React from 'react'
import { useRouter } from 'expo-router'

import CurrentPlanProgressMockScreen from '@/features/subscription/screens/CurrentPlanProgressMockScreen'

export default function DevCurrentPlanMockRoute() {
  const router = useRouter()

  return <CurrentPlanProgressMockScreen onBack={() => router.replace('/(dev)/(tabs)/profile')} />
}
