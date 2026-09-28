import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/features/auth/context/AuthContext'
import { listFreeRecipeArchiveMetadata } from '@/features/recipes/api/freeArchiveRepo'
import type { Recipe } from '@/features/recipes/api/recipesRepo'
import { useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes'
import type { LocalRecipe } from '@/features/recipes/storage/localRecipesStorage'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import type { StorageScreenMode } from '@/features/storage/hooks/useStorageDataMode'

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
    const archiveQuery = useQuery<Recipe[]>({
        queryKey: ['recipes', 'library', 'archive', user?.id ?? 'guest'],
        queryFn: listFreeRecipeArchiveMetadata,
        enabled: Boolean(params?.includeArchive) && mode === 'auth' && isAuthenticated && isLoaded && !isPremium,
        retry: false,
    })

    const active = (activeQuery.data ?? []).map<LibraryRecipe>((recipe) => ({
        recipe: normalizeActiveRecipe(recipe),
        access: 'active',
        isEditable: true,
        isAvailableOffline: true,
    }))
    const archive = (params?.includeArchive ? archiveQuery.data ?? [] : [])
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
        isLoading: activeQuery.isLoading,
        isError: activeQuery.isError,
        error: activeQuery.error,
        refetch: async () => {
            await Promise.all([activeQuery.refetch(), archiveQuery.refetch()])
        },
    }
}

export function findLibraryRecipe(items: LibraryRecipe[] | undefined, recipeId: string) {
    return items?.find((item) => item.recipe.id === recipeId) ?? null
}
