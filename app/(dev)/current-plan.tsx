import React, { useContext } from 'react'
import { useRouter } from 'expo-router'

import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'

export default function DevCurrentPlanRoute() {
  const router = useRouter()
  const { plan } = useContext(SubscriptionContext)

  return (
    <CurrentPlanScreen
      accountType={plan === 'premium' ? 'premium' : 'free'}
      mode="dev"
      onBack={() => router.replace('/(dev)/(tabs)/profile')}
      onUpgrade={() => router.push('/premium')}
      onManageExistingRecipes={() => router.replace('/(dev)/(tabs)/collections')}
      onManageSubscription={() => {
        router.push('/(dev)/settings/subscription')
      }}
    />
  )
}
