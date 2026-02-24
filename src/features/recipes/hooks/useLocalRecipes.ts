import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { RecipeFormSubmitValues } from '@/features/recipes/components/RecipeForm'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import type { LocalRecipe } from '@/features/recipes/storage/localRecipesStorage'
import {
  createLocalRecipe,
  deleteLocalRecipe,
  getLocalRecipe,
  listLocalRecipes,
  updateLocalRecipe,
} from '@/features/recipes/storage/localRecipesStorage'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'

const LIST_KEY = ['recipes', 'local', 'list']
type LocalRecipesListParams = {
  limit?: number
  search?: string
}

export function useLocalRecipesList(params?: LocalRecipesListParams) {
  return useQuery<LocalRecipe[]>({
    queryKey: [...LIST_KEY, params?.limit ?? 200, params?.search ?? ''],
    queryFn: () => listLocalRecipes(params),
  })
}

export function useLocalRecipe(id: string) {
  return useQuery<LocalRecipe | null>({
    queryKey: ['recipes', 'local', 'detail', id],
    queryFn: () => getLocalRecipe(id),
    enabled: Boolean(id),
  })
}

export function useCreateLocalRecipe() {
  const { isPremium } = useStorageStrategy()
  const plan = isPremium ? 'premium' : 'free'
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: RecipeFormSubmitValues) => createLocalRecipe(values, { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      void triggerRecipeSync()
    },
  })
}

export function useUpdateLocalRecipe(id: string) {
  const { isPremium } = useStorageStrategy()
  const plan = isPremium ? 'premium' : 'free'
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: RecipeFormSubmitValues) => updateLocalRecipe(id, values, { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: ['recipes', 'local', 'detail', id] })
      void triggerRecipeSync()
    },
  })
}

export function useDeleteLocalRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocalRecipe(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: ['recipes', 'local', 'detail', id] })
      qc.invalidateQueries({ queryKey: LIST_KEY })
      void triggerRecipeSync()
    },
  })
}
