import { useCallback, useEffect, useState } from 'react'
import { getShoppingListId } from '../storage/shoppingListStorage'

export function useShoppingListStatus() {
  const [shoppingListId, setShoppingListId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    const id = await getShoppingListId()
    setShoppingListId(id)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    isLoading,
    shoppingListId,
    hasShoppingList: Boolean(shoppingListId),
    refresh,
  }
}
