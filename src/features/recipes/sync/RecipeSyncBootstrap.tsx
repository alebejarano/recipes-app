import { useEffect } from 'react'
import { AppState } from 'react-native'

import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'

const SYNC_POLL_INTERVAL_MS = 30_000

export default function RecipeSyncBootstrap() {
  const { cloudSyncEnabled, isAuthenticated } = useStorageStrategy()

  useEffect(() => {
    if (!cloudSyncEnabled || !isAuthenticated) return

    void triggerRecipeSync()

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void triggerRecipeSync()
      }
    })

    const intervalId = setInterval(() => {
      void triggerRecipeSync()
    }, SYNC_POLL_INTERVAL_MS)

    return () => {
      appStateSubscription.remove()
      clearInterval(intervalId)
    }
  }, [cloudSyncEnabled, isAuthenticated])

  return null
}
