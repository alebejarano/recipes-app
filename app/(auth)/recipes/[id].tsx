// app/(dev)/recipes/[id].tsx
import { useLocalSearchParams } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

export default function RecipeShowRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Recipe</Text>
      <Text>id: {id}</Text>
    </View>
  )
}
