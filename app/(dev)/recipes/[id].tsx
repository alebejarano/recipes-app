// app/(dev)/recipes/[id].tsx
import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import RecipeDetailScreen from '@/features/recipes/screens/RecipeDetailScreen'

export default function RecipeShowRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const normalizedId = Array.isArray(id) ? id[0] : id

  return <RecipeDetailScreen recipeId={normalizedId ?? ''} />
}
