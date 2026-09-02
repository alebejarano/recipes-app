import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { useAnalyticsCapture } from '@/features/analytics/events'
import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'
import PremiumSuccessModal from '@/features/subscription/components/PremiumSuccessModal'
import { REVENUECAT_ENTITLEMENT_ID } from '@/features/subscription/constants/revenueCat'
import { upgradeToPremium } from '@/features/subscription/services/upgradeToPremium'
import { createThemedStyles } from '@/styles/createStyles'
import { getSafeReturnTo } from '@/lib/navigation'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { i18n } from '@/localization/i18n'

function isPurchaseCancelledError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  return (
    (error as { userCancelled?: boolean | null }).userCancelled === true ||
    (error as { code?: string }).code === 'PURCHASE_CANCELLED_ERROR'
  )
}

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

export default function PremiumRoute() {
  const router = useRouter()
  const captureAnalyticsEvent = useAnalyticsCapture()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const { user } = useAuth()
  const {
    plan,
    billingCycle,
    customerInfo,
    getPackageForBillingCycle,
    purchasePackageForBillingCycle,
    setPlan,
    setUpgradeStatus,
    upgradeStatus,
    isLoaded,
  } = useContext(SubscriptionContext)
  const [isPurchaseFlowRunning, setIsPurchaseFlowRunning] = useState(false)
  const isUpgrading = upgradeStatus === 'running' || isPurchaseFlowRunning
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const shouldHoldRedirectRef = useRef(false)

  const monthlyPackage = getPackageForBillingCycle('month')
  const yearlyPackage = getPackageForBillingCycle('year')
  const monthlyPriceLabel = monthlyPackage?.product.priceString ?? '€5'
  const yearlyPriceLabel = yearlyPackage?.product.priceString ?? '€36'
  const yearlyMonthlyEquivalentLabel = yearlyPackage?.product.pricePerMonthString ?? null

  const activeEntitlement =
    customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ?? null
  const premiumPlanLabel = useMemo(() => {
    const activePackage =
      billingCycle === 'year' ? yearlyPackage : monthlyPackage

    if (activePackage?.product.priceString) {
      return `${activePackage.product.priceString}${billingCycle === 'year' ? '/year' : '/month'}`
    }

    return billingCycle === 'year' ? '€36/year' : '€5/month'
  }, [billingCycle, monthlyPackage, yearlyPackage])
  const premiumNextRenewalLabel = formatRenewalLabel(activeEntitlement?.expirationDate ?? null)

  useEffect(() => {
    if (plan === 'premium' && !showSuccessModal && !isUpgrading && !shouldHoldRedirectRef.current) {
      router.replace(safeReturnTo ?? '/(auth)/current-plan')
    }
  }, [isUpgrading, plan, router, safeReturnTo, showSuccessModal])

  const handleUpgrade = async (selectedBillingCycle: 'month' | 'year') => {
    if (!user?.id || isUpgrading) return

    shouldHoldRedirectRef.current = true
    setIsPurchaseFlowRunning(true)

    try {
      const nextCustomerInfo = await purchasePackageForBillingCycle(selectedBillingCycle)
      const premiumActivated = Boolean(
        nextCustomerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]
      )

      if (!premiumActivated) {
        shouldHoldRedirectRef.current = false
        setIsPurchaseFlowRunning(false)
        return
      }

      await upgradeToPremium({
        userId: user.id,
        billingCycle: selectedBillingCycle,
        setPlan,
        setUpgradeStatus,
      })

      captureAnalyticsEvent('purchase_succeeded', {
        plan: 'premium',
        billing_cycle: selectedBillingCycle,
      })
      setShowSuccessModal(true)
      setIsPurchaseFlowRunning(false)
    } catch (error) {
      shouldHoldRedirectRef.current = false
      setIsPurchaseFlowRunning(false)
      if (isPurchaseCancelledError(error)) return

      Alert.alert(
        i18n.t('subscription.premium.upgradeFailedTitle'),
        getUserFacingErrorMessage(error, i18n.t('subscription.premium.upgradeFailedMessage'))
      )
    }
  }

  const handleMaybeLater = () => {
    if (isUpgrading) return
    router.replace(safeReturnTo ?? '/(auth)/(tabs)/profile')
  }

  const onCloseSuccessModal = () => {
    setShowSuccessModal(false)
    shouldHoldRedirectRef.current = false
    router.replace(safeReturnTo ?? '/(auth)/current-plan')
  }

  if (plan === 'premium' && !showSuccessModal && !isUpgrading) {
    return null
  }

  const shouldShowCurrentPlanBackground = showSuccessModal && plan === 'premium'

  return (
    <>
      {shouldShowCurrentPlanBackground ? (
        <View style={styles.backgroundWrap} pointerEvents="none">
          <CurrentPlanScreen
            accountType="premium"
            mode="auth"
            onBack={() => {}}
            onUpgrade={() => {}}
            onManageExistingRecipes={() => {}}
            onManageSubscription={() => {}}
            premiumPlanLabel={premiumPlanLabel}
            premiumNextRenewalLabel={premiumNextRenewalLabel}
          />
        </View>
      ) : (
        <PremiumScreen
          onUpgrade={handleUpgrade}
          onMaybeLater={handleMaybeLater}
          isUpgrading={isUpgrading}
          isPurchaseReady={isLoaded}
          monthlyPriceLabel={monthlyPriceLabel}
          yearlyPriceLabel={yearlyPriceLabel}
          yearlyMonthlyEquivalentLabel={yearlyMonthlyEquivalentLabel}
        />
      )}

      <PremiumSuccessModal visible={showSuccessModal} onClose={onCloseSuccessModal} />
    </>
  )
}

const styles = createThemedStyles(() => ({
  backgroundWrap: {
    flex: 1,
  },
}))
