import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createLocalFolderRepo,
  deleteLocalFolderRepo,
  listLocalFoldersRepo,
  updateLocalFolderRepo,
} from '@/features/folders/api/foldersLocalRepo'
import type { Folder } from '@/features/folders/api/foldersCloudRepo'

const LIST_KEY = ['folders', 'local', 'list']

export function useLocalFoldersList() {
  return useQuery<Folder[]>({
    queryKey: LIST_KEY,
    queryFn: listLocalFoldersRepo,
  })
}

export function useCreateLocalFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; emoji?: string | null }) => createLocalFolderRepo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useUpdateLocalFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; name: string; emoji?: string | null }) =>
      updateLocalFolderRepo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function useDeleteLocalFolder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocalFolderRepo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}
