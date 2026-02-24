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
  const { plan, upgradeStatus, setPlan, setUpgradeStatus } = useContext(SubscriptionContext)
  const isUpgrading = upgradeStatus === 'running'

  const handleUpgrade = async (billingCycle: 'month' | 'year') => {
    if (!user?.id || isUpgrading) return
    try {
      await upgradeToPremium({
        userId: user.id,
        billingCycle,
        setPlan,
        setUpgradeStatus,
      })
    } catch (error: any) {
      Alert.alert('Upgrade failed', error?.message ?? 'Could not complete premium upgrade.')
    }
  }

  const handleMaybeLater = () => {
    if (isUpgrading) return
    router.replace('/(auth)/(tabs)/profile')
  }

  if (plan === 'premium') {
    return (
      <PremiumScreen
        isActive
        onMaybeLater={handleMaybeLater}
        onManageSubscription={() => router.push('/(auth)/current-plan')}
      />
    )
  }

  return <PremiumScreen onUpgrade={handleUpgrade} onMaybeLater={handleMaybeLater} isUpgrading={isUpgrading} />
}
