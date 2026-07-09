import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs';
import React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabScreenPreviewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function TabScreenPreview({ children, style }: TabScreenPreviewProps) {
  const insets = useSafeAreaInsets();
  const baseHeight = Platform.select({ ios: 64, android: 62 }) ?? 62;
  const tabBarHeight = baseHeight + insets.bottom;

  return (
    <BottomTabBarHeightContext.Provider value={tabBarHeight}>
      <View style={[styles.container, style]}>{children}</View>
    </BottomTabBarHeightContext.Provider>
  );
}

const styles = {
  container: {
    flex: 1,
  },
} satisfies Record<'container', ViewStyle>;
