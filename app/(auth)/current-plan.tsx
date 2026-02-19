import React, { useContext, useEffect } from 'react'
import { useRouter } from 'expo-router'

import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'

export default function AuthCurrentPlanRoute() {
  const router = useRouter()
  const { plan } = useContext(SubscriptionContext)

  useEffect(() => {
    if (plan === 'premium') {
      router.replace('/premium')
    }
  }, [plan, router])

  if (plan === 'premium') {
    return null
  }

  return (
    <CurrentPlanScreen
      accountType="free"
      onBack={() => router.replace('/(auth)/(tabs)/profile')}
      onUpgrade={() => router.push('/premium')}
      onManageExistingRecipes={() => router.replace('/(auth)/(tabs)/collections')}
    />
  )
}
