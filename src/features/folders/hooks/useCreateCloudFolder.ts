import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Folder } from '../api/foldersCloudRepo'
import { createFolder } from '../api/foldersCloudRepo'

export function useCreateCloudFolder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { name: string; emoji?: string | null }) => createFolder(input),
    onSuccess: (folder: Folder) => {
      qc.invalidateQueries({ queryKey: ['folders', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
}
