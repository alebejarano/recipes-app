import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteManagedImport,
  listManagedImports,
  type ManagedImport,
} from '@/features/recipes/storage/importsStorage'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'

const IMPORTS_KEY = ['recipes', 'imports', 'managed']
const DOCS_KEY = ['recipes', 'documents']
const DOCS_USAGE_KEY = ['recipes', 'documents', 'usage']

export function useManagedImports() {
  return useQuery<ManagedImport[]>({
    queryKey: IMPORTS_KEY,
    queryFn: listManagedImports,
  })
}

export function useDeleteManagedImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (importId: string) => deleteManagedImport(importId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: IMPORTS_KEY })
      qc.invalidateQueries({ queryKey: DOCS_KEY })
      qc.invalidateQueries({ queryKey: DOCS_USAGE_KEY })
      qc.invalidateQueries({ queryKey: ['recipes'] })
      void triggerRecipeSync()
    },
  })
}
