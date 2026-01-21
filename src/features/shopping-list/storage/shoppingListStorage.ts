import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'shopping_list_id_v1'

export async function getShoppingList<T = unknown>(): Promise<T | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as T) : null
}

export async function getShoppingListId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY)
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
  await AsyncStorage.setItem(STORAGE_KEY, id)
  return id
}

export async function clearShoppingList(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
