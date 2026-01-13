import React from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  title: string;
  rightPillText?: string;
};

export default function SectionHeader({ title, rightPillText }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>

      {!!rightPillText && (
        <View style={styles.pill}>
          <Text style={styles.pillText}>{rightPillText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
}));
