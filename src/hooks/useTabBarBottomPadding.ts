// src/hooks/useTabBarBottomPadding.ts
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useTabBarBottomPadding(extra = 0) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return tabBarHeight + insets.bottom + extra;
}
