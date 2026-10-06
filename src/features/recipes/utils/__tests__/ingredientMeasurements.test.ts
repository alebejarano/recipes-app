import {
  convertIngredientMeasurement,
  formatIngredientMeasurement,
} from '../ingredientMeasurements'

describe('ingredient measurements', () => {
  it('converts volume to metric units', () => {
    expect(convertIngredientMeasurement({ quantity: '2', unit: 'tbsp', name: 'olive oil' }, 'metric')).toMatchObject({
      quantity: '29.57', unit: 'ml',
    })
  })

  it('converts cups only within volume measurements', () => {
    expect(convertIngredientMeasurement({ quantity: '1', unit: 'cup', name: 'flour' }, 'metric')).toMatchObject({
      quantity: '236.59', unit: 'ml',
    })
  })

  it('converts weight to US units', () => {
    expect(convertIngredientMeasurement({ quantity: '500', unit: 'g', name: 'flour' }, 'us')).toMatchObject({
      quantity: '1.1', unit: 'lb',
    })
  })

  it('keeps unsupported and count units unchanged', () => {
    const ingredient = { quantity: '3', unit: 'eggs', name: 'eggs' }
    expect(convertIngredientMeasurement(ingredient, 'metric')).toEqual(ingredient)
  })

  it('formats an ingredient for display and shopping lists', () => {
    expect(formatIngredientMeasurement({ quantity: '1', unit: 'cup', name: 'flour', notes: 'sifted' })).toBe('1 cup flour sifted')
  })
})
