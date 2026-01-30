import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteFolderWithRecipes } from '../api/foldersRepo'

export function useDeleteFolder() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { id: string }) => deleteFolderWithRecipes(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['folders', 'list'] })
      qc.invalidateQueries({ queryKey: ['recipes', 'list'] })
    },
  })
}
