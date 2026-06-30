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
  inlineTitleCta?: boolean;
};

export default function SectionHeaderRow({
  title,
  subtitle,
  ctaLabel,
  onPressCta,
  inlineTitleCta = false,
}: Props) {
  if (inlineTitleCta && ctaLabel && onPressCta && !subtitle) {
    return (
      <View style={styles.inlineRow}>
        <Text style={[styles.title, styles.inlineTitle]} numberOfLines={1}>
          {title}
        </Text>

        <Pressable onPress={onPressCta} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>{ctaLabel}</Text>
          <Feather name="chevron-right" size={18} color={theme.colors.primary} />
        </Pressable>
      </View>
    );
  }

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
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  title: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  inlineTitle: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    ...theme.textVariants.body,
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
    ...theme.textVariants.label,
    color: theme.colors.primary,
  },
}));
