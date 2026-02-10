import { useMemo } from 'react'

import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'

export function useEntitlements() {
  const { cloudSyncEnabled, isPremium } = useStorageStrategy()

  return useMemo(
    () => ({
      canUseCloudSync: cloudSyncEnabled,
      isPremium,
    }),
    [cloudSyncEnabled, isPremium]
  )
}
