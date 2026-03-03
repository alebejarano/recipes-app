import React, { useContext, useState } from 'react'
import { Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumSuccessModal from '@/features/subscription/components/PremiumSuccessModal'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'
import { upgradeToPremium } from '@/features/subscription/services/upgradeToPremium'
import { getSafeReturnTo } from '@/lib/navigation'

export default function PremiumRoute() {
  const router = useRouter()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const { user } = useAuth()
  const { setPlan, setUpgradeStatus, upgradeStatus } = useContext(SubscriptionContext)
  const isUpgrading = upgradeStatus === 'running'
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const handleUpgrade = async (billingCycle: 'month' | 'year') => {
    if (!user?.id) {
      Alert.alert('Create account first', 'Sign in or create an account to test Premium activation.')
      return
    }
    if (isUpgrading) return
    try {
      await upgradeToPremium({
        userId: user.id,
        billingCycle,
        setPlan,
        setUpgradeStatus,
      })
      setShowSuccessModal(true)
    } catch (error: any) {
      Alert.alert('Upgrade failed', error?.message ?? 'Could not complete premium upgrade.')
    }
  }

  const handleMaybeLater = () => {
    router.replace(safeReturnTo ?? '/(public)/(tabs)/profile')
  }

  const onCloseSuccessModal = () => {
    setShowSuccessModal(false)
    router.replace(safeReturnTo ?? '/(auth)/current-plan')
  }

  return (
    <>
      <PremiumScreen onUpgrade={handleUpgrade} onMaybeLater={handleMaybeLater} isUpgrading={isUpgrading} />

      <PremiumSuccessModal visible={showSuccessModal} onClose={onCloseSuccessModal} />
    </>
  )
}
