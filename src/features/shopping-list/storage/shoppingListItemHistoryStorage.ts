import AsyncStorage from '@react-native-async-storage/async-storage'

import { getLocalDataScopeKey } from '@/features/storage/localDataScope'

export type ShoppingItemHistory = {
    key: string
    name: string
    count: number
    lastAddedAt: number
}

const HISTORY_STORAGE_KEY = 'shopping_list_item_history_v1'
const MAX_HISTORY_ITEMS = 100

function keyForScope() {
    return `${HISTORY_STORAGE_KEY}:${getLocalDataScopeKey()}`
}

function normalizeName(input: string) {
    return input.trim().replace(/\s+/g, ' ').toLowerCase()
}

function isShoppingItemHistory(value: unknown): value is ShoppingItemHistory {
    if (!value || typeof value !== 'object') return false

    const entry = value as Record<string, unknown>
    return (
        typeof entry.key === 'string' &&
        typeof entry.name === 'string' &&
        typeof entry.count === 'number' &&
        typeof entry.lastAddedAt === 'number'
    )
}

export async function getShoppingItemHistory(): Promise<ShoppingItemHistory[]> {
    try {
        const raw = await AsyncStorage.getItem(keyForScope())
        if (!raw) return []

        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []

        return parsed.filter(isShoppingItemHistory)
    } catch {
        return []
    }
}

export async function recordShoppingItemAddition(
    rawName: string,
    historyKey?: string,
): Promise<ShoppingItemHistory[]> {
    const name = rawName.trim().replace(/\s+/g, ' ')
    const key = historyKey?.trim() || normalizeName(name)
    if (!name || !key) return getShoppingItemHistory()

    const history = await getShoppingItemHistory()
    const previous = history.find((item) => item.key === key)
    const nextEntry: ShoppingItemHistory = {
        key,
        name,
        count: (previous?.count ?? 0) + 1,
        lastAddedAt: Date.now(),
    }
    const nextHistory = [nextEntry, ...history.filter((item) => item.key !== key)]
        .sort((a, b) => b.count - a.count || b.lastAddedAt - a.lastAddedAt)
        .slice(0, MAX_HISTORY_ITEMS)

    await AsyncStorage.setItem(keyForScope(), JSON.stringify(nextHistory))
    return nextHistory
}
