import AsyncStorage from '@react-native-async-storage/async-storage'

import { getLocalDataScopeKey } from '@/features/storage/localDataScope'

const STORAGE_KEY = 'shopping_list_id_v1'
const LEGACY_SCOPE_MIGRATION_KEY = 'shopping_list_scope_migration_v1'

function keyForScope() {
  return `${STORAGE_KEY}:${getLocalDataScopeKey()}`
}

export async function getShoppingList<T = unknown>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(keyForScope())
  return raw ? (JSON.parse(raw) as T) : null
}

export async function getShoppingListId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(keyForScope())
  } catch {
    return null
  }
}

export async function hasShoppingList(): Promise<boolean> {
  const id = await getShoppingListId()
  return Boolean(id)
}

/**
 * Enforces "only one shopping list":
 * - If one exists, returns existing id
 * - Otherwise creates a new id and persists it
 */
export async function ensureShoppingList(): Promise<string> {
  const existing = await getShoppingListId()
  if (existing) return existing

  const id = String(Date.now())
  await AsyncStorage.setItem(keyForScope(), id)
  return id
}

export async function clearShoppingList(): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyForScope())
  } catch {
    // ignore
  }
}

export async function migrateLegacyShoppingListToAccount(userId: string): Promise<void> {
  const normalizedUserId = userId.trim()
  if (!normalizedUserId) return

  try {
    const migratedTo = await AsyncStorage.getItem(LEGACY_SCOPE_MIGRATION_KEY)
    if (migratedTo) return

    const legacyListId = await AsyncStorage.getItem(STORAGE_KEY)
    if (!legacyListId) {
      await AsyncStorage.setItem(LEGACY_SCOPE_MIGRATION_KEY, normalizedUserId)
      return
    }

    const scopedListKey = `${STORAGE_KEY}:${normalizedUserId}`
    const existingScopedListId = await AsyncStorage.getItem(scopedListKey)
    if (!existingScopedListId) {
      await AsyncStorage.setItem(scopedListKey, legacyListId)

      const legacyItemsKey = `shopping_list_items_v1:${legacyListId}`
      const scopedItemsKey = `shopping_list_items_v1:${normalizedUserId}:${legacyListId}`
      const legacyItems = await AsyncStorage.getItem(legacyItemsKey)
      if (legacyItems) await AsyncStorage.setItem(scopedItemsKey, legacyItems)
    }

    for (const storageKey of [
      'shopping_list_item_history_v1',
      'shopping_list_dismissed_quick_add_items_v1',
    ]) {
      const legacyValue = await AsyncStorage.getItem(storageKey)
      if (legacyValue) await AsyncStorage.setItem(`${storageKey}:${normalizedUserId}`, legacyValue)
    }

    await AsyncStorage.setItem(LEGACY_SCOPE_MIGRATION_KEY, normalizedUserId)
  } catch {
    // Storage scoping still protects new data if a legacy migration cannot complete.
  }
}
