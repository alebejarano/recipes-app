import React, { useContext } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'

export default function PremiumRoute() {
  const router = useRouter()
  const { user } = useAuth()
  const { plan, setPlan } = useContext(SubscriptionContext)

  const handleUpgrade = async (billingCycle: 'month' | 'year') => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'For this test flow, sign in first to activate Premium.')
      return
    }
    await setPlan('premium', { billingCycle })
    router.replace('/(dev)/(tabs)/profile')
  }

  const handleMaybeLater = () => {
    router.replace('/(dev)/(tabs)/profile')
  }

  if (plan === 'premium') {
    return <PremiumScreen isActive onMaybeLater={handleMaybeLater} onManageSubscription={() => {}} />
  }

  return <PremiumScreen onUpgrade={handleUpgrade} onMaybeLater={handleMaybeLater} />
}
