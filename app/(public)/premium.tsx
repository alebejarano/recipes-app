import React, { useContext } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'

export default function PremiumRoute() {
  const router = useRouter()
  const { user } = useAuth()
  const { setPlan } = useContext(SubscriptionContext)

  const handleUpgrade = async (billingCycle: 'month' | 'year') => {
    if (!user?.id) {
      Alert.alert('Create account first', 'Sign in or create an account to test Premium activation.')
      return
    }
    await setPlan('premium', { billingCycle })
    router.replace('/(auth)/(tabs)/profile')
  }

  const handleMaybeLater = () => {
    router.replace('/(public)/(tabs)/profile')
  }

  return <PremiumScreen onUpgrade={handleUpgrade} onMaybeLater={handleMaybeLater} />
}
