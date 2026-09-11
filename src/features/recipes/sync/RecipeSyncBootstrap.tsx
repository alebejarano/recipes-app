import { useEffect } from 'react'
import { AppState } from 'react-native'

import { triggerFolderSync } from '@/features/folders/sync/folderSync'
import { triggerNoteSync } from '@/features/notes/sync/noteSync'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { triggerShoppingListSync } from '@/features/shopping-list/sync/shoppingListSync'
import { useShoppingListStore } from '@/features/shopping-list/store/useShoppingListStore'

const SYNC_POLL_INTERVAL_MS = 30_000

export default function RecipeSyncBootstrap() {
  const { cloudSyncEnabled, isAuthenticated } = useStorageStrategy()

  useEffect(() => {
    if (!cloudSyncEnabled || !isAuthenticated) return

    void triggerRecipeSync()
    void triggerNoteSync()
    void triggerFolderSync()
    void triggerShoppingListSync().then(() => useShoppingListStore.getState().refreshFromStorage())

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void triggerRecipeSync()
        void triggerNoteSync()
        void triggerFolderSync()
        void triggerShoppingListSync().then(() => useShoppingListStore.getState().refreshFromStorage())
      }
    })

    const intervalId = setInterval(() => {
      void triggerRecipeSync()
      void triggerNoteSync()
      void triggerFolderSync()
      void triggerShoppingListSync().then(() => useShoppingListStore.getState().refreshFromStorage())
    }, SYNC_POLL_INTERVAL_MS)

    return () => {
      appStateSubscription.remove()
      clearInterval(intervalId)
    }
  }, [cloudSyncEnabled, isAuthenticated])

  return null
}
