import { useMemo } from 'react'

import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

import { useCreateRecipe } from '@/features/recipes/hooks/useCreateRecipe'
import { useDeleteRecipe } from '@/features/recipes/hooks/useDeleteRecipe'
import { useRecipe } from '@/features/recipes/hooks/useRecipe'
import { useRecipesList } from '@/features/recipes/hooks/useRecipesList'
import { useCreateLocalRecipe, useDeleteLocalRecipe, useLocalRecipe, useLocalRecipesList, useUpdateLocalRecipe } from '@/features/recipes/hooks/useLocalRecipes'
import { useUpdateRecipe } from '@/features/recipes/hooks/useUpdateRecipe'

type RecipesListParams = {
  limit?: number
  search?: string
}

export function useStrategyRecipesList(params?: RecipesListParams, mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudQuery = useRecipesList({
    ...params,
    enabled: !shouldUseLocalData,
  })
  const localQuery = useLocalRecipesList(params)
  return shouldUseLocalData ? localQuery : cloudQuery
}

export function useStrategyRecipe(id: string, mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudQuery = useRecipe(id, { enabled: !shouldUseLocalData })
  const localQuery = useLocalRecipe(id)
  return shouldUseLocalData ? localQuery : cloudQuery
}

export function useStrategyCreateRecipe(mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useCreateRecipe()
  const localMutation = useCreateLocalRecipe()
  return shouldUseLocalData ? localMutation : cloudMutation
}

export function useStrategyUpdateRecipe(id: string, mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useUpdateRecipe(id)
  const localMutation = useUpdateLocalRecipe(id)
  return shouldUseLocalData ? localMutation : cloudMutation
}

export function useStrategyDeleteRecipe(mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useDeleteRecipe()
  const localMutation = useDeleteLocalRecipe()

  return useMemo(
    () => ({
      mutateAsync: async (id: string) =>
        shouldUseLocalData ? localMutation.mutateAsync(id) : cloudMutation.mutateAsync(id),
      isPending: shouldUseLocalData ? localMutation.isPending : cloudMutation.isPending,
      isError: shouldUseLocalData ? localMutation.isError : cloudMutation.isError,
    }),
    [cloudMutation, localMutation, shouldUseLocalData]
  )
}
