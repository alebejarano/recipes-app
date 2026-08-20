export type RecipeLibraryStage = 'empty' | 'starter' | 'established' | 'large'

export type HomeActivityItem = {
  id: string
  type: 'recipe' | 'note' | 'import' | 'shopping-list'
  title: string
  subtitle?: string
  timestamp: string
  destination: 'recipe' | 'note' | 'imports' | 'shopping-list'
  documentId?: string | null
}

type ActivitySource = {
  id: string
  documentId?: string | null
  title?: string | null
  createdAt: string
  updatedAt?: string | null
}

export function getRecipeLibraryStage(recipeCount: number): RecipeLibraryStage {
  if (recipeCount <= 0) return 'empty'
  if (recipeCount <= 5) return 'starter'
  if (recipeCount <= 19) return 'established'
  return 'large'
}

export function buildHomeActivity(params: {
  recipes: ActivitySource[]
  notes: ActivitySource[]
  imports: ActivitySource[]
  noteFallbackTitle: string
  importFallbackTitle: string
  limit?: number
}): HomeActivityItem[] {
  const { recipes, notes, imports, noteFallbackTitle, importFallbackTitle, limit = 4 } = params
  const items: HomeActivityItem[] = [
    ...recipes.map((recipe) => ({
      id: `recipe:${recipe.id}`,
      type: 'recipe' as const,
      title: recipe.title?.trim() || '',
      timestamp: recipe.updatedAt ?? recipe.createdAt,
      destination: 'recipe' as const,
    })),
    ...notes.map((note) => ({
      id: `note:${note.id}`,
      type: 'note' as const,
      title: note.title?.trim() || noteFallbackTitle,
      timestamp: note.updatedAt ?? note.createdAt,
      destination: 'note' as const,
    })),
    ...imports.map((item) => ({
      id: `import:${item.id}`,
      type: 'import' as const,
      title: item.title?.trim() || importFallbackTitle,
      timestamp: item.updatedAt ?? item.createdAt,
      destination: 'imports' as const,
      documentId: item.documentId ?? null,
    })),
  ]

  return items
    .filter((item) => Boolean(item.title) && Number.isFinite(new Date(item.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
}

export function getHomeCapabilities(params: {
  recipeCount: number
  notesCount: number
  importsCount: number
  hasShoppingList: boolean
  hasCollections: boolean
  hasFavorites: boolean
}) {
  const stage = getRecipeLibraryStage(params.recipeCount)
  const hasRecipes = params.recipeCount > 0
  const hasNotes = params.notesCount > 0
  const hasImports = params.importsCount > 0
  const hasRecentActivity = hasRecipes || hasNotes || hasImports || params.hasShoppingList

  return {
    stage,
    hasRecipes,
    hasNotes,
    hasImports,
    hasShoppingList: params.hasShoppingList,
    hasRecentActivity,
    hasCollections: params.hasCollections,
    hasFavorites: params.hasFavorites,
  }
}
