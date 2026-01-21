import { create } from 'zustand'

import type { ShoppingItem } from '../storage/shoppingListItemsStorage'
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

  // derived
  normalizedNames: Set<string>

  // actions
  hydrate: () => Promise<void>
  ensureList: () => Promise<string>
  addItem: (name: string) => Promise<void>
  toggleItemByName: (name: string) => Promise<void>
  removeItem: (id: string) => Promise<void>
  setChecked: (id: string, checked: boolean) => Promise<void>

  // optional utilities
  clear: () => Promise<void>
  setCompleteTemporarily: (ms?: number) => void
}

export const useShoppingListStore = create<ShoppingListState>((set, get) => {
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
    normalizedNames: new Set(),

    hydrate: async () => {
      const { isHydrated, isHydrating } = get()
      if (isHydrated || isHydrating) return

      set({ isHydrating: true })

      const id = await getShoppingListId()
      const items = id ? await getShoppingListItems() : []

      set({
        listId: id,
        items,
        normalizedNames: buildNameSet(items),
        isHydrating: false,
        isHydrated: true,
      })
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

    addItem: async (rawName: string) => {
      const name = normalizeName(rawName)
      if (!name) return

      await get().ensureList()

      const normalized = keyOf(name)
      if (get().normalizedNames.has(normalized)) return

      const next: ShoppingItem = { id: makeId(), name, checked: false }
      const nextItems = [...get().items, next]

      await commitItems(nextItems, { rebuildNames: true })
    },

    bulkAdd: async (names: string[]) => {
    await get().ensureList()

    const existing = get().normalizedNames
    const additions: ShoppingItem[] = []

    for (const raw of names) {
        const name = normalizeName(raw)
        if (!name) continue

        const key = keyOf(name)
        if (existing.has(key)) continue

        additions.push({
        id: makeId(),
        name,
        checked: false,
        })
    }

    if (additions.length === 0) return

    const nextItems = [...get().items, ...additions]
    await commitItems(nextItems, { rebuildNames: true })
    },


    toggleItemByName: async (rawName: string) => {
      const name = normalizeName(rawName)
      if (!name) return

      await get().ensureList()

      const normalized = keyOf(name)
      const exists = get().normalizedNames.has(normalized)

      if (!exists) {
        await get().addItem(name)
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
