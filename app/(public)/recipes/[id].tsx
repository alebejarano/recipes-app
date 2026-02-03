import { useLocalSearchParams } from 'expo-router'
import PublicRecipeDetailScreen from '@/features/recipes/screens/PublicRecipeDetailScreen'

export default function PublicRecipeDetailRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <PublicRecipeDetailScreen recipeId={id ?? ''} />
}
