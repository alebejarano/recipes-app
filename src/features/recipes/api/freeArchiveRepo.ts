import { supabase } from '@/lib/supabase'
import type { Recipe } from '@/features/recipes/api/recipesRepo'

type ArchiveRecipeRow = {
    recipe_id: string
    title: string
    subtitle: string | null
    emoji: string | null
    image_url: string | null
    folder_names: string[] | null
    updated_at: string
    created_at: string
}

export type ArchiveImport = {
    id: string
    title: string | null
    fileName: string
    bytes: number
}

function toArchiveRecipe(row: ArchiveRecipeRow): Recipe {
    return {
        id: row.recipe_id,
        userId: '',
        clientId: null,
        title: row.title,
        subtitle: row.subtitle,
        description: null,
        emoji: row.emoji,
        imageUrl: row.image_url,
        ingredients: [],
        steps: [],
        folders: (row.folder_names ?? []).map((name) => ({ id: `archive:${name}`, name, emoji: '📁' })),
        mealTimes: [],
        prepTimeMinutes: null,
        cookTimeMinutes: null,
        servings: null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }
}

export async function listFreeRecipeArchiveMetadata(): Promise<Recipe[]> {
    const { data, error } = await supabase.rpc('list_free_recipe_archive_metadata')
    if (error) throw error
    return ((data ?? []) as ArchiveRecipeRow[]).map(toArchiveRecipe)
}

export async function listFreeImportArchiveMetadata(): Promise<ArchiveImport[]> {
    const { data, error } = await supabase.rpc('list_free_import_archive_metadata')
    if (error) throw error
    return ((data ?? []) as { import_id: string; title: string | null; original_file_name: string; bytes: number }[]).map((item) => ({
        id: item.import_id,
        title: item.title,
        fileName: item.original_file_name,
        bytes: Number(item.bytes),
    }))
}
