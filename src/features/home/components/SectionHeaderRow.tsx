import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

type Props = {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
};

export default function SectionHeaderRow({ title, subtitle, ctaLabel, onPressCta }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      {(subtitle || ctaLabel) ? (
        <View style={styles.row}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : <View />}

          {ctaLabel && onPressCta ? (
            <Pressable onPress={onPressCta} style={styles.cta} accessibilityRole="button">
              <Text style={styles.ctaText}>{ctaLabel}</Text>
              <Feather name="chevron-right" size={18} color={theme.colors.primary} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    gap: theme.spacing.md,
  },
  title: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.foreground,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: theme.radii.full,
  },
  ctaText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
  },
}));
