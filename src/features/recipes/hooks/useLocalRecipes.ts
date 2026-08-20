import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAnalyticsCapture } from '@/features/analytics/events'
import { useAuth } from '@/features/auth/context/AuthContext'
import type { RecipeFormSubmitValues } from '@/features/recipes/components/RecipeForm'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import type { LocalRecipe } from '@/features/recipes/storage/localRecipesStorage'
import {
  createLocalRecipe,
  deleteLocalRecipe,
  getLocalRecipe,
  getLocalRecipeByIdOrCloudId,
  listLocalRecipes,
  updateLocalRecipe,
} from '@/features/recipes/storage/localRecipesStorage'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'

const LIST_KEY = ['recipes', 'local', 'list']
type LocalRecipesListParams = {
  limit?: number
  search?: string
  enabled?: boolean
}

export function useLocalRecipesList(params?: LocalRecipesListParams) {
  const { user } = useAuth()
  return useQuery<LocalRecipe[]>({
    queryKey: [...LIST_KEY, user?.id ?? 'guest', params?.limit ?? 200, params?.search ?? ''],
    queryFn: () => listLocalRecipes(params),
    enabled: params?.enabled ?? true,
  })
}

export function useLocalRecipe(id: string, options?: { enabled?: boolean; matchCloudId?: boolean }) {
  const { user } = useAuth()
  return useQuery<LocalRecipe | null>({
    queryKey: ['recipes', 'local', 'detail', user?.id ?? 'guest', options?.matchCloudId ? 'any' : 'id', id],
    queryFn: () => options?.matchCloudId ? getLocalRecipeByIdOrCloudId(id) : getLocalRecipe(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
  })
}

export function useCreateLocalRecipe() {
  const { isPremium } = useStorageStrategy()
  const plan = isPremium ? 'premium' : 'free'
  const qc = useQueryClient()
  const captureAnalyticsEvent = useAnalyticsCapture()
  return useMutation({
    mutationFn: (values: RecipeFormSubmitValues) => createLocalRecipe(values, { plan }),
    onSuccess: () => {
      captureAnalyticsEvent('recipe_created', {
        source: 'manual',
        storage_mode: 'local',
      })
      qc.invalidateQueries({ queryKey: LIST_KEY })
      void triggerRecipeSync()
    },
  })
}

export function useUpdateLocalRecipe(id: string) {
  const { user } = useAuth()
  const { isPremium } = useStorageStrategy()
  const plan = isPremium ? 'premium' : 'free'
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: RecipeFormSubmitValues) => updateLocalRecipe(id, values, { plan }),
    onSuccess: (recipe) => {
      const ownerScope = user?.id ?? 'guest'
      qc.setQueryData(['recipes', 'local', 'detail', ownerScope, 'id', id], recipe)
      qc.setQueryData(['recipes', 'local', 'detail', ownerScope, 'any', id], recipe)
      qc.invalidateQueries({ queryKey: LIST_KEY })
      void triggerRecipeSync()
    },
  })
}

export function useDeleteLocalRecipe() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocalRecipe(id),
    onSuccess: (_data, id) => {
      const ownerScope = user?.id ?? 'guest'
      qc.removeQueries({ queryKey: ['recipes', 'local', 'detail', ownerScope, 'id', id] })
      qc.removeQueries({ queryKey: ['recipes', 'local', 'detail', ownerScope, 'any', id] })
      qc.invalidateQueries({ queryKey: LIST_KEY })
      void triggerRecipeSync()
    },
  })
}
