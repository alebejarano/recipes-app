import AsyncStorage from '@react-native-async-storage/async-storage'

import { supabase } from '@/lib/supabase'
import type { ConversionReferenceData, ConversionIngredient, IngredientFamily, IngredientUnitWeight, RecipeUnit } from '@/features/recipes/utils/ingredientMeasurements'

const CACHE_KEY = 'recipes:conversion-reference:v3'

type UnitRow = { id: string; dimension: RecipeUnit['dimension']; system: RecipeUnit['system']; name: string; symbol: string; aliases: string[]; to_base_factor: number | string | null }
type IngredientRow = { id: string; canonical_name: string; aliases: string[]; family_id: string | null }
type FamilyRow = { id: string; aliases: string[]; default_ingredient_id: string | null }
type WeightRow = { ingredient_id: string; unit_id: string; grams_per_unit: number | string; confidence: IngredientUnitWeight['confidence'] }

function mapReference(units: UnitRow[], ingredients: IngredientRow[], families: FamilyRow[], weights: WeightRow[]): ConversionReferenceData {
    return {
        units: units.map((unit) => ({ ...unit, toBaseFactor: unit.to_base_factor === null ? null : Number(unit.to_base_factor) })),
        ingredients: ingredients.map((ingredient): ConversionIngredient => ({ id: ingredient.id, canonicalName: ingredient.canonical_name, aliases: ingredient.aliases ?? [], familyId: ingredient.family_id })),
        families: families.map((family): IngredientFamily => ({ id: family.id, aliases: family.aliases ?? [], defaultIngredientId: family.default_ingredient_id })),
        weights: weights.map((weight): IngredientUnitWeight => ({ ingredientId: weight.ingredient_id, unitId: weight.unit_id, gramsPerUnit: Number(weight.grams_per_unit), confidence: weight.confidence })),
    }
}

async function cachedReference() {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw) as ConversionReferenceData
    } catch {
        return null
    }
}

/** Fetches each reference collection once, then only the weights for its resolved ingredient IDs. */
export async function fetchConversionReference(): Promise<ConversionReferenceData> {
    const cached = await cachedReference()
    try {
        const [unitsResult, ingredientsResult, familiesResult] = await Promise.all([
            supabase.from('recipe_units').select('id, dimension, system, name, symbol, aliases, to_base_factor').eq('is_active', true),
            supabase.from('recipe_conversion_ingredients').select('id, canonical_name, aliases, family_id').eq('is_active', true),
            supabase.from('ingredient_families').select('id, aliases, default_ingredient_id').eq('is_active', true),
        ])
        if (unitsResult.error) throw unitsResult.error
        if (ingredientsResult.error) throw ingredientsResult.error
        if (familiesResult.error) throw familiesResult.error
        const ingredientIds = (ingredientsResult.data ?? []).map((ingredient) => ingredient.id)
        const weightsResult = ingredientIds.length
            ? await supabase.from('ingredient_unit_weights').select('ingredient_id, unit_id, grams_per_unit, confidence').in('ingredient_id', ingredientIds)
            : { data: [], error: null }
        if (weightsResult.error) throw weightsResult.error
        const reference = mapReference(unitsResult.data ?? [], ingredientsResult.data ?? [], familiesResult.data ?? [], weightsResult.data ?? [])
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(reference))
        return reference
    } catch (error) {
        if (cached) return cached
        throw error
    }
}
