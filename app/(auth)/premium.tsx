// app/(auth)/premium.tsx
import React, { useContext, useState } from 'react'
import { useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'

export default function PremiumRoute() {
  const router = useRouter()
  const { user } = useAuth()
  const { plan, setPlan } = useContext(SubscriptionContext)
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async (billingCycle: 'month' | 'year') => {
    if (!user?.id || isUpgrading) return
    setIsUpgrading(true)
    try {
      await setPlan('premium', { billingCycle })
      router.replace('/(auth)/current-plan')
    } catch (error: any) {
      console.warn('Premium upgrade failed in local test mode:', error?.message ?? error)
    } finally {
      setIsUpgrading(false)
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
        onManageSubscription={() => {}}
      />
    )
  }

  return <PremiumScreen onUpgrade={handleUpgrade} onMaybeLater={handleMaybeLater} />
}
