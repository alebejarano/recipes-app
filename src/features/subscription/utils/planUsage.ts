import {
  FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
  FREE_PLAN_MAX_RECIPES,
} from '@/features/subscription/constants/limits'

export type UsageBand = 'under70' | 'between70and84' | 'between85and94' | 'between95and99' | 'atLimit'

const MEGABYTE = 1024 * 1024

export function getUsageBand(percent: number): UsageBand {
  if (percent >= 100) {
    return 'atLimit'
  }
  if (percent >= 95) {
    return 'between95and99'
  }
  if (percent >= 85) {
    return 'between85and94'
  }
  if (percent >= 70) {
    return 'between70and84'
  }
  return 'under70'
}

export function formatMegabytes(bytes: number) {
  return Math.max(0, Math.round(bytes / MEGABYTE))
}

export function getRecipeUsageMessage(recipesSaved: number, usageBand: UsageBand) {
  const recipesRemaining = Math.max(FREE_PLAN_MAX_RECIPES - recipesSaved, 0)

  if (usageBand === 'atLimit') {
    return "You've reached the Free plan limit."
  }
  if (usageBand === 'between95and99') {
    return `${recipesRemaining} recipes remaining before you reach the Free limit.`
  }
  if (usageBand === 'between85and94') {
    return `Only ${recipesRemaining} recipes left on the Free plan.`
  }
  if (usageBand === 'between70and84') {
    return 'Getting close to your limit - no rush, just good to know.'
  }
  return 'You still have room to save recipes.'
}

export function getStorageUsageMessage(totalBytesUsed: number, usageBand: UsageBand) {
  const maxStorageMb = formatMegabytes(FREE_PLAN_MAX_IMPORT_TOTAL_BYTES)
  const usedMb = formatMegabytes(totalBytesUsed)
  const remainingMb = Math.max(maxStorageMb - usedMb, 0)

  if (usageBand === 'atLimit') {
    return "You've reached the Free storage limit."
  }
  if (usageBand === 'between95and99') {
    return "You're almost at the Free storage limit."
  }
  if (usageBand === 'between85and94') {
    return `Only ${remainingMb}MB remaining.`
  }
  if (usageBand === 'between70and84') {
    return 'Storage is filling up.'
  }
  return 'You still have storage available.'
}

export function buildFreePlanUsageSnapshot(recipesSaved: number, storageBytesUsed: number) {
  const safeRecipesSaved = Math.max(0, recipesSaved)
  const safeStorageBytesUsed = Math.max(0, storageBytesUsed)

  const recipesUsagePercent = Math.min((safeRecipesSaved / FREE_PLAN_MAX_RECIPES) * 100, 100)
  const recipesUsageBand = getUsageBand(recipesUsagePercent)
  const recipesUsageMessage = getRecipeUsageMessage(safeRecipesSaved, recipesUsageBand)

  const storageUsagePercent = Math.min(
    (safeStorageBytesUsed / FREE_PLAN_MAX_IMPORT_TOTAL_BYTES) * 100,
    100
  )
  const storageUsageBand = getUsageBand(storageUsagePercent)
  const storageUsageMessage = getStorageUsageMessage(safeStorageBytesUsed, storageUsageBand)

  return {
    recipesSaved: safeRecipesSaved,
    recipesUsagePercent,
    recipesUsageBand,
    recipesUsageMessage,
    storageBytesUsed: safeStorageBytesUsed,
    storageUsagePercent,
    storageUsageBand,
    storageUsageMessage,
    storageMbUsed: formatMegabytes(safeStorageBytesUsed),
    storageMbLimit: formatMegabytes(FREE_PLAN_MAX_IMPORT_TOTAL_BYTES),
    upgradeUsageBand: getUsageBand(Math.max(recipesUsagePercent, storageUsagePercent)),
  }
}
