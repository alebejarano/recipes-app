import AsyncStorage from '@react-native-async-storage/async-storage'
import { getShoppingListId } from './shoppingListStorage'
import { getLocalDataScopeKey } from '@/features/storage/localDataScope'

export type ShoppingItem = {
  id: string
  name: string
  checked: boolean
}

const ITEMS_KEY_PREFIX = 'shopping_list_items_v1'

function keyFor(listId: string) {
  return `${ITEMS_KEY_PREFIX}:${getLocalDataScopeKey()}:${listId}`
}

export async function getShoppingListItems(): Promise<ShoppingItem[]> {
  try {
    const listId = await getShoppingListId()
    if (!listId) return []

    const raw = await AsyncStorage.getItem(keyFor(listId))
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ShoppingItem[]) : []
  } catch {
    return []
  }
}

export async function setShoppingListItems(items: ShoppingItem[]): Promise<void> {
  const listId = await getShoppingListId()
  if (!listId) return

  await AsyncStorage.setItem(keyFor(listId), JSON.stringify(items))
}

export async function clearShoppingListItems(): Promise<void> {
  const listId = await getShoppingListId()
  if (!listId) return

  await AsyncStorage.removeItem(keyFor(listId))
}
