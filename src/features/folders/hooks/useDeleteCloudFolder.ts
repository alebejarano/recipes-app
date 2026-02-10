import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteFolderWithRecipes } from '../api/foldersCloudRepo'

export function useDeleteCloudFolder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string }) => deleteFolderWithRecipes(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
}
