import { useLocalSearchParams } from 'expo-router'
import PublicEditRecipeScreen from '@/features/recipes/screens/PublicEditRecipeScreen'

export default function PublicEditRecipeRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <PublicEditRecipeScreen key={id ?? 'new'} />
}
