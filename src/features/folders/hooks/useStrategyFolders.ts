import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

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

export function useStrategyFoldersList(
  mode: StorageScreenMode = 'auth',
  params?: { limit?: number; search?: string }
) {
  const { canUseCloudSync } = useEntitlements()
  const target = resolveFolderStorageTarget({ mode, canUseCloudSync })

  return useQuery<Folder[]>({
    queryKey: ['folders', target, 'list', params?.limit ?? 200, params?.search ?? ''],
    queryFn: () => listFoldersForStrategy({ mode, canUseCloudSync }, params),
  })
}

export function useStrategyCreateFolder(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { canUseCloudSync } = useEntitlements()
  const target = resolveFolderStorageTarget({ mode, canUseCloudSync })

  return useMutation({
    mutationFn: (input: { name: string; emoji?: string | null }) =>
      createFolderForStrategy({ mode, canUseCloudSync }, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', target, 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
}

export function useStrategyUpdateFolder(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { canUseCloudSync } = useEntitlements()
  const target = resolveFolderStorageTarget({ mode, canUseCloudSync })

  return useMutation({
    mutationFn: (input: { id: string; name: string; emoji?: string | null }) =>
      updateFolderForStrategy({ mode, canUseCloudSync }, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', target, 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'detail'] })
    },
  })
}

export function useStrategyDeleteFolder(mode: StorageScreenMode = 'auth') {
  const qc = useQueryClient()
  const { canUseCloudSync } = useEntitlements()
  const target = resolveFolderStorageTarget({ mode, canUseCloudSync })

  return useMutation({
    mutationFn: (folderId: string) =>
      deleteFolderForStrategy({ mode, canUseCloudSync }, folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', target, 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
}
