import { useMemo } from 'react'

import { useCreateNote } from '@/features/notes/hooks/useCreateNote'
import { useDeleteNote } from '@/features/notes/hooks/useDeleteNote'
import { useCreateLocalNote, useDeleteLocalNote, useLocalNote, useLocalNotesList, useUpdateLocalNote } from '@/features/notes/hooks/useLocalNotes'
import { useNote } from '@/features/notes/hooks/useNote'
import { useNotesList } from '@/features/notes/hooks/useNotesList'
import { useUpdateNote } from '@/features/notes/hooks/useUpdateNote'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { useStorageDataMode, type StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

type NotesListParams = {
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

export function useStrategyNotesList(params?: NotesListParams, mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const cloudQuery = useNotesList({
    ...params,
    enabled: isStorageModeReady && !shouldUseLocalData,
  })
  const shouldFallbackToLocal = cloudSyncEnabled && isConnectivityError(cloudQuery.error)
  const shouldReadLocal = shouldUseLocalData || shouldFallbackToLocal
  const localQuery = useLocalNotesList({
    ...params,
    enabled: isStorageModeReady && (shouldReadLocal || cloudSyncEnabled),
  })
  if (!shouldUseLocalData && cloudSyncEnabled && !cloudQuery.data && (localQuery.data?.length ?? 0) > 0) {
    return localQuery
  }
  return shouldReadLocal ? localQuery : cloudQuery
}

export function useStrategyNote(id: string, mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { isStorageModeReady, shouldUseLocalData } = useStorageDataMode(mode)
  const cloudQuery = useNote(id, { enabled: isStorageModeReady && !shouldUseLocalData })
  const shouldFallbackToLocal = cloudSyncEnabled && isConnectivityError(cloudQuery.error)
  const shouldReadLocal = shouldUseLocalData || shouldFallbackToLocal
  const localQuery = useLocalNote(id, {
    enabled: isStorageModeReady && (shouldReadLocal || cloudSyncEnabled),
    matchCloudId: cloudSyncEnabled,
  })
  if (!shouldUseLocalData && cloudSyncEnabled && !cloudQuery.data && localQuery.data) {
    return localQuery
  }
  return shouldReadLocal ? localQuery : cloudQuery
}

export function useStrategyCreateNote(mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useCreateNote()
  const localMutation = useCreateLocalNote()
  return shouldUseLocalData
    ? localMutation
    : {
        ...cloudMutation,
        mutateAsync: async (input: Parameters<typeof cloudMutation.mutateAsync>[0]) => {
          try {
            return await cloudMutation.mutateAsync(input)
          } catch (error) {
            if (!cloudSyncEnabled || !isConnectivityError(error)) throw error
            return localMutation.mutateAsync(input)
          }
        },
      }
}

export function useStrategyUpdateNote(id: string, mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useUpdateNote(id)
  const localMutation = useUpdateLocalNote(id)
  return shouldUseLocalData
    ? localMutation
    : {
        ...cloudMutation,
        mutateAsync: async (input: Parameters<typeof cloudMutation.mutateAsync>[0]) => {
          try {
            return await cloudMutation.mutateAsync(input)
          } catch (error) {
            if (!cloudSyncEnabled || !isConnectivityError(error)) throw error
            return localMutation.mutateAsync(input)
          }
        },
      }
}

export function useStrategyDeleteNote(mode: StorageScreenMode = 'auth') {
  const { cloudSyncEnabled } = useStorageStrategy()
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const cloudMutation = useDeleteNote()
  const localMutation = useDeleteLocalNote()

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
