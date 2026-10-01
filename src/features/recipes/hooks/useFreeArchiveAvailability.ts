import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'
import {
  listFreeImportLibraryMetadata,
  listFreeRecipeLibraryMetadata,
} from '@/features/recipes/api/freeArchiveRepo'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'

type FreeArchiveAvailability = {
  hasArchivedRecipes: boolean
  hasArchivedImports: boolean
  hasArchivedContent: boolean
}

/**
 * The archive is only relevant when the Free server snapshot contains items
 * outside the account's active Free library. Notes are intentionally omitted:
 * they have no Free-plan count limit and remain local-first.
 */
export function useFreeArchiveAvailability() {
  const { user } = useAuth()
  const { isAuthenticated, isLoaded, isPremium } = useStorageStrategy()
  const enabled = isAuthenticated && isLoaded && !isPremium && Boolean(user?.id)

  return useQuery<FreeArchiveAvailability>({
    queryKey: ['recipes', 'library', 'archive-availability', user?.id ?? 'guest'],
    enabled,
    retry: false,
    queryFn: async () => {
      const [recipes, imports] = await Promise.all([
        listFreeRecipeLibraryMetadata(),
        listFreeImportLibraryMetadata(),
      ])
      const hasArchivedRecipes = recipes.some((recipe) => !recipe.isActive)
      const hasArchivedImports = imports.some((item) => !item.isActive)
      return {
        hasArchivedRecipes,
        hasArchivedImports,
        hasArchivedContent: hasArchivedRecipes || hasArchivedImports,
      }
    },
  })
}
