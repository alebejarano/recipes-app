import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Folder } from '../api/foldersRepo'
import { updateFolder } from '../api/foldersRepo'

export function useUpdateFolder() {
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
