// src/hooks/useTabBarBottomPadding.ts
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useTabBarBottomPadding(extra = 0) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  return tabBarHeight + insets.bottom + extra;
}
