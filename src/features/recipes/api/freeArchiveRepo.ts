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
    createdAt: string
    isActive: boolean
}

export type ArchiveRecipe = Recipe & { isActive: boolean }

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
    return ((data ?? []) as { import_id: string; title: string | null; original_file_name: string; bytes: number; created_at: string }[]).map((item) => ({
        id: item.import_id,
        title: item.title,
        fileName: item.original_file_name,
        bytes: Number(item.bytes),
        createdAt: item.created_at,
        isActive: false,
    }))
}

export async function listFreeRecipeLibraryMetadata(): Promise<ArchiveRecipe[]> {
    const { data, error } = await supabase.rpc('list_free_recipe_library_metadata')
    if (error) throw error
    return ((data ?? []) as (ArchiveRecipeRow & { is_active: boolean })[]).map((item) => ({
        ...toArchiveRecipe(item),
        isActive: item.is_active,
    }))
}

export async function listFreeImportLibraryMetadata(): Promise<ArchiveImport[]> {
    const { data, error } = await supabase.rpc('list_free_import_library_metadata')
    if (error) throw error
    return ((data ?? []) as { import_id: string; title: string | null; original_file_name: string; bytes: number; created_at: string; is_active: boolean }[]).map((item) => ({
        id: item.import_id,
        title: item.title,
        fileName: item.original_file_name,
        bytes: Number(item.bytes),
        createdAt: item.created_at,
        isActive: item.is_active,
    }))
}

export async function setFreeActiveRecipeIds(recipeIds: string[]) {
    const { error } = await supabase.rpc('set_free_active_recipe_slots', { p_recipe_ids: recipeIds })
    if (error) throw error
}

export async function setFreeActiveImportIds(importIds: string[]) {
    const { error } = await supabase.rpc('set_free_active_import_slots', { p_import_ids: importIds })
    if (error) throw error
}
