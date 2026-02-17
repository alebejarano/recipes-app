// app/(auth)/premium.tsx
import React, { useContext, useState } from 'react'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'

import { useAuth } from '@/features/auth/context/AuthContext'
import { migrateLocalDataToCloudOnPremium } from '@/features/sync/premiumMigration'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import PremiumScreen from '@/features/subscription/screens/PremiumScreen'

export default function PremiumRoute() {
  const router = useRouter()
  const { user } = useAuth()
  const { setPlan } = useContext(SubscriptionContext)
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    if (!user?.id || isUpgrading) return
    setIsUpgrading(true)
    try {
      await setPlan('premium')
      const summary = await migrateLocalDataToCloudOnPremium(user.id)

      if (summary.failures.length > 0) {
        Alert.alert(
          'Premium activated',
          `Some local items could not be synced yet (${summary.failures.length}). You can retry later.`
        )
      } else {
        Alert.alert(
          'Premium activated',
          `Synced ${summary.recipesUploaded} recipes and ${summary.notesUploaded} notes to your cloud account.`
        )
      }
      router.replace('/(auth)/(tabs)')
    } catch (error: any) {
      Alert.alert('Upgrade failed', error?.message ?? 'Please try again.')
    } finally {
      setIsUpgrading(false)
    }
  }

  const handleMaybeLater = () => {
    if (isUpgrading) return
    router.replace('/(auth)/(tabs)/profile')
  }

  return (
    <PremiumScreen
      onUpgrade={handleUpgrade}
      onMaybeLater={handleMaybeLater}
    />
  )
}
