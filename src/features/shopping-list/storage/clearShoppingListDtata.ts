import { clearShoppingListItems } from './shoppingListItemsStorage'
import { clearShoppingList } from './shoppingListStorage'

export async function clearShoppingListData() {
  await clearShoppingListItems()
  await clearShoppingList()
}
