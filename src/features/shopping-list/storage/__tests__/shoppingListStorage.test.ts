import AsyncStorage from '@react-native-async-storage/async-storage'

import { migrateGuestShoppingListToAccount } from '../shoppingListStorage'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

const mockGetItem = AsyncStorage.getItem as jest.Mock
const mockSetItem = AsyncStorage.setItem as jest.Mock

describe('migrateGuestShoppingListToAccount', () => {
  beforeEach(() => {
    mockGetItem.mockReset()
    mockSetItem.mockReset().mockResolvedValue(undefined)
  })

  it('copies the guest shopping-list scope to the newly created account', async () => {
    mockGetItem.mockImplementation(async (key: string) => {
      const values: Record<string, string | null> = {
        'shopping_list_id_v1:guest': 'guest-list',
        'shopping_list_id_v1:user-1': null,
        'shopping_list_items_v1:guest:guest-list': '[{"id":"item-1"}]',
        'shopping_list_item_history_v1:guest': '[{"name":"Tomato"}]',
        'shopping_list_dismissed_quick_add_items_v1:guest': '["onion"]',
      }
      return values[key] ?? null
    })

    await migrateGuestShoppingListToAccount(' user-1 ')

    expect(mockSetItem).toHaveBeenCalledWith('shopping_list_id_v1:user-1', 'guest-list')
    expect(mockSetItem).toHaveBeenCalledWith(
      'shopping_list_items_v1:user-1:guest-list',
      '[{"id":"item-1"}]'
    )
    expect(mockSetItem).toHaveBeenCalledWith(
      'shopping_list_item_history_v1:user-1',
      '[{"name":"Tomato"}]'
    )
    expect(mockSetItem).toHaveBeenCalledWith(
      'shopping_list_dismissed_quick_add_items_v1:user-1',
      '["onion"]'
    )
  })

  it('does not overwrite an existing account shopping list', async () => {
    mockGetItem.mockImplementation(async (key: string) => {
      if (key === 'shopping_list_id_v1:guest') return 'guest-list'
      if (key === 'shopping_list_id_v1:user-1') return 'account-list'
      return null
    })

    await migrateGuestShoppingListToAccount('user-1')

    expect(mockSetItem).not.toHaveBeenCalled()
  })
})
