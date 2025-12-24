import CreateRecipeScreen from '@/features/recipes/screens/CreateRecipeScreen';
import { useRouter } from 'expo-router';
import React from 'react';

export default function AddRecipeRoute() {
  const router = useRouter();

  return (
    <CreateRecipeScreen
      variant="app"
    //   just for testing url
      onSaved={() => router.replace(`/(auth)/(tabs)`)}
    //   onSaved={(id) => router.replace(`/recipes/${id}`)}
    />
  );
}
