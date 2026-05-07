import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenPadding } from '@/hooks/useScreenPadding';
import { createThemedStyles } from '@/styles/createStyles';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  topSpacing?: number;        // extra spacing below status bar
  horizontalPadding?: number; // defaults to layout.screenPadding via hook
  bottomPadding?: number;     // extra beyond safe-area
  keyboardAware?: boolean;
};

export default function Screen({
  children,
  scroll = true,
  contentStyle,
  style,
  topSpacing,
  horizontalPadding,
  bottomPadding,
  keyboardAware = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const padding = useScreenPadding({
    top: topSpacing,
    horizontal: horizontalPadding,
    bottom: bottomPadding,
  });

  if (scroll) {
    const scrollView = (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={keyboardAware}
      >
        {children}
      </ScrollView>
    );

    return (
      <SafeAreaView style={[styles.safe, style]}>
        {keyboardAware ? (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
          >
            {scrollView}
          </KeyboardAvoidingView>
        ) : (
          scrollView
        )}
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
