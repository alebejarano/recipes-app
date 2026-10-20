import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import RecipeExtractionReviewScreen from '@/features/recipes/screens/RecipeExtractionReviewScreen'

export default function RecipeExtractionReviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const extractionId = Array.isArray(id) ? id[0] : id

  return <RecipeExtractionReviewScreen extractionId={extractionId ?? ''} />
}
