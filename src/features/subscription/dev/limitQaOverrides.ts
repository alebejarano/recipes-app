import AsyncStorage from '@react-native-async-storage/async-storage'
import React from 'react'

export type LimitQaBandOverride = 'between95and99' | 'atLimit' | null

export type LimitQaOverrides = {
  recipeUsageBandOverride: LimitQaBandOverride
  storageUsageBandOverride: LimitQaBandOverride
  forceRecipeLimitErrorOnSave: boolean
  forceStorageLimitErrorOnImport: boolean
}

const LIMIT_QA_OVERRIDES_KEY = 'dev:limit-qa-overrides'

const DEFAULT_OVERRIDES: LimitQaOverrides = {
  recipeUsageBandOverride: null,
  storageUsageBandOverride: null,
  forceRecipeLimitErrorOnSave: false,
  forceStorageLimitErrorOnImport: false,
}

let cache = DEFAULT_OVERRIDES
let hasHydrated = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

function sanitize(raw: unknown): LimitQaOverrides {
  const input = (raw ?? {}) as Partial<LimitQaOverrides>
  const recipeUsageBandOverride =
    input.recipeUsageBandOverride === 'between95and99' || input.recipeUsageBandOverride === 'atLimit'
      ? input.recipeUsageBandOverride
      : null
  const storageUsageBandOverride =
    input.storageUsageBandOverride === 'between95and99' || input.storageUsageBandOverride === 'atLimit'
      ? input.storageUsageBandOverride
      : null

  return {
    recipeUsageBandOverride,
    storageUsageBandOverride,
    forceRecipeLimitErrorOnSave: Boolean(input.forceRecipeLimitErrorOnSave),
    forceStorageLimitErrorOnImport: Boolean(input.forceStorageLimitErrorOnImport),
  }
}

export async function hydrateLimitQaOverrides() {
  if (hasHydrated) return cache
  try {
    const raw = await AsyncStorage.getItem(LIMIT_QA_OVERRIDES_KEY)
    cache = raw ? sanitize(JSON.parse(raw)) : DEFAULT_OVERRIDES
  } catch {
    cache = DEFAULT_OVERRIDES
  } finally {
    hasHydrated = true
  }
  emit()
  return cache
}

export function getLimitQaOverridesSnapshot() {
  return cache
}

export async function setLimitQaOverrides(patch: Partial<LimitQaOverrides>) {
  const next = sanitize({ ...cache, ...patch })
  cache = next
  hasHydrated = true
  await AsyncStorage.setItem(LIMIT_QA_OVERRIDES_KEY, JSON.stringify(next))
  emit()
}

export async function clearLimitQaOverrides() {
  cache = DEFAULT_OVERRIDES
  hasHydrated = true
  await AsyncStorage.removeItem(LIMIT_QA_OVERRIDES_KEY)
  emit()
}

export function subscribeToLimitQaOverrides(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLimitQaOverrides() {
  const [overrides, setOverrides] = React.useState<LimitQaOverrides>(cache)
  const [isHydrating, setIsHydrating] = React.useState(!hasHydrated)

  React.useEffect(() => {
    let isCancelled = false

    void hydrateLimitQaOverrides().finally(() => {
      if (!isCancelled) setIsHydrating(false)
    })

    const unsubscribe = subscribeToLimitQaOverrides(() => {
      if (isCancelled) return
      setOverrides(getLimitQaOverridesSnapshot())
    })

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [])

  return { overrides, isHydrating }
}
