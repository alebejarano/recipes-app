import { supabase } from '@/lib/supabase'

import type { ShoppingItem } from '@/features/shopping-list/storage/shoppingListItemsStorage'

type ShoppingListRow = {
  items: unknown
  updated_at: string
}

function isShoppingItem(value: unknown): value is ShoppingItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ShoppingItem>
  return typeof item.id === 'string' && typeof item.name === 'string' && typeof item.checked === 'boolean'
}

function normalizeItems(value: unknown): ShoppingItem[] {
  return Array.isArray(value) ? value.filter(isShoppingItem) : []
}

export async function getCloudShoppingList() {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('items,updated_at')
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const row = data as ShoppingListRow
  return {
    items: normalizeItems(row.items),
    updatedAt: row.updated_at,
  }
}

export async function saveCloudShoppingList(items: ShoppingItem[]) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('shopping_lists')
    .upsert({ user_id: userId, items }, { onConflict: 'user_id' })
    .select('updated_at')
    .single()
  if (error) throw error

  return (data as Pick<ShoppingListRow, 'updated_at'>).updated_at
}
