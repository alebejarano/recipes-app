import React, { useContext } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'
import { upgradeToPremium } from '@/features/subscription/services/upgradeToPremium'

export default function PremiumRoute() {
  const router = useRouter()
  const { user } = useAuth()
  const { plan, setPlan, setUpgradeStatus, upgradeStatus } = useContext(SubscriptionContext)
  const isUpgrading = upgradeStatus === 'running'

  const handleUpgrade = async (billingCycle: 'month' | 'year') => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'For this test flow, sign in first to activate Premium.')
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
      router.replace('/(dev)/(tabs)/profile')
    } catch (error: any) {
      Alert.alert('Upgrade failed', error?.message ?? 'Could not complete premium upgrade.')
    }
  }

  const handleMaybeLater = () => {
    router.replace('/(dev)/(tabs)/profile')
  }

  if (plan === 'premium') {
    return <PremiumScreen isActive onMaybeLater={handleMaybeLater} onManageSubscription={() => {}} />
  }

  return <PremiumScreen onUpgrade={handleUpgrade} onMaybeLater={handleMaybeLater} isUpgrading={isUpgrading} />
}
