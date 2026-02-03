import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { LocalFolder } from '@/features/folders/storage/localFoldersStorage'
import {
  createLocalFolder,
  deleteLocalFolder,
  listLocalFolders,
  updateLocalFolder,
} from '@/features/folders/storage/localFoldersStorage'

const LIST_KEY = ['folders', 'local', 'list']

export function useLocalFoldersList() {
  return useQuery<LocalFolder[]>({
    queryKey: LIST_KEY,
    queryFn: listLocalFolders,
  })
}

export function useCreateLocalFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; emoji?: string | null }) => createLocalFolder(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useUpdateLocalFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; name: string; emoji?: string | null }) =>
      updateLocalFolder(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useDeleteLocalFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocalFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}
