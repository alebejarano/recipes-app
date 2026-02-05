import { useLocalSearchParams } from 'expo-router'
import React from 'react'

import PublicCreateRecipeScreen from '@/features/recipes/screens/PublicCreateRecipeScreen'
import type { CreateRecipeEntry } from '@/features/recipes/screens/CreateRecipeScreen'

export default function PublicCreateRecipeRoute() {
  const params = useLocalSearchParams<{ entry?: CreateRecipeEntry }>()
  const entry: CreateRecipeEntry | undefined =
    params?.entry === 'pdf' || params?.entry === 'scratch' ? params.entry : undefined

  return <PublicCreateRecipeScreen entry={entry} />
}
