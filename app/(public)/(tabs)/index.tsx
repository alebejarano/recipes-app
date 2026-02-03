import HomeScreen from '@/features/home/screens/HomeScreen';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';

export default function PublicHomeTab() {
  const { banner } = useLocalSearchParams<{ banner?: string }>();
  const showRecipeSuccessBanner = banner === 'recipe-saved';

  useEffect(() => {
    if (showRecipeSuccessBanner) {
      router.setParams({ banner: undefined });
    }
  }, [showRecipeSuccessBanner]);

  return <HomeScreen mode="public" showRecipeSuccessBanner={showRecipeSuccessBanner} />;
}
