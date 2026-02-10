import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Folder } from '../api/foldersCloudRepo'
import { updateFolder } from '../api/foldersCloudRepo'

export function useUpdateCloudFolder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string; name: string; emoji?: string | null }) =>
      updateFolder(input),
    onSuccess: (folder: Folder) => {
      qc.invalidateQueries({ queryKey: ['folders', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'detail'] })
    },
  })
}
