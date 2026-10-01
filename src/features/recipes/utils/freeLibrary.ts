import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'

type DatedRecipe = {
  createdAt: string
  updatedAt?: string | null
}

/**
 * Free access is local-first. When an account leaves Premium, the device
 * retains the most recently saved local recipes up to the Free allowance.
 * Server archive metadata must never decide whether a locally cached recipe
 * is visible on this device.
 */
export function selectFreeLocalRecipes<T extends DatedRecipe>(recipes: T[]): T[] {
  return [...recipes]
    .sort((left, right) => {
      const updatedDifference =
        new Date(right.updatedAt ?? right.createdAt).getTime() -
        new Date(left.updatedAt ?? left.createdAt).getTime()
      if (updatedDifference !== 0) return updatedDifference
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
    .slice(0, FREE_PLAN_MAX_RECIPES)
}
