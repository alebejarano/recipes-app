import React, { createContext, useContext, useMemo } from 'react'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'

export type StorageStrategy =
  | 'anonymous-local'
  | 'account-local-migratable'
  | 'cloud-sync-offline-cache'

type StorageStrategyContextValue = {
  strategy: StorageStrategy
  isAnonymous: boolean
  isAuthenticated: boolean
  isPremium: boolean
  isLoaded: boolean
  localFirst: boolean
  cloudSyncEnabled: boolean
}

const StorageStrategyContext = createContext<StorageStrategyContextValue>({
  strategy: 'anonymous-local',
  isAnonymous: true,
  isAuthenticated: false,
  isPremium: false,
  isLoaded: false,
  localFirst: true,
  cloudSyncEnabled: false,
})

export function StorageStrategyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { isLoaded, plan, upgradeStatus } = useContext(SubscriptionContext)

  const value = useMemo<StorageStrategyContextValue>(() => {
    const isAuthenticated = Boolean(user)
    const isPremium = isAuthenticated && plan === 'premium'
    // A failed migration means some local assets are queued for retry, not
    // that an already-Premium account should lose access to its cloud data.
    // Pending documents are merged into cloud lists by the document hooks.
    const shouldKeepUsingLocalData = upgradeStatus === 'running'
    const strategy: StorageStrategy = !isAuthenticated
      ? 'anonymous-local'
      : isPremium && !shouldKeepUsingLocalData
        ? 'cloud-sync-offline-cache'
        : 'account-local-migratable'

    return {
      strategy,
      isAnonymous: !isAuthenticated,
      isAuthenticated,
      isPremium,
      isLoaded,
      localFirst: strategy !== 'cloud-sync-offline-cache',
      cloudSyncEnabled: strategy === 'cloud-sync-offline-cache',
    }
  }, [isLoaded, plan, upgradeStatus, user])

  return <StorageStrategyContext.Provider value={value}>{children}</StorageStrategyContext.Provider>
}

export function useStorageStrategy() {
  return useContext(StorageStrategyContext)
}
