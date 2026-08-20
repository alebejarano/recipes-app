import { create } from 'zustand'

import type { ShoppingItem } from '../storage/shoppingListItemsStorage'
import {
  getShoppingItemHistory,
  recordShoppingItemAddition,
  type ShoppingItemHistory,
} from '../storage/shoppingListItemHistoryStorage'
import {
  getDismissedQuickAddItems,
  setDismissedQuickAddItems,
} from '../storage/shoppingListQuickAddStorage'
import {
    clearShoppingListItems,
    getShoppingListItems,
    setShoppingListItems,
} from '../storage/shoppingListItemsStorage'
import { ensureShoppingList, getShoppingListId } from '../storage/shoppingListStorage'

function normalizeName(input: string) {
  return input.trim().replace(/\s+/g, ' ')
}

function keyOf(name: string) {
  return normalizeName(name).toLowerCase()
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function buildNameSet(items: ShoppingItem[]) {
  return new Set(items.map((i) => keyOf(i.name)))
}

type ShoppingListState = {
  // hydration / lifecycle
  isHydrated: boolean
  isHydrating: boolean

  // UX flags (match your overlays)
  isCreating: boolean
  isComplete: boolean

  // data
  listId: string | null
  items: ShoppingItem[]
  itemHistory: ShoppingItemHistory[]
  dismissedQuickAddKeys: Set<string>

  // derived
  normalizedNames: Set<string>

  // actions
  hydrate: () => Promise<void>
  ensureList: () => Promise<string>
  addItem: (name: string, historyKey?: string) => Promise<void>
  bulkAdd: (names: string[]) => Promise<{ added: number; skipped: number }>
  toggleItemByName: (name: string, historyKey?: string) => Promise<void>
  removeItem: (id: string) => Promise<void>
  setChecked: (id: string, checked: boolean) => Promise<void>
  dismissQuickAddItem: (key: string) => Promise<void>
  resetForAccountChange: () => void

  // optional utilities
  clear: () => Promise<void>
  setCompleteTemporarily: (ms?: number) => void
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => {
  let hydrationPromise: Promise<void> | null = null

  // ---- internal helper: set items + persist (single source of truth) ----
  const commitItems = async (nextItems: ShoppingItem[], opts?: { rebuildNames?: boolean }) => {
    const rebuildNames = opts?.rebuildNames ?? true

    set((state) => ({
      items: nextItems,
      normalizedNames: rebuildNames ? buildNameSet(nextItems) : state.normalizedNames,
    }))

    await setShoppingListItems(nextItems)
  }

  return {
    isHydrated: false,
    isHydrating: false,

    isCreating: false,
    isComplete: false,

    listId: null,
    items: [],
    itemHistory: [],
    dismissedQuickAddKeys: new Set(),
    normalizedNames: new Set(),

    hydrate: async () => {
      if (get().isHydrated) return
      if (hydrationPromise) {
        await hydrationPromise
        return
      }

      hydrationPromise = (async () => {
        set({ isHydrating: true })

        const id = await getShoppingListId()
        const [items, itemHistory, dismissedQuickAddItems] = await Promise.all([
          id ? getShoppingListItems() : [],
          getShoppingItemHistory(),
          getDismissedQuickAddItems(),
        ])

        set({
          listId: id,
          items,
          itemHistory,
          dismissedQuickAddKeys: new Set(dismissedQuickAddItems),
          normalizedNames: buildNameSet(items),
          isHydrating: false,
          isHydrated: true,
        })
      })()

      try {
        await hydrationPromise
      } finally {
        hydrationPromise = null
      }
    },

    ensureList: async () => {
      const current = get().listId
      if (current) return current

      set({ isCreating: true })

      const id = await ensureShoppingList()
      const items = await getShoppingListItems()

      set({
        listId: id,
        items,
        normalizedNames: buildNameSet(items),
        isCreating: false,
      })

      return id
    },

    addItem: async (rawName: string, historyKey?: string) => {
      const name = normalizeName(rawName)
      if (!name) return

      await get().hydrate()
      await get().ensureList()

      const normalized = keyOf(name)
      if (get().normalizedNames.has(normalized)) return

      const next: ShoppingItem = { id: makeId(), name, checked: false }
      const nextItems = [...get().items, next]

      await commitItems(nextItems, { rebuildNames: true })
      const itemHistory = await recordShoppingItemAddition(name, historyKey)
      set({ itemHistory })
    },

    bulkAdd: async (names: string[]) => {
      await get().hydrate()
      await get().ensureList()

      const existing = new Set(get().normalizedNames)
      const additions: ShoppingItem[] = []
      let skipped = 0

      for (const raw of names) {
        const name = normalizeName(raw)
        if (!name) {
          skipped += 1
          continue
        }

        const key = keyOf(name)
        if (existing.has(key)) {
          skipped += 1
          continue
        }

        existing.add(key)
        additions.push({
          id: makeId(),
          name,
          checked: false,
        })
      }

      if (additions.length === 0) {
        return { added: 0, skipped }
      }

      const nextItems = [...get().items, ...additions]
      await commitItems(nextItems, { rebuildNames: true })
      let itemHistory = get().itemHistory
      for (const item of additions) {
        itemHistory = await recordShoppingItemAddition(item.name)
      }
      set({ itemHistory })
      return { added: additions.length, skipped }
    },


    toggleItemByName: async (rawName: string, historyKey?: string) => {
      const name = normalizeName(rawName)
      if (!name) return

      await get().hydrate()
      await get().ensureList()

      const normalized = keyOf(name)
      const exists = get().normalizedNames.has(normalized)

      if (!exists) {
        await get().addItem(name, historyKey)
        return
      }

      const nextItems = get().items.filter((i) => keyOf(i.name) !== normalized)
      await commitItems(nextItems, { rebuildNames: true })
    },

    removeItem: async (id: string) => {
      const nextItems = get().items.filter((i) => i.id !== id)
      await commitItems(nextItems, { rebuildNames: true })
    },

    setChecked: async (id: string, checked: boolean) => {
      const prev = get().items
      const nextItems = prev.map((i) => (i.id === id ? { ...i, checked } : i))

      // names did not change → no need to rebuild normalizedNames
      await commitItems(nextItems, { rebuildNames: false })
    },

    dismissQuickAddItem: async (key: string) => {
      const normalizedKey = key.trim()
      if (!normalizedKey || get().dismissedQuickAddKeys.has(normalizedKey)) return

      const nextDismissedQuickAddKeys = new Set(get().dismissedQuickAddKeys)
      nextDismissedQuickAddKeys.add(normalizedKey)
      set({ dismissedQuickAddKeys: nextDismissedQuickAddKeys })
      await setDismissedQuickAddItems([...nextDismissedQuickAddKeys])
    },

    resetForAccountChange: () => {
      hydrationPromise = null
      set({
        isHydrated: false,
        isHydrating: false,
        isCreating: false,
        isComplete: false,
        listId: null,
        items: [],
        itemHistory: [],
        dismissedQuickAddKeys: new Set(),
        normalizedNames: new Set(),
      })
    },

    clear: async () => {
      set({ items: [], normalizedNames: new Set() })
      await clearShoppingListItems()
    },

    setCompleteTemporarily: (ms = 900) => {
      set({ isComplete: true })
      setTimeout(() => set({ isComplete: false }), ms)
    },
  }
})
