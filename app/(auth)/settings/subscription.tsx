import React, { useContext } from 'react'
import { router } from 'expo-router'

import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import ManageSubscriptionScreen from '@/features/subscription/screens/ManageSubscriptionScreen'

export default function ManageSubscriptionRoute() {
  const { billingCycle } = useContext(SubscriptionContext)
  const premiumPlanLabel = billingCycle === 'year' ? '€36/year' : '€5/month'
  const premiumNextRenewalLabel = billingCycle === 'year' ? 'Renews Mar 27, 2027' : 'Renews Mar 27, 2026'

  return (
    <ManageSubscriptionScreen
      onBack={() => router.replace('/(auth)/(tabs)/profile')}
      premiumPlanLabel={premiumPlanLabel}
      premiumNextRenewalLabel={premiumNextRenewalLabel}
    />
  )
}
