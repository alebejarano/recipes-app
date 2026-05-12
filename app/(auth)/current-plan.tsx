import React, { useContext } from 'react'
import { useRouter } from 'expo-router'

import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'

export default function AuthCurrentPlanRoute() {
  const router = useRouter()
  const { plan } = useContext(SubscriptionContext)

  return (
    <CurrentPlanScreen
      accountType={plan === 'premium' ? 'premium' : 'free'}
      mode="auth"
      onBack={() => router.replace('/(auth)/(tabs)/profile')}
      onUpgrade={() => router.push('/premium')}
      onManageExistingRecipes={() => router.replace('/(auth)/(tabs)/collections')}
      onManageSubscription={() => {
        router.push('/(auth)/settings/subscription')
      }}
    />
  )
}
