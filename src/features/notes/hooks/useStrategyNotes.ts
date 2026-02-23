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

export function useStrategyNotesList(params?: NotesListParams, mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData: baseLocalMode } = useStorageDataMode(mode)
  const { cloudSyncEnabled } = useStorageStrategy()
  const shouldUseLocalData = baseLocalMode || (mode === 'auth' && cloudSyncEnabled)
  const cloudQuery = useNotesList({
    ...params,
    enabled: !shouldUseLocalData,
  })
  const localQuery = useLocalNotesList(params)
  return shouldUseLocalData ? localQuery : cloudQuery
}

export function useStrategyNote(id: string, mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData: baseLocalMode } = useStorageDataMode(mode)
  const { cloudSyncEnabled } = useStorageStrategy()
  const shouldUseLocalData = baseLocalMode || (mode === 'auth' && cloudSyncEnabled)
  const cloudQuery = useNote(id, { enabled: !shouldUseLocalData })
  const localQuery = useLocalNote(id)
  return shouldUseLocalData ? localQuery : cloudQuery
}

export function useStrategyCreateNote(mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData: baseLocalMode } = useStorageDataMode(mode)
  const { cloudSyncEnabled } = useStorageStrategy()
  const shouldUseLocalData = baseLocalMode || (mode === 'auth' && cloudSyncEnabled)
  const cloudMutation = useCreateNote()
  const localMutation = useCreateLocalNote()
  return shouldUseLocalData ? localMutation : cloudMutation
}

export function useStrategyUpdateNote(id: string, mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData: baseLocalMode } = useStorageDataMode(mode)
  const { cloudSyncEnabled } = useStorageStrategy()
  const shouldUseLocalData = baseLocalMode || (mode === 'auth' && cloudSyncEnabled)
  const cloudMutation = useUpdateNote(id)
  const localMutation = useUpdateLocalNote(id)
  return shouldUseLocalData ? localMutation : cloudMutation
}

export function useStrategyDeleteNote(mode: StorageScreenMode = 'auth') {
  const { shouldUseLocalData: baseLocalMode } = useStorageDataMode(mode)
  const { cloudSyncEnabled } = useStorageStrategy()
  const shouldUseLocalData = baseLocalMode || (mode === 'auth' && cloudSyncEnabled)
  const cloudMutation = useDeleteNote()
  const localMutation = useDeleteLocalNote()

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
