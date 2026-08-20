import AsyncStorage from '@react-native-async-storage/async-storage'

import { getLocalDataScopeKey } from '@/features/storage/localDataScope'

const DISMISSED_QUICK_ADD_ITEMS_STORAGE_KEY = 'shopping_list_dismissed_quick_add_items_v1'

function keyForScope() {
  return `${DISMISSED_QUICK_ADD_ITEMS_STORAGE_KEY}:${getLocalDataScopeKey()}`
}

export async function getDismissedQuickAddItems(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(keyForScope())
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}

export async function setDismissedQuickAddItems(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(keyForScope(), JSON.stringify(keys))
  } catch {
    // Keep the dismissal for the current session if storage is unavailable.
  }
}
