// src/__mocks__/home.ts

export type MealTime = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export type Recipe = {
  id: string
  title: string
  subtitle?: string
  emoji?: string
  mealTimes?: MealTime[]
  createdAt: string
  updatedAt?: string
}

export type Note = {
  id: string
  title: string
  updatedAt: string
}

export type ShoppingList = {
  id: string
  checkedCount: number
  totalCount: number
}

export type HomeMocks = {
  recipes: Recipe[]
  notes: Note[]
  lastViewedRecipe: Recipe | null
  shoppingList: ShoppingList | null
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Mediterranean Bowl',
    subtitle: 'Light & satisfying',
    emoji: '🥗',
    mealTimes: ['lunch', 'dinner'],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Lemon Herb Chicken',
    emoji: '🍋',
    mealTimes: ['lunch', 'dinner'],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Simple Pasta Aglio e Olio',
    emoji: '🍝',
    mealTimes: ['dinner'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Berry Smoothie',
    emoji: '🫐',
    mealTimes: ['breakfast', 'snack'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'Turmeric Soup',
    emoji: '🍲',
    mealTimes: ['lunch', 'dinner'],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockNotes: Note[] = [
  {
    id: 'n1',
    title: 'Meal prep ideas',
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockShoppingList: ShoppingList = {
  id: 'to-buy',
  checkedCount: 5,
  totalCount: 12,
}

/* -------------------------------------------------------------------------- */
/* State helpers                                                               */
/* -------------------------------------------------------------------------- */

export function getTransitionalHomeMocks(): HomeMocks {
  return {
    recipes: mockRecipes.slice(0, 2),
    notes: [] as Note[],
    lastViewedRecipe: null,
    shoppingList: null,
  }
}

export function getEmptyHomeMocks(): HomeMocks {
  return {
    recipes: [] as Recipe[],
    notes: [] as Note[],
    lastViewedRecipe: null,
    shoppingList: null,
  }
}

export function getMatureHomeMocks(): HomeMocks {
  return {
    recipes: mockRecipes,
    notes: mockNotes,
    lastViewedRecipe: mockRecipes[1],
    shoppingList: mockShoppingList,
  }
}
