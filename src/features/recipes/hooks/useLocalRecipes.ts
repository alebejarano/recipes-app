import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { RecipeFormSubmitValues } from '@/features/recipes/components/RecipeForm'
import type { LocalRecipe } from '@/features/recipes/storage/localRecipesStorage'
import {
  createLocalRecipe,
  deleteLocalRecipe,
  getLocalRecipe,
  listLocalRecipes,
  updateLocalRecipe,
} from '@/features/recipes/storage/localRecipesStorage'

const LIST_KEY = ['recipes', 'local', 'list']

export function useLocalRecipesList() {
  return useQuery<LocalRecipe[]>({
    queryKey: LIST_KEY,
    queryFn: listLocalRecipes,
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: RecipeFormSubmitValues) => createLocalRecipe(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useUpdateLocalRecipe(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (values: RecipeFormSubmitValues) => updateLocalRecipe(id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: ['recipes', 'local', 'detail', id] })
    },
  })
}

export function useDeleteLocalRecipe() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocalRecipe(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}
