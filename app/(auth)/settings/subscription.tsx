import React, { useContext } from 'react'
import { Alert } from 'react-native'
import { router } from 'expo-router'

import { REVENUECAT_ENTITLEMENT_ID } from '@/features/subscription/constants/revenueCat'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import ManageSubscriptionScreen from '@/features/subscription/screens/ManageSubscriptionScreen'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { i18n } from '@/localization/i18n'

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

export default function ManageSubscriptionRoute() {
  const {
    billingCycle,
    customerInfo,
    getPackageForBillingCycle,
    presentCustomerCenter,
    restorePurchases,
    upgradeStatus,
  } = useContext(SubscriptionContext)
  const activeEntitlement =
    customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ?? null
  const activePackage = getPackageForBillingCycle(billingCycle)
  const premiumPlanLabel = activePackage?.product.priceString
    ? `${activePackage.product.priceString}${billingCycle === 'year' ? '/year' : '/month'}`
    : billingCycle === 'year'
      ? '€36/year'
      : '€5/month'
  const premiumNextRenewalLabel = formatRenewalLabel(activeEntitlement?.expirationDate ?? null)
  const isRestoring = upgradeStatus === 'running'

  const handleOpenCustomerCenter = () => {
    void presentCustomerCenter().catch((error) => {
      Alert.alert(
        i18n.t('subscription.manage.fallbackTitle'),
        getUserFacingErrorMessage(error, i18n.t('subscription.manage.fallbackBody'))
      )
    })
  }

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
    <ManageSubscriptionScreen
      onBack={() => router.replace('/(auth)/(tabs)/profile')}
      premiumPlanLabel={premiumPlanLabel}
      premiumNextRenewalLabel={premiumNextRenewalLabel}
      onOpenCustomerCenter={handleOpenCustomerCenter}
      onRestorePurchases={handleRestorePurchases}
      isRestoring={isRestoring}
    />
  )
}
