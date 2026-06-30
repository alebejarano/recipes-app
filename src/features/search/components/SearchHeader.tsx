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
    ...theme.textVariants.display,
    color: theme.colors.foreground,
  },
  subtitle: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
}));
