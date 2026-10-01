// src/hooks/useTabBarBottomPadding.ts
import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs';
import { useContext } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useTabBarBottomPadding(extra = 0) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const fallbackTabBarHeight =
    (Platform.select({ ios: 68, android: 66 }) ?? 66) + insets.bottom;

  return Math.max(tabBarHeight, fallbackTabBarHeight) + extra;
}
