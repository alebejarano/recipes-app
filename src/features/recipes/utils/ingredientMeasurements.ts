export type MeasurementSystem = 'original' | 'metric' | 'us'

export type IngredientMeasurement = { quantity: string | null; unit: string | null; name: string; notes?: string | null }
export type RecipeUnit = {
    id: string
    dimension: 'mass' | 'volume' | 'temperature' | 'count'
    system: 'metric' | 'us_customary' | 'imperial' | 'neutral'
    name: string
    symbol: string
    aliases: string[]
    toBaseFactor: number | null
}
export type ConversionIngredient = { id: string; canonicalName: string; aliases: string[]; familyId?: string | null }
export type IngredientFamily = { id: string; aliases: string[]; defaultIngredientId: string | null }
export type IngredientUnitWeight = { ingredientId: string; unitId: string; gramsPerUnit: number; confidence: 'high' | 'medium' | 'low' }
export type ConversionReferenceData = { units: RecipeUnit[]; ingredients: ConversionIngredient[]; families: IngredientFamily[]; weights: IngredientUnitWeight[] }
export type Measurement = { quantity: number; unitId: string }
export type IngredientContext = { ingredientId?: string; canonicalName?: string }
export type ConversionResult = {
    quantity: number
    unitId: string
    display: string
    confidence: 'exact' | 'high' | 'medium' | 'low' | 'unsupported'
    conversionType: 'unit' | 'ingredient_density' | 'none'
}

const FRACTIONS: [number, string][] = [[0, ''], [1 / 4, '¼'], [1 / 3, '⅓'], [2 / 5, '⅖'], [1 / 2, '½'], [3 / 5, '⅗'], [2 / 3, '⅔'], [3 / 4, '¾']]
const US_CUP_ML = 236.5882365

function clean(value: string) {
    return value.toLowerCase().trim().replace(/[.,;:()[\]{}]/g, ' ').replace(/\s+/g, ' ')
}

/** Conservative by design: ingredients only match a canonical name or explicit alias. */
export function normalizeIngredientName(value: string) {
    return clean(value)
}

export function resolveIngredient(name: string, ingredients: ConversionIngredient[], families: IngredientFamily[] = []) {
    const normalized = normalizeIngredientName(name)
    const exact = ingredients.find((item) => normalizeIngredientName(item.canonicalName) === normalized)
        ?? ingredients.find((item) => item.aliases.some((alias) => normalizeIngredientName(alias) === normalized))
    if (exact) return exact
    const family = families.find((item) => item.aliases.some((alias) => normalizeIngredientName(alias) === normalized))
    return family?.defaultIngredientId ? ingredients.find((item) => item.id === family.defaultIngredientId) : undefined
}

