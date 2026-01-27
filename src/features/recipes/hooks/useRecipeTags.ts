import { useQuery } from '@tanstack/react-query'

import type { RecipeTagSuggestion } from '../api/recipesRepo'
import { listRecipeTags } from '../api/recipesRepo'

export function useRecipeTags() {
  return useQuery<RecipeTagSuggestion[]>({
    queryKey: ['recipes', 'tags'],
    queryFn: () => listRecipeTags(),
    staleTime: 5 * 60 * 1000,
  })
}
