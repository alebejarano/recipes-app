import React, { useCallback, useRef } from 'react';
import {
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
  scrollRestorationKey?: string;
};

const savedScrollOffsets = new Map<string, number>();

export default function Screen({
  children,
  scroll = true,
  contentStyle,
  style,
  topSpacing,
  horizontalPadding,
  bottomPadding,
  keyboardAware = false,
  scrollRestorationKey,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const shouldRestoreScrollRef = useRef(
    Boolean(scrollRestorationKey && (savedScrollOffsets.get(scrollRestorationKey) ?? 0) > 0)
  );
  const padding = useScreenPadding({
    top: topSpacing,
    horizontal: horizontalPadding,
    bottom: bottomPadding,
  });

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!scrollRestorationKey) return;
    savedScrollOffsets.set(scrollRestorationKey, event.nativeEvent.contentOffset.y);
  }, [scrollRestorationKey]);

  const handleContentSizeChange = useCallback(() => {
    if (!scrollRestorationKey || !shouldRestoreScrollRef.current) return;

    shouldRestoreScrollRef.current = false;
    const offset = savedScrollOffsets.get(scrollRestorationKey) ?? 0;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: offset, animated: false });
    });
  }, [scrollRestorationKey]);

  if (scroll) {
    const scrollView = (
      <ScrollView
        ref={scrollViewRef}
        style={styles.flex}
        contentContainerStyle={[styles.content, padding, contentStyle]}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={16}
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
