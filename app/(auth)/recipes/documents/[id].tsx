import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import RecipeDocumentDetailScreen from '@/features/recipes/screens/RecipeDocumentDetailScreen'

export default function RecipeDocumentRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const normalizedId = Array.isArray(id) ? id[0] : id

  return <RecipeDocumentDetailScreen documentId={normalizedId ?? ''} />
}
