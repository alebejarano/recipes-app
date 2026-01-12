import { createThemedStyles } from '@/styles/createStyles';
import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle: string;
};

export default function SearchHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}));
