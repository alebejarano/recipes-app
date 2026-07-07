import React, { useContext } from 'react'
import { router } from 'expo-router'

import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import ManageSubscriptionScreen from '@/features/subscription/screens/ManageSubscriptionScreen'
import { i18n } from '@/localization/i18n'

export default function ManageSubscriptionRoute() {
  const { billingCycle } = useContext(SubscriptionContext)
  const premiumPlanLabel = billingCycle === 'year' ? '€36/year' : '€5/month'
  const premiumNextRenewalLabel = i18n.t('subscription.premium.renewsOn', {
    date: billingCycle === 'year' ? 'Mar 27, 2027' : 'Mar 27, 2026',
  })

  return (
    <ManageSubscriptionScreen
      onBack={() => router.replace('/(auth)/(tabs)/profile')}
      premiumPlanLabel={premiumPlanLabel}
      premiumNextRenewalLabel={premiumNextRenewalLabel}
    />
  )
}
