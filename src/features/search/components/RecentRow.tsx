import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';

type Props = {
  label: string;
  onPress: () => void;
};

export default function RecentRow({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Feather name="clock" size={18} style={styles.icon} />
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = createThemedStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.cardGap,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: layout.cardPadding,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    color: theme.colors.mutedForeground,
  },
  text: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
}));
