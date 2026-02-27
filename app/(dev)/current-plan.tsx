import React, { useContext } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'

import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'

export default function DevCurrentPlanRoute() {
  const router = useRouter()
  const { plan, billingCycle, setPlan } = useContext(SubscriptionContext)

  const premiumPlanLabel = billingCycle === 'year' ? '€36/year' : '€5/month'
  const premiumNextRenewalLabel = billingCycle === 'year' ? 'Renews Mar 27, 2027' : 'Renews Mar 27, 2026'

  return (
    <CurrentPlanScreen
      accountType={plan === 'premium' ? 'premium' : 'free'}
      mode="dev"
      onBack={() => router.replace('/(dev)/(tabs)/profile')}
      onUpgrade={() => router.push('/premium')}
      onManageExistingRecipes={() => router.replace('/(dev)/(tabs)/collections')}
      onManageSubscription={() => {
        Alert.alert('Manage subscription', 'Billing management will be available here soon.')
      }}
      onDeactivatePremiumForTest={() => {
        void setPlan('free')
      }}
      premiumPlanLabel={premiumPlanLabel}
      premiumNextRenewalLabel={premiumNextRenewalLabel}
    />
  )
}
