import { useMemo } from 'react'

import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const value = (error as { message?: unknown }).message
    if (typeof value === 'string') return value
  }
  return ''
}

function isConnectivityError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('socket') ||
    message.includes('abort')
  )
}

export function useStrategyRecipesList(params?: RecipesListParams, mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const cloudQuery = useRecipesList({
    ...params,
    enabled: isStorageModeReady && !shouldUseLocalData,
  })
  const shouldFallbackToLocal = cloudSyncEnabled && isConnectivityError(cloudQuery.error)
  const shouldReadLocal = shouldUseLocalData || shouldFallbackToLocal
  const localQuery = useLocalRecipesList({
    ...params,
    enabled: isStorageModeReady && (shouldReadLocal || cloudSyncEnabled),
  })
  if (!shouldUseLocalData && cloudSyncEnabled && !cloudQuery.data && (localQuery.data?.length ?? 0) > 0) {
    return localQuery
  }
  return shouldReadLocal ? localQuery : cloudQuery
}

export function useStrategyRecipe(id: string, mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const cloudQuery = useRecipe(id, { enabled: isStorageModeReady && !shouldUseLocalData })
  const shouldFallbackToLocal = cloudSyncEnabled && isConnectivityError(cloudQuery.error)
  const shouldReadLocal = shouldUseLocalData || shouldFallbackToLocal
  const localQuery = useLocalRecipe(id, {
    enabled: isStorageModeReady && (shouldReadLocal || cloudSyncEnabled),
    matchCloudId: cloudSyncEnabled,
  })
  if (!shouldUseLocalData && cloudSyncEnabled && !cloudQuery.data && localQuery.data) {
    return localQuery
  }
  return shouldReadLocal ? localQuery : cloudQuery
}

export function useStrategyCreateRecipe(mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useCreateRecipe()
  const localMutation = useCreateLocalRecipe()
  return shouldUseLocalData
    ? localMutation
    : {
        ...cloudMutation,
        mutateAsync: async (values: Parameters<typeof cloudMutation.mutateAsync>[0]) => {
          try {
            return await cloudMutation.mutateAsync(values)
          } catch (error) {
            if (!cloudSyncEnabled || !isConnectivityError(error)) throw error
            return localMutation.mutateAsync(values)
          }
        },
      }
}

export function useStrategyUpdateRecipe(id: string, mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useUpdateRecipe(id)
  const localMutation = useUpdateLocalRecipe(id)
  return shouldUseLocalData
    ? localMutation
    : {
        ...cloudMutation,
        mutateAsync: async (values: Parameters<typeof cloudMutation.mutateAsync>[0]) => {
          try {
            return await cloudMutation.mutateAsync(values)
          } catch (error) {
            if (!cloudSyncEnabled || !isConnectivityError(error)) throw error
            return localMutation.mutateAsync(values)
          }
        },
      }
}

export function useStrategyDeleteRecipe(mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useDeleteRecipe()
  const localMutation = useDeleteLocalRecipe()

  return useMemo(
    () => ({
      mutateAsync: async (id: string) => {
        if (shouldUseLocalData) return localMutation.mutateAsync(id)
        try {
          return await cloudMutation.mutateAsync(id)
        } catch (error) {
          if (!cloudSyncEnabled || !isConnectivityError(error)) throw error
          return localMutation.mutateAsync(id)
        }
      },
      isPending: shouldUseLocalData ? localMutation.isPending : cloudMutation.isPending || localMutation.isPending,
      isError: shouldUseLocalData ? localMutation.isError : cloudMutation.isError && !isConnectivityError(cloudMutation.error),
    }),
    [cloudMutation, cloudSyncEnabled, localMutation, shouldUseLocalData]
  )
}
