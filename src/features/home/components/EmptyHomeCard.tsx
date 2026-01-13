import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPressPrimary: () => void;
  onPressSecondary: () => void;
};

export default function EmptyHomeCard({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPressPrimary,
  onPressSecondary,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <View style={styles.actions}>
        <Pressable onPress={onPressPrimary} style={styles.primary} accessibilityRole="button">
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </Pressable>

        <Pressable onPress={onPressSecondary} style={styles.secondary} accessibilityRole="button">
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    padding: theme.spacing.xl,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  title: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.foreground,
  },
  body: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  actions: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  primary: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.primaryForeground,
  },
  secondary: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.secondaryForeground,
  },
}));
