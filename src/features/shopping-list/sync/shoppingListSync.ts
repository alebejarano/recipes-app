import AsyncStorage from '@react-native-async-storage/async-storage'

import { getCloudShoppingList, saveCloudShoppingList } from '@/features/shopping-list/api/shoppingListCloudRepo'
import { getShoppingListItems, setShoppingListItems } from '@/features/shopping-list/storage/shoppingListItemsStorage'
import { ensureShoppingList, getShoppingListId } from '@/features/shopping-list/storage/shoppingListStorage'
import {
  getShoppingListSyncState,
  markShoppingListSynced,
} from '@/features/shopping-list/storage/shoppingListSyncStorage'
import { supabase } from '@/lib/supabase'
import { getErrorCategory, logOperationalEvent } from '@/lib/productionLogger'

const PLAN_KEY_PREFIX = 'subscription:plan:user:'
let syncInFlight: Promise<void> | null = null

function isConnectivityError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('network') || message.includes('failed to fetch') || message.includes('timeout')
}

async function runShoppingListSync() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  const userId = data.session?.user.id
  if (!userId) return
  if (await AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${userId}`) !== 'premium') return

  const [localListId, localItems, localState, cloudList] = await Promise.all([
    getShoppingListId(),
    getShoppingListItems(),
    getShoppingListSyncState(),
    getCloudShoppingList(),
  ])

  const localUpdatedAt = localState?.updatedAt ? new Date(localState.updatedAt).getTime() : 0
  const cloudUpdatedAt = cloudList ? new Date(cloudList.updatedAt).getTime() : 0
  const shouldPushLocal = Boolean(localListId) && (!cloudList || localUpdatedAt >= cloudUpdatedAt)

  if (shouldPushLocal) {
    const updatedAt = await saveCloudShoppingList(localItems)
    await markShoppingListSynced(updatedAt)
    return
  }

  if (cloudList) {
    if (!localListId) await ensureShoppingList()
    await setShoppingListItems(cloudList.items)
    await markShoppingListSynced(cloudList.updatedAt)
  }
}

export function triggerShoppingListSync() {
  if (syncInFlight) return syncInFlight

  syncInFlight = runShoppingListSync()
    .catch((error) => {
      logOperationalEvent('sync_retry_failed', {
        operation: 'sync_shopping_list',
        entity: 'shopping_list',
        category: getErrorCategory(error),
      })
      if (!isConnectivityError(error)) return
    })
    .finally(() => {
      syncInFlight = null
    })

  return syncInFlight
}
