import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'
import { listFreeRecipeLibraryMetadata } from '@/features/recipes/api/freeArchiveRepo'
import type { Recipe } from '@/features/recipes/api/recipesRepo'
import { useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes'
import type { LocalRecipe } from '@/features/recipes/storage/localRecipesStorage'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import type { StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'
import { selectFreeLocalRecipes } from '@/features/recipes/utils/freeLibrary'

export type RecipeAccess = 'active' | 'archived'

export type LibraryRecipe = {
    recipe: Recipe
    access: RecipeAccess
    isEditable: boolean
    isAvailableOffline: boolean
}

type RecipesListParams = {
    limit?: number
    search?: string
    includeArchive?: boolean
    restrictToActiveLibrary?: boolean
}

function matchesSearch(recipe: Recipe, search: string | undefined) {
    const normalized = search?.trim().toLocaleLowerCase()
    if (!normalized) return true
    return `${recipe.title} ${recipe.subtitle ?? ''} ${recipe.folders.map((folder) => folder.name).join(' ')}`
        .toLocaleLowerCase()
        .includes(normalized)
}

function normalizeActiveRecipe(recipe: Recipe | LocalRecipe): Recipe {
    return {
        ...recipe,
        userId: 'local',
        clientId: null,
    } as Recipe
}

export function useLibraryRecipesList(
    params?: RecipesListParams,
    mode: StorageScreenMode = 'auth'
) {
    const { user } = useAuth()
    const { isAuthenticated, isPremium, isLoaded } = useStorageStrategy()
    const activeQuery = useStrategyRecipesList(params, mode)
    const canAccessFreeArchive = mode === 'auth' && isAuthenticated && isLoaded && !isPremium
    // Active Free access is entirely device-local. Cloud metadata is only
    // needed when the user explicitly opens the archived-library view.
    const needsFreeArchiveMetadata = Boolean(params?.includeArchive)
    const archiveQuery = useQuery({
        queryKey: ['recipes', 'library', 'archive', user?.id ?? 'guest'],
        queryFn: listFreeRecipeLibraryMetadata,
        // This request establishes the server-authoritative downgrade snapshot
        // that caps a former Premium member's already-cached device library.
        // It never grants a cloud download or cross-device restoration.
        enabled: canAccessFreeArchive && needsFreeArchiveMetadata,
        retry: false,
    })

    const shouldRestrictCloudCache =
        canAccessFreeArchive && params?.restrictToActiveLibrary !== false
    const visibleActiveRecipes = shouldRestrictCloudCache
        // A downgrade must not make locally cached recipes disappear while an
        // archive RPC is loading, unavailable, or still being provisioned.
        // The Free subset is chosen on the device, so it also works offline.
        ? selectFreeLocalRecipes<Recipe | LocalRecipe>((activeQuery.data ?? []) as (Recipe | LocalRecipe)[])
        : activeQuery.data ?? []

    const active = visibleActiveRecipes.map<LibraryRecipe>((recipe) => ({
        recipe: normalizeActiveRecipe(recipe as Recipe | LocalRecipe),
        access: 'active',
        isEditable: true,
        isAvailableOffline: true,
    }))
    const archive = (params?.includeArchive ? archiveQuery.data ?? [] : [])
        .filter((recipe) => !recipe.isActive)
        .filter((recipe) => matchesSearch(recipe, params?.search))
        .map<LibraryRecipe>((recipe) => ({
            recipe,
            access: 'archived',
            isEditable: false,
            isAvailableOffline: false,
        }))
    const data = [...active, ...archive]

    return {
        ...activeQuery,
        data: params?.limit ? data.slice(0, params.limit) : data,
        // Archive access is optional for never-Premium users. The RPC rejects
        // those users by design, which must not turn their local library into
        // an error state.
        isLoading: activeQuery.isLoading || (Boolean(params?.includeArchive) && archiveQuery.isLoading),
        isError: activeQuery.isError,
        error: activeQuery.error,
        refetch: async () => {
            await Promise.all([
                activeQuery.refetch(),
                ...(needsFreeArchiveMetadata ? [archiveQuery.refetch()] : []),
            ])
        },
        // Fail closed for cached cloud content if the Active Library request
        // is unavailable. Local-only Free recipes remain visible.
        isAccessRestricted: shouldRestrictCloudCache,
        isArchiveAccessLoading: shouldRestrictCloudCache && archiveQuery.isLoading,
    }
}

export function findLibraryRecipe(items: LibraryRecipe[] | undefined, recipeId: string) {
    return items?.find((item) => item.recipe.id === recipeId) ?? null
}