export function parseQuantity(value: string | null | undefined): number | null {
    const text = value?.trim() ?? ''
    if (!text) return null
    const normalized = text.replace(/[¼⅓½⅔¾]/g, (character) => ({ '¼': '.25', '⅓': '.3333333333', '½': '.5', '⅔': '.6666666667', '¾': '.75' }[character] ?? character))
    const fraction = normalized.match(/^(\d+)?\s*(\d+)\s*\/\s*(\d+)$/)
    if (fraction) {
        const denominator = Number(fraction[3])
        return denominator ? Number(fraction[1] ?? 0) + Number(fraction[2]) / denominator : null
    }
    const parsed = Number(normalized.replace(',', '.'))
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function rounded(value: number, decimals: number) {
    const factor = 10 ** decimals
    return Math.round((value + Number.EPSILON) * factor) / factor
}

export function formatCulinaryQuantity(value: number, unitId?: string): string {
    if (!Number.isFinite(value)) return ''
    if (unitId === 'g' || unitId === 'kg') return String(rounded(value, Math.abs(value) < 10 && value % 1 ? 1 : 0))
    if (unitId === 'oz' || unitId === 'lb') return String(rounded(value, 1))
    if (unitId === 'ml' || unitId === 'l') return String(rounded(value, value < 10 ? 1 : 0))
    const whole = Math.floor(value + 0.000001)
    const fraction = value - whole
    const closest = FRACTIONS.reduce((best, current) => Math.abs(current[0] - fraction) < Math.abs(best[0] - fraction) ? current : best)
    if (Math.abs(closest[0] - fraction) <= 0.045) return closest[0] === 0 ? String(whole) : `${whole || ''}${closest[1]}`
    return String(rounded(value, 2))
}

function findUnit(unitId: string, units: RecipeUnit[]) {
    const normalized = clean(unitId)
    return units.find((unit) => clean(unit.id) === normalized || clean(unit.symbol) === normalized || unit.aliases.some((alias) => clean(alias) === normalized))
}

function targetUnit(dimension: RecipeUnit['dimension'], baseValue: number, target: Exclude<MeasurementSystem, 'original'>, units: RecipeUnit[]) {
    const desired = dimension === 'mass'
        ? (target === 'metric' ? (baseValue >= 1000 ? 'kg' : 'g') : (baseValue >= 453.59237 ? 'lb' : 'oz'))
        : dimension === 'volume'
            ? (target === 'metric' ? (baseValue >= 1000 ? 'l' : 'ml') : (baseValue >= US_CUP_ML ? 'cup' : baseValue >= 14.78676478125 ? 'tbsp' : 'tsp'))
            : target === 'metric' ? 'celsius' : 'fahrenheit'
    return units.find((unit) => unit.id === desired)
}

function unsupported(measurement: Measurement): ConversionResult {
    return { quantity: measurement.quantity, unitId: measurement.unitId, display: `${formatCulinaryQuantity(measurement.quantity, measurement.unitId)} ${measurement.unitId}`.trim(), confidence: 'unsupported', conversionType: 'none' }
}

function densityResult(quantity: number, unit: RecipeUnit, confidence: IngredientUnitWeight['confidence']): ConversionResult {
    return { quantity, unitId: unit.id, display: `~${formatCulinaryQuantity(quantity, unit.id)} ${unit.symbol}`, confidence, conversionType: 'ingredient_density' }
}

/** Pure conversion engine. It receives database reference data and never supplies a generic density. */
export function convertMeasurement(measurement: Measurement, targetSystem: Exclude<MeasurementSystem, 'original'>, ingredient: IngredientContext | undefined, reference: ConversionReferenceData): ConversionResult {
    const source = findUnit(measurement.unitId, reference.units)
    if (!source || !Number.isFinite(measurement.quantity) || measurement.quantity <= 0 || source.dimension === 'count') return unsupported(measurement)
    if (source.dimension === 'temperature') {
        const celsius = source.id === 'celsius' ? measurement.quantity : (measurement.quantity - 32) * 5 / 9
        const quantity = targetSystem === 'metric' ? celsius : celsius * 9 / 5 + 32
        const target = targetUnit('temperature', quantity, targetSystem, reference.units)
        if (!target) return unsupported(measurement)
        return { quantity, unitId: target.id, display: `${formatCulinaryQuantity(quantity)} ${target.symbol}`, confidence: 'exact', conversionType: 'unit' }
    }
    const matchedIngredient = ingredient?.ingredientId
        ? reference.ingredients.find((item) => item.id === ingredient.ingredientId)
        : ingredient?.canonicalName ? resolveIngredient(ingredient.canonicalName, reference.ingredients, reference.families) : undefined
    const cupWeight = matchedIngredient && reference.weights.find((weight) => weight.ingredientId === matchedIngredient.id && weight.unitId === 'cup')
    if (cupWeight && source.toBaseFactor) {
        if (targetSystem === 'metric' && source.dimension === 'volume') {
            const grams = measurement.quantity * source.toBaseFactor / US_CUP_ML * cupWeight.gramsPerUnit
            const target = targetUnit('mass', grams, 'metric', reference.units)
            if (target?.toBaseFactor) return densityResult(grams / target.toBaseFactor, target, cupWeight.confidence)
        }
        if (targetSystem === 'us' && source.dimension === 'mass') {
            const cupAmount = measurement.quantity * source.toBaseFactor / cupWeight.gramsPerUnit
            const target = targetUnit('volume', cupAmount * US_CUP_ML, 'us', reference.units)
            if (target?.toBaseFactor) return densityResult(cupAmount * US_CUP_ML / target.toBaseFactor, target, cupWeight.confidence)
        }
    }
    if (!source.toBaseFactor) return unsupported(measurement)
    const target = targetUnit(source.dimension, measurement.quantity * source.toBaseFactor, targetSystem, reference.units)
    if (!target?.toBaseFactor) return unsupported(measurement)
    const quantity = measurement.quantity * source.toBaseFactor / target.toBaseFactor
    return { quantity, unitId: target.id, display: `${formatCulinaryQuantity(quantity, target.id)} ${target.symbol}`, confidence: 'exact', conversionType: 'unit' }
}

export function convertIngredientMeasurement(ingredient: IngredientMeasurement, system: MeasurementSystem, reference?: ConversionReferenceData): IngredientMeasurement {
    if (system === 'original' || !reference) return ingredient
    const quantity = parseQuantity(ingredient.quantity)
    if (!quantity || !ingredient.unit) return ingredient
    const result = convertMeasurement({ quantity, unitId: ingredient.unit }, system, { canonicalName: ingredient.name }, reference)
    if (result.conversionType === 'none') return ingredient
    const unit = reference.units.find((item) => item.id === result.unitId)
    const symbol = unit?.symbol ?? result.unitId
    return { ...ingredient, quantity: result.display.slice(0, -symbol.length).trim(), unit: symbol }
}

export function formatIngredientMeasurement(ingredient: IngredientMeasurement) {
    return [ingredient.quantity?.trim(), ingredient.unit?.trim(), ingredient.name.trim(), ingredient.notes?.trim()].filter(Boolean).join(' ')
}
