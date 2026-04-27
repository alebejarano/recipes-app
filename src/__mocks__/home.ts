// src/__mocks__/home.ts

export type MealTime = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export type Recipe = {
  id: string
  title: string
  subtitle?: string
  emoji?: string
  folders?: { id: string; name: string; emoji: string }[]
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

type RecipeSeed = {
  title: string
  subtitle?: string
  emoji?: string
  folders?: { id: string; name: string; emoji: string }[]
  mealTimes?: MealTime[]
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const recipeSeeds: RecipeSeed[] = [
  {
    title: 'Mediterranean Bowl',
    subtitle: 'Light & satisfying',
    emoji: '🥗',
    folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }],
    mealTimes: ['lunch', 'dinner'],
  },
  {
    title: 'Lemon Herb Chicken',
    emoji: '🍋',
    folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }],
    mealTimes: ['lunch', 'dinner'],
  },
  {
    title: 'Simple Pasta Aglio e Olio',
    emoji: '🍝',
    folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }],
    mealTimes: ['dinner'],
  },
  {
    title: 'Berry Smoothie',
    emoji: '🫐',
    folders: [{ id: 'breakfast', name: 'Breakfast', emoji: '🌅' }],
    mealTimes: ['breakfast', 'snack'],
  },
  {
    title: 'Turmeric Soup',
    emoji: '🍲',
    folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }],
    mealTimes: ['lunch', 'dinner'],
  },
  {
    title: 'Avocado Toast',
    emoji: '🥑',
    folders: [{ id: 'breakfast', name: 'Breakfast', emoji: '🌅' }],
    mealTimes: ['breakfast'],
  },
  {
    title: 'Roasted Salmon',
    emoji: '🐟',
    folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }],
    mealTimes: ['dinner'],
  },
  {
    title: 'Chicken Wrap',
    emoji: '🌯',
    folders: [{ id: 'lunch', name: 'Lunch', emoji: '🥗' }],
    mealTimes: ['lunch'],
  },
  { title: 'Veggie Fried Rice', emoji: '🍚', folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }], mealTimes: ['lunch', 'dinner'] },
  { title: 'Tomato Soup', emoji: '🍅', folders: [{ id: 'lunch', name: 'Lunch', emoji: '🥗' }], mealTimes: ['lunch', 'dinner'] },
  { title: 'Pancakes', emoji: '🥞', folders: [{ id: 'breakfast', name: 'Breakfast', emoji: '🌅' }], mealTimes: ['breakfast'] },
  { title: 'Steak Tacos', emoji: '🌮', folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }], mealTimes: ['dinner'] },
  { title: 'Greek Yogurt Bowl', emoji: '🥣', folders: [{ id: 'breakfast', name: 'Breakfast', emoji: '🌅' }], mealTimes: ['breakfast', 'snack'] },
  { title: 'Mushroom Risotto', emoji: '🍄', folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }], mealTimes: ['dinner'] },
  { title: 'Caprese Sandwich', emoji: '🥪', folders: [{ id: 'lunch', name: 'Lunch', emoji: '🥗' }], mealTimes: ['lunch'] },
  { title: 'Coconut Curry', emoji: '🥥', folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }], mealTimes: ['dinner'] },
  { title: 'Caesar Salad', emoji: '🥬', folders: [{ id: 'lunch', name: 'Lunch', emoji: '🥗' }], mealTimes: ['lunch'] },
  { title: 'Banana Muffins', emoji: '🧁', folders: [{ id: 'breakfast', name: 'Breakfast', emoji: '🌅' }], mealTimes: ['breakfast', 'snack'] },
  { title: 'Shrimp Noodles', emoji: '🍤', folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }], mealTimes: ['dinner'] },
  { title: 'Stuffed Peppers', emoji: '🫑', folders: [{ id: 'dinner', name: 'Dinner', emoji: '🍽️' }], mealTimes: ['dinner'] },
  { title: 'Hummus Plate', emoji: '🧆', folders: [{ id: 'lunch', name: 'Lunch', emoji: '🥗' }], mealTimes: ['lunch', 'snack'] },
  { title: 'Apple Crumble', emoji: '🍎', folders: [{ id: 'Dessert', name: 'Dessert', emoji: '🍰' }], mealTimes: ['snack'] },
]

export const mockRecipes: Recipe[] = recipeSeeds.map((recipe, index) => ({
  id: String(index + 1),
  title: recipe.title,
  subtitle: recipe.subtitle,
  emoji: recipe.emoji,
  folders: recipe.folders,
  mealTimes: recipe.mealTimes,
  createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
}))

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

export function getMediumHomeMocks(): HomeMocks {
  return {
    recipes: mockRecipes.slice(0, 8),
    notes: [] as Note[],
    lastViewedRecipe: mockRecipes[2],
    shoppingList: mockShoppingList,
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
