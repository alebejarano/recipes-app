import React from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  title: string;
  rightPillText?: string;
  subtitle?: string;
};

export default function SectionHeader({ title, rightPillText, subtitle }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

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
    gap: theme.spacing.sm,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
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
    ...theme.textVariants.labelSmall,
    color: theme.colors.mutedForeground,
  },
}));
