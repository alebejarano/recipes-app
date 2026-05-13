import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import type { Folder } from '@/features/folders/api/foldersCloudRepo'
import {
  createFolderForStrategy,
  deleteFolderForStrategy,
  listFoldersForStrategy,
  resolveFolderStorageTarget,
  updateFolderForStrategy,
} from '@/features/folders/services/foldersService'
import { useEntitlements } from '@/features/subscription/hooks/useEntitlements'
import type { StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'
import { useLocalFoldersList, useCreateLocalFolder, useUpdateLocalFolder, useDeleteLocalFolder } from '@/features/folders/hooks/useLocalFolders'

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
    message.includes('abort') ||
    message.includes('unknownhost') ||
    message.includes('unable to resolve host') ||
    message.includes('no address associated with hostname')
  )
}

export function useStrategyFoldersList(
  mode: StorageScreenMode = 'auth',
  params?: { limit?: number; search?: string }
) {
  const { canUseCloudSync } = useEntitlements()
  const target = resolveFolderStorageTarget({ mode, canUseCloudSync })
  const cloudQuery = useQuery<Folder[]>({
    queryKey: ['folders', target, 'list', params?.limit ?? 200, params?.search ?? ''],
    queryFn: () => listFoldersForStrategy({ mode, canUseCloudSync }, params),
  })
  const localQuery = useLocalFoldersList()
  const shouldFallbackToLocal = target === 'cloud' && canUseCloudSync && isConnectivityError(cloudQuery.error)

  if (shouldFallbackToLocal) return localQuery
  return cloudQuery
}

export function useStrategyCreateFolder(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { canUseCloudSync } = useEntitlements()
  const target = resolveFolderStorageTarget({ mode, canUseCloudSync })
  const cloudMutation = useMutation({
    mutationFn: (input: { name: string; emoji?: string | null }) =>
      createFolderForStrategy({ mode, canUseCloudSync }, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', target, 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
  const localMutation = useCreateLocalFolder()

  return target === 'local'
    ? localMutation
    : {
        ...cloudMutation,
        mutateAsync: async (input: Parameters<typeof cloudMutation.mutateAsync>[0]) => {
          try {
            return await cloudMutation.mutateAsync(input)
          } catch (error) {
            if (!canUseCloudSync || !isConnectivityError(error)) throw error
            return localMutation.mutateAsync(input)
          }
        },
      }
}

export function useStrategyUpdateFolder(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { canUseCloudSync } = useEntitlements()
  const target = resolveFolderStorageTarget({ mode, canUseCloudSync })
  const cloudMutation = useMutation({
    mutationFn: (input: { id: string; name: string; emoji?: string | null }) =>
      updateFolderForStrategy({ mode, canUseCloudSync }, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', target, 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'detail'] })
    },
  })
  const localMutation = useUpdateLocalFolder()

  return target === 'local'
    ? localMutation
    : {
        ...cloudMutation,
        mutateAsync: async (input: Parameters<typeof cloudMutation.mutateAsync>[0]) => {
          try {
            return await cloudMutation.mutateAsync(input)
          } catch (error) {
            if (!canUseCloudSync || !isConnectivityError(error)) throw error
            return localMutation.mutateAsync(input)
          }
        },
      }
}

export function useStrategyDeleteFolder(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { canUseCloudSync } = useEntitlements()
  const target = resolveFolderStorageTarget({ mode, canUseCloudSync })
  const cloudMutation = useMutation({
    mutationFn: (folderId: string) =>
      deleteFolderForStrategy({ mode, canUseCloudSync }, folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', target, 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
  const localMutation = useDeleteLocalFolder()

  return useMemo(
    () => ({
      mutateAsync: async (folderId: string) => {
        if (target === 'local') return localMutation.mutateAsync(folderId)
        try {
          return await cloudMutation.mutateAsync(folderId)
        } catch (error) {
          if (!canUseCloudSync || !isConnectivityError(error)) throw error
          return localMutation.mutateAsync(folderId)
        }
      },
      isPending: target === 'local' ? localMutation.isPending : cloudMutation.isPending || localMutation.isPending,
      isError: target === 'local' ? localMutation.isError : cloudMutation.isError && !isConnectivityError(cloudMutation.error),
    }),
    [canUseCloudSync, cloudMutation, localMutation, target]
  )
}
