import React, { useContext } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'

import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { REVENUECAT_ENTITLEMENT_ID } from '@/features/subscription/constants/revenueCat'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import { i18n } from '@/localization/i18n'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'

function formatRenewalLabel(expirationDate: string | null) {
  if (!expirationDate) return undefined

  const parsed = new Date(expirationDate)
  if (Number.isNaN(parsed.getTime())) return undefined

  return i18n.t('subscription.premium.renewsOn', {
    date: parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  })
}

export default function AuthCurrentPlanRoute() {
  const router = useRouter()
  const {
    plan,
    billingCycle,
    customerInfo,
    getPackageForBillingCycle,
    restorePurchases,
    upgradeStatus,
  } = useContext(SubscriptionContext)
  const activeEntitlement =
    customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ?? null
  const activePackage = getPackageForBillingCycle(billingCycle)
  const monthlyPackage = getPackageForBillingCycle('month')
  const yearlyPackage = getPackageForBillingCycle('year')
  const premiumPlanLabel = activePackage?.product.priceString
    ? `${activePackage.product.priceString}${billingCycle === 'year' ? '/year' : '/month'}`
    : billingCycle === 'year'
      ? '€36/year'
      : '€5/month'
  const premiumNextRenewalLabel = formatRenewalLabel(activeEntitlement?.expirationDate ?? null)
  const premiumPricingLabel =
    monthlyPackage?.product.priceString && yearlyPackage?.product.priceString
      ? i18n.t('subscription.currentPlan.pricing', {
          monthly: monthlyPackage.product.priceString,
          yearly: yearlyPackage.product.priceString,
        })
      : null

  const handleRestorePurchases = () => {
    void restorePurchases()
      .then((nextCustomerInfo) => {
        const restoredEntitlement =
          nextCustomerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ?? null

        Alert.alert(
          i18n.t('subscription.manage.restoreSuccessTitle'),
          restoredEntitlement
            ? i18n.t('subscription.manage.restoreSuccessActive')
            : i18n.t('subscription.manage.restoreSuccessInactive')
        )
      })
      .catch((error) => {
        Alert.alert(
          i18n.t('subscription.manage.restoreFailedTitle'),
          getUserFacingErrorMessage(error)
        )
      })
  }

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
      onRestorePurchases={plan === 'free' ? handleRestorePurchases : undefined}
      isRestoring={upgradeStatus === 'running'}
      premiumPlanLabel={premiumPlanLabel}
      premiumNextRenewalLabel={premiumNextRenewalLabel}
      premiumPricingLabel={premiumPricingLabel}
    />
  )
}
