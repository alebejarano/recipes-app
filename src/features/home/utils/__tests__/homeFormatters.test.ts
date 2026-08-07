import { getRecommendedPick } from '../homeFormatters'

describe('getRecommendedPick', () => {
  it('falls back to the most recently updated recipe with a generic label when no recipe matches the meal time', () => {
    const pick = getRecommendedPick(
      [
        { title: 'Older recipe', mealTimes: ['breakfast'], createdAt: '2026-08-01T12:00:00.000Z' },
        { title: 'Newest recipe', mealTimes: ['lunch'], createdAt: '2026-08-02T12:00:00.000Z' },
      ],
      new Date('2026-08-03T20:00:00.000Z'),
    )

    expect(pick).toMatchObject({
      label: 'Recommended for you',
      recipe: { title: 'Newest recipe' },
    })
  })
})
