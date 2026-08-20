import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createLocalFolderRepo,
  deleteLocalFolderRepo,
  listLocalFoldersRepo,
  updateLocalFolderRepo,
} from '@/features/folders/api/foldersLocalRepo'
import type { Folder } from '@/features/folders/api/foldersCloudRepo'
import { useAuth } from '@/features/auth/context/AuthContext'

const LIST_KEY = ['folders', 'local', 'list']

export function useLocalFoldersList() {
  const { user } = useAuth()
  return useQuery<Folder[]>({
    queryKey: [...LIST_KEY, user?.id ?? 'guest'],
    queryFn: () => listLocalFoldersRepo(),
  })
}

export function useCreateLocalFolder() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; emoji?: string | null }) => createLocalFolderRepo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...LIST_KEY, user?.id ?? 'guest'] })
    },
  })
}

export function useUpdateLocalFolder() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; name: string; emoji?: string | null }) =>
      updateLocalFolderRepo(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...LIST_KEY, user?.id ?? 'guest'] })
    },
  })
}

export function useDeleteLocalFolder() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLocalFolderRepo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...LIST_KEY, user?.id ?? 'guest'] })
      qc.invalidateQueries({ queryKey: ['recipes'] })
    },
  })
}
