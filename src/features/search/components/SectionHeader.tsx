import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
};

export default function SectionHeader({ icon, title, rightLabel, onRightPress }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Feather name={icon} size={18} style={styles.icon} />
        <Text style={styles.title}>{title}</Text>
      </View>

      {rightLabel ? (
        <Pressable
          onPress={onRightPress}
          disabled={!onRightPress}
          style={({ pressed }) => [styles.right, pressed && styles.pressed]}
        >
          <Text style={styles.rightText}>{rightLabel}</Text>
        </Pressable>
      ) : (
        <View />
      )}
    </View>
  );
}

const styles = createThemedStyles(theme => ({
  row: {
    marginTop: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  icon: {
    color: theme.colors.mutedForeground,
  },
  title: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  right: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  pressed: {
    opacity: 0.7,
  },
  rightText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.primary,
  },
}));
