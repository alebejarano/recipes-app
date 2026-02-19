import React from 'react'
import { useRouter } from 'expo-router'

import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'

export default function PublicCurrentPlanRoute() {
  const router = useRouter()

  return (
    <CurrentPlanScreen
      accountType="guest"
      onBack={() => router.replace('/(public)/(tabs)/profile')}
      onUpgrade={() => router.push('/premium')}
      onManageExistingRecipes={() => router.replace('/(public)/(tabs)/collections')}
    />
  )
}
