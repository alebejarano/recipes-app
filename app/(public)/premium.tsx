import React, { useContext } from 'react'
import { Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'
import { getSafeReturnTo } from '@/lib/navigation'
import { i18n } from '@/localization/i18n'

export default function PremiumRoute() {
  const router = useRouter()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const { user } = useAuth()
  const { getPackageForBillingCycle, upgradeStatus } = useContext(SubscriptionContext)
  const isUpgrading = upgradeStatus === 'running'

  const monthlyPackage = getPackageForBillingCycle('month')
  const yearlyPackage = getPackageForBillingCycle('year')

  const handleUpgrade = () => {
    if (!user?.id) {
      Alert.alert(
        i18n.t('subscription.premium.authRequiredTitle'),
        i18n.t('subscription.premium.authRequiredMessage')
      )
      router.push('/(public)/get-started')
      return
    }

    router.replace('/(auth)/premium')
  }

  const handleMaybeLater = () => {
    router.replace(safeReturnTo ?? '/(public)/(tabs)/profile')
  }

  return (
    <PremiumScreen
      onUpgrade={handleUpgrade}
      onMaybeLater={handleMaybeLater}
      isUpgrading={isUpgrading}
      monthlyPriceLabel={monthlyPackage?.product.priceString ?? '€5'}
      yearlyPriceLabel={yearlyPackage?.product.priceString ?? '€36'}
      yearlyMonthlyEquivalentLabel={yearlyPackage?.product.pricePerMonthString ?? null}
    />
  )
}
