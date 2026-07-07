import React, { useContext, useEffect, useRef, useState } from 'react'
import { Alert, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { useAnalyticsCapture } from '@/features/analytics/events'
import CurrentPlanScreen from '@/features/subscription/screens/CurrentPlanScreen'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'
import PremiumSuccessModal from '@/features/subscription/components/PremiumSuccessModal'
import { upgradeToPremium } from '@/features/subscription/services/upgradeToPremium'
import { createThemedStyles } from '@/styles/createStyles'
import { getSafeReturnTo } from '@/lib/navigation'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { i18n } from '@/localization/i18n'

export default function PremiumRoute() {
  const router = useRouter()
  const captureAnalyticsEvent = useAnalyticsCapture()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const { user } = useAuth()
  const { plan, billingCycle, upgradeStatus, setPlan, setUpgradeStatus } = useContext(SubscriptionContext)
  const isUpgrading = upgradeStatus === 'running'
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const shouldHoldRedirectRef = useRef(false)
  const premiumPlanLabel = billingCycle === 'year' ? '€36/year' : '€5/month'
  const premiumNextRenewalLabel = i18n.t('subscription.premium.renewsOn', {
    date: billingCycle === 'year' ? 'Mar 27, 2027' : 'Mar 27, 2026',
  })

  useEffect(() => {
    if (plan === 'premium' && !showSuccessModal && !isUpgrading && !shouldHoldRedirectRef.current) {
      router.replace(safeReturnTo ?? '/(auth)/current-plan')
    }
  }, [isUpgrading, plan, router, safeReturnTo, showSuccessModal])

  const handleUpgrade = async (billingCycle: 'month' | 'year') => {
    if (!user?.id || isUpgrading) return
    shouldHoldRedirectRef.current = true
    try {
      await upgradeToPremium({
        userId: user.id,
        billingCycle,
        setPlan,
        setUpgradeStatus,
      })
      captureAnalyticsEvent('purchase_succeeded', {
        plan: 'premium',
        billing_cycle: billingCycle,
      })
      setShowSuccessModal(true)
    } catch (error: any) {
      shouldHoldRedirectRef.current = false
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
