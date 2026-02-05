import CreateRecipeScreen, {
  type CreateRecipeEntry,
  type CreateRecipeVariant,
} from '@/features/recipes/screens/CreateRecipeScreen'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'

export default function CreateRecipeRoute() {
  const params = useLocalSearchParams<{
    variant?: CreateRecipeVariant
    entry?: CreateRecipeEntry
  }>()

  const variant: CreateRecipeVariant =
    params?.variant === 'onboarding' ? 'onboarding' : 'app'
  const entry: CreateRecipeEntry | undefined =
    params?.entry === 'pdf' || params?.entry === 'scratch' ? params.entry : undefined

  return (
    <CreateRecipeScreen
      variant={variant}
      entry={entry}
    />
  )
}
