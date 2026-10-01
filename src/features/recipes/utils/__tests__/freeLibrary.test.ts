import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'
import { selectFreeLocalRecipes } from '@/features/recipes/utils/freeLibrary'

describe('selectFreeLocalRecipes', () => {
  it('keeps every local recipe when the device is below the Free limit', () => {
    const recipes = [
      { id: 'older', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'newer', createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' },
    ]

    expect(selectFreeLocalRecipes(recipes).map((recipe) => recipe.id)).toEqual(['newer', 'older'])
  })

  it('keeps the most recently updated local recipes when over the Free limit', () => {
    const recipes = Array.from({ length: FREE_PLAN_MAX_RECIPES + 1 }, (_, index) => ({
      id: String(index),
      createdAt: new Date(2026, 0, 1, 0, 0, index).toISOString(),
      updatedAt: new Date(2026, 0, 1, 0, 0, index).toISOString(),
    }))

    const selected = selectFreeLocalRecipes(recipes)

    expect(selected).toHaveLength(FREE_PLAN_MAX_RECIPES)
    expect(selected[0].id).toBe(String(FREE_PLAN_MAX_RECIPES))
    expect(selected.some((recipe) => recipe.id === '0')).toBe(false)
  })
})
