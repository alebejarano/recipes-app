import { useLocalSearchParams } from 'expo-router'

import EditRecipeScreen from '@/features/recipes/screens/EditRecipeScreen'

export default function EditRecipeRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  return <EditRecipeScreen key={id ?? 'recipe-edit'} />
}
