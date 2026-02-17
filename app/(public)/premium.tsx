import React from 'react'
import { useRouter } from 'expo-router'

import PremiumScreen from '@/features/subscription/screens/PremiumScreen'

export default function PremiumRoute() {
  const router = useRouter()

  const handleUpgrade = async () => {
    // TODO: integrate real billing / checkout here
  }

  const handleMaybeLater = () => {
    router.replace('/(public)/(tabs)/profile')
  }

  return <PremiumScreen onUpgrade={handleUpgrade} onMaybeLater={handleMaybeLater} />
}
