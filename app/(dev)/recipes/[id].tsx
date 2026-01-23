// app/(dev)/recipes/[id].tsx
import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import RecipeDetailScreen from '@/features/recipes/screens/RecipeDetailScreen'

export default function RecipeShowRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return <RecipeDetailScreen recipeId={id ?? ''} />
}
