import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Folder } from '../api/foldersRepo'
import { createFolder } from '../api/foldersRepo'

export function useCreateFolder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { name: string; emoji?: string | null }) => createFolder(input),
    onSuccess: (folder: Folder) => {
      qc.invalidateQueries({ queryKey: ['folders', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
}
