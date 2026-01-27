import CreateRecipeScreen, { CreateRecipeVariant } from '@/features/recipes/screens/CreateRecipeScreen'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'

export default function CreateRecipeRoute() {
  const params = useLocalSearchParams<{ variant?: CreateRecipeVariant }>()

  const variant: CreateRecipeVariant =
    params?.variant === 'onboarding' ? 'onboarding' : 'app'

  return (
    <CreateRecipeScreen
      variant={variant}
    />
  )
}
