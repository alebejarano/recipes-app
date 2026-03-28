import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';
import { theme } from '@/styles/theme';

type Props = {
  text: string;
  onDismiss: () => void;
};

export default function SuccessBanner({ text, onDismiss }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.sparkle}>✨</Text>
      <Text style={styles.text}>{text}</Text>

      <Pressable
        onPress={onDismiss}
        style={styles.close}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        hitSlop={12}
      >
        <Feather name="x" size={18} color={theme.colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.listGap,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sparkle: { fontSize: 16 },
  text: {
    flex: 1,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
  },
  close: {
    width: 34,
    height: 34,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
