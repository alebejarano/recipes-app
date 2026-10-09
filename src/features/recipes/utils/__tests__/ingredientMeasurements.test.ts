import { convertIngredientMeasurement, convertMeasurement, formatCulinaryQuantity, parseQuantity, resolveIngredient, type ConversionReferenceData } from '../ingredientMeasurements'

const units = [
    ['g', 'mass', 'metric', 'g', 1], ['kg', 'mass', 'metric', 'kg', 1000], ['oz', 'mass', 'us_customary', 'oz', 28.349523125], ['lb', 'mass', 'us_customary', 'lb', 453.59237],
    ['ml', 'volume', 'metric', 'ml', 1], ['l', 'volume', 'metric', 'L', 1000], ['tsp', 'volume', 'us_customary', 'tsp', 4.92892159375], ['tbsp', 'volume', 'us_customary', 'tbsp', 14.78676478125],
    ['cup', 'volume', 'us_customary', 'cup', 236.5882365], ['pint', 'volume', 'us_customary', 'pt', 473.176473], ['quart', 'volume', 'us_customary', 'qt', 946.352946], ['gallon', 'volume', 'us_customary', 'gal', 3785.411784],
].map(([id, dimension, system, symbol, toBaseFactor]) => ({ id, dimension, system, name: id, symbol, aliases: [], toBaseFactor })) as ConversionReferenceData['units']
const reference: ConversionReferenceData = {
    units: [...units, { id: 'celsius', dimension: 'temperature', system: 'metric', name: 'Celsius', symbol: '°C', aliases: ['C'], toBaseFactor: null }, { id: 'fahrenheit', dimension: 'temperature', system: 'us_customary', name: 'Fahrenheit', symbol: '°F', aliases: ['F'], toBaseFactor: null }, { id: 'count', dimension: 'count', system: 'neutral', name: 'count', symbol: '', aliases: ['egg', 'eggs'], toBaseFactor: 1 }],
    ingredients: [{ id: 'flour', canonicalName: 'all-purpose flour', aliases: ['plain flour', 'AP flour'] }, { id: 'honey', canonicalName: 'honey', aliases: [] }, { id: 'sugar', canonicalName: 'granulated sugar', aliases: ['white sugar'] }, { id: 'caster', canonicalName: 'caster sugar', aliases: ['superfine sugar'] }],
    families: [{ id: 'flour', aliases: ['flour'], defaultIngredientId: 'flour' }, { id: 'sugar', aliases: ['sugar', 'table sugar'], defaultIngredientId: 'sugar' }],
    weights: [{ ingredientId: 'flour', unitId: 'cup', gramsPerUnit: 125, confidence: 'high' }, { ingredientId: 'honey', unitId: 'cup', gramsPerUnit: 339, confidence: 'high' }, { ingredientId: 'sugar', unitId: 'cup', gramsPerUnit: 200, confidence: 'high' }],
}

describe('ingredient measurements', () => {
    it('converts exact mass and volume through their base units', () => {
        expect(convertMeasurement({ quantity: 1000, unitId: 'g' }, 'metric', undefined, reference).quantity).toBe(1)
        expect(convertMeasurement({ quantity: 28.349523125, unitId: 'g' }, 'us', undefined, reference).quantity).toBeCloseTo(1)
        expect(convertMeasurement({ quantity: 453.59237, unitId: 'g' }, 'us', undefined, reference).unitId).toBe('lb')
        expect(convertMeasurement({ quantity: 236.5882365, unitId: 'ml' }, 'us', undefined, reference).unitId).toBe('cup')
        expect(convertMeasurement({ quantity: 14.78676478125, unitId: 'ml' }, 'us', undefined, reference).unitId).toBe('tbsp')
        expect(convertMeasurement({ quantity: 4.92892159375, unitId: 'ml' }, 'us', undefined, reference).unitId).toBe('tsp')
        expect(convertMeasurement({ quantity: 200, unitId: 'g' }, 'us', undefined, reference).display).toBe('7.1 oz')
    })

    it('only crosses volume and mass with an explicit ingredient weight', () => {
        expect(convertMeasurement({ quantity: 200, unitId: 'g' }, 'us', { canonicalName: 'plain flour' }, reference).display).toBe('~1⅗ cup')
        expect(convertMeasurement({ quantity: 200, unitId: 'g' }, 'us', { canonicalName: 'flour' }, reference).display).toBe('~1⅗ cup')
        expect(convertMeasurement({ quantity: 1, unitId: 'cup' }, 'metric', { canonicalName: 'all-purpose flour' }, reference).quantity).toBe(125)
        expect(convertMeasurement({ quantity: 1, unitId: 'cup' }, 'metric', { canonicalName: 'honey' }, reference).quantity).toBe(339)
        expect(convertMeasurement({ quantity: 1, unitId: 'tbsp' }, 'metric', { canonicalName: 'honey' }, reference).quantity).toBeCloseTo(21.1875)
        expect(convertMeasurement({ quantity: 1, unitId: 'tsp' }, 'metric', { canonicalName: 'honey' }, reference).quantity).toBeCloseTo(7.0625)
        expect(convertMeasurement({ quantity: 1, unitId: 'cup' }, 'metric', { canonicalName: 'unknown ingredient' }, reference).display).toBe('237 ml')
    })

    it('uses explicit family defaults only after exact ingredient resolution', () => {
        expect(resolveIngredient('sugar', reference.ingredients, reference.families)?.canonicalName).toBe('granulated sugar')
        expect(resolveIngredient('caster sugar', reference.ingredients, reference.families)?.canonicalName).toBe('caster sugar')
        expect(resolveIngredient('unknown sugar blend', reference.ingredients, reference.families)).toBeUndefined()
    })

    it('converts temperature and leaves counts unchanged', () => {
        expect(convertMeasurement({ quantity: 100, unitId: 'celsius' }, 'us', undefined, reference).quantity).toBe(212)
        expect(convertMeasurement({ quantity: 32, unitId: 'fahrenheit' }, 'metric', undefined, reference).quantity).toBe(0)
        expect(convertMeasurement({ quantity: 1, unitId: 'egg' }, 'metric', undefined, reference).conversionType).toBe('none')
    })

    it('formats culinary fractions and keeps original input immutable', () => {
        expect(formatCulinaryQuantity(1.6666)).toBe('1⅔')
        expect(formatCulinaryQuantity(0.5)).toBe('½')
        expect(formatCulinaryQuantity(2.5)).toBe('2½')
        const original = { quantity: '200', unit: 'g', name: 'all-purpose flour' }
        expect(convertIngredientMeasurement(original, 'us', reference)).toMatchObject({ quantity: '~1⅗', unit: 'cup' })
        expect(original).toEqual({ quantity: '200', unit: 'g', name: 'all-purpose flour' })
    })

    it('parses cooking fractions for converter input', () => {
        expect(parseQuantity('1/2')).toBe(0.5)
        expect(parseQuantity('1/3')).toBeCloseTo(1 / 3)
        expect(parseQuantity('1 1/2')).toBe(1.5)
    })
})
