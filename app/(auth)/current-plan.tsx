import React, { useContext } from 'react'
import { Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'

export default function AuthCurrentPlanRoute() {
  const router = useRouter()
  const { focus } = useLocalSearchParams<{ focus?: string }>()
  const { plan, billingCycle, setPlan } = useContext(SubscriptionContext)

  const premiumPlanLabel = billingCycle === 'year' ? '€36/year' : '€5/month'
  const premiumNextRenewalLabel = billingCycle === 'year' ? 'March 18, 2027' : 'March 18, 2026'

  return (
    <CurrentPlanScreen
      accountType={plan === 'premium' ? 'premium' : 'free'}
      mode="auth"
      onBack={() => router.replace('/(auth)/(tabs)/profile')}
      onUpgrade={() => router.push('/premium')}
      onManageExistingRecipes={() => router.replace('/(auth)/(tabs)/collections')}
      onManageSubscription={() => {
        Alert.alert('Manage subscription', 'Billing management will be available here soon.')
      }}
      onDeactivatePremiumForTest={() => {
        void setPlan('free')
      }}
      premiumPlanLabel={premiumPlanLabel}
      premiumNextRenewalLabel={premiumNextRenewalLabel}
      highlightSubscriptionCard={focus === 'billing'}
    />
  )
}
