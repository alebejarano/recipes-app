import React, { useContext } from 'react'
import { useRouter } from 'expo-router'

import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import { i18n } from '@/localization/i18n'

export default function PublicCurrentPlanRoute() {
  const router = useRouter()
  const { getPackageForBillingCycle } = useContext(SubscriptionContext)
  const monthlyPackage = getPackageForBillingCycle('month')
  const yearlyPackage = getPackageForBillingCycle('year')
  const premiumPricingLabel =
    monthlyPackage?.product.priceString && yearlyPackage?.product.priceString
      ? i18n.t('subscription.currentPlan.pricing', {
          monthly: monthlyPackage.product.priceString,
          yearly: yearlyPackage.product.priceString,
        })
      : null

  return (
    <CurrentPlanScreen
      accountType="guest"
      mode="public"
      onBack={() => router.replace('/(public)/(tabs)/profile')}
      onUpgrade={() => router.push('/premium')}
      onManageExistingRecipes={() => router.replace('/(public)/(tabs)/collections')}
      premiumPricingLabel={premiumPricingLabel}
    />
  )
}
