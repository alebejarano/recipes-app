import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useScreenPadding } from '@/hooks/useScreenPadding';
import { createThemedStyles } from '@/styles/createStyles';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  topSpacing?: number;        // extra spacing below status bar
  horizontalPadding?: number; // defaults to theme.spacing.lg via hook
  bottomPadding?: number;     // extra beyond safe-area
};

export default function Screen({
  children,
  scroll = true,
  contentStyle,
  style,
  topSpacing,
  horizontalPadding,
  bottomPadding,
}: ScreenProps) {
  const padding = useScreenPadding({
    top: topSpacing,
    horizontal: horizontalPadding,
    bottom: bottomPadding,
  });

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, padding, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]}>
      <View style={[styles.content, padding, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = createThemedStyles((theme) => ({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
  },
}));
