export type MeasurementSystem = 'original' | 'metric' | 'us'

export type IngredientMeasurement = {
  quantity: string | null
  unit: string | null
  name: string
  notes?: string | null
}

type UnitDefinition = {
  family: 'volume' | 'weight'
  baseValue: number
  metricUnit: string
  usUnit: string
}

const UNITS: Record<string, UnitDefinition> = {
  tsp: { family: 'volume', baseValue: 4.92892, metricUnit: 'ml', usUnit: 'tsp' },
  tablespoon: { family: 'volume', baseValue: 14.7868, metricUnit: 'ml', usUnit: 'tbsp' },
  tbsp: { family: 'volume', baseValue: 14.7868, metricUnit: 'ml', usUnit: 'tbsp' },
  'fl oz': { family: 'volume', baseValue: 29.5735, metricUnit: 'ml', usUnit: 'fl oz' },
  cup: { family: 'volume', baseValue: 236.588, metricUnit: 'ml', usUnit: 'cup' },
  ml: { family: 'volume', baseValue: 1, metricUnit: 'ml', usUnit: 'fl oz' },
  l: { family: 'volume', baseValue: 1000, metricUnit: 'l', usUnit: 'cup' },
  g: { family: 'weight', baseValue: 1, metricUnit: 'g', usUnit: 'oz' },
  kg: { family: 'weight', baseValue: 1000, metricUnit: 'kg', usUnit: 'lb' },
  oz: { family: 'weight', baseValue: 28.3495, metricUnit: 'g', usUnit: 'oz' },
  lb: { family: 'weight', baseValue: 453.592, metricUnit: 'kg', usUnit: 'lb' },
}

const ALIASES: Record<string, string> = {
  teaspoon: 'tsp', teaspoons: 'tsp', tsps: 'tsp',
  tablespoons: 'tbsp', tbs: 'tbsp',
  'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz', floz: 'fl oz',
  cups: 'cup', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  gram: 'g', grams: 'g', kilogram: 'kg', kilograms: 'kg',
  ounce: 'oz', ounces: 'oz', pound: 'lb', pounds: 'lb', lbs: 'lb',
}

function normalizedUnit(unit: string | null | undefined) {
  const value = unit?.trim().toLowerCase().replace(/\./g, '') ?? ''
  return ALIASES[value] ?? value
}

export function parseQuantity(value: string | null | undefined): number | null {
  const text = value?.trim() ?? ''
  if (!text) return null
  const fraction = text.match(/^(\d+)?\s*(\d+)\s*\/\s*(\d+)$/)
  if (fraction) {
    const whole = Number(fraction[1] ?? 0)
    const denominator = Number(fraction[3])
    return denominator ? whole + Number(fraction[2]) / denominator : null
  }
  const number = Number(text.replace(',', '.'))
  return Number.isFinite(number) && number > 0 ? number : null
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function targetUnit(definition: UnitDefinition, baseValue: number, system: Exclude<MeasurementSystem, 'original'>) {
  if (system === 'metric') {
    if (definition.family === 'volume') return baseValue >= 1000 ? 'l' : 'ml'
    return baseValue >= 1000 ? 'kg' : 'g'
  }
  if (definition.family === 'volume') return baseValue >= 236.588 ? 'cup' : 'fl oz'
  return baseValue >= 453.592 ? 'lb' : 'oz'
}

function unitBaseValue(unit: string) {
  return UNITS[unit]?.baseValue ?? null
}

export function convertIngredientMeasurement(
  ingredient: IngredientMeasurement,
  system: MeasurementSystem
): IngredientMeasurement {
  if (system === 'original') return ingredient
  const quantity = parseQuantity(ingredient.quantity)
  const unit = normalizedUnit(ingredient.unit)
  const definition = UNITS[unit]
  if (!quantity || !definition) return ingredient

  const baseValue = quantity * definition.baseValue
  const nextUnit = targetUnit(definition, baseValue, system)
  const nextBaseValue = unitBaseValue(nextUnit)
  if (!nextBaseValue) return ingredient
  return { ...ingredient, quantity: String(round(baseValue / nextBaseValue)), unit: nextUnit }
}

export function formatIngredientMeasurement(ingredient: IngredientMeasurement) {
  return [ingredient.quantity?.trim(), ingredient.unit?.trim(), ingredient.name.trim(), ingredient.notes?.trim()]
    .filter(Boolean)
    .join(' ')
}
