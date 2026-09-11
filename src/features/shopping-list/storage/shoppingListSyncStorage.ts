import AsyncStorage from '@react-native-async-storage/async-storage'

import { getLocalDataScopeKey } from '@/features/storage/localDataScope'

const SYNC_STATE_KEY_PREFIX = 'shopping_list_sync_state_v1'

type ShoppingListSyncState = {
  updatedAt: string
}

function keyForScope() {
  return `${SYNC_STATE_KEY_PREFIX}:${getLocalDataScopeKey()}`
}

export async function getShoppingListSyncState(): Promise<ShoppingListSyncState | null> {
  try {
    const raw = await AsyncStorage.getItem(keyForScope())
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ShoppingListSyncState>
    return typeof parsed.updatedAt === 'string' ? { updatedAt: parsed.updatedAt } : null
  } catch {
    return null
  }
}

export async function markShoppingListDirty(updatedAt = new Date().toISOString()) {
  await AsyncStorage.setItem(keyForScope(), JSON.stringify({ updatedAt }))
}

export async function markShoppingListSynced(updatedAt: string) {
  await AsyncStorage.setItem(keyForScope(), JSON.stringify({ updatedAt }))
}
