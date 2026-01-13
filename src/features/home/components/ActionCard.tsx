import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

type Props = {
  title: string;
  meta?: string;
  kicker?: string;
  leftIcon?: React.ReactNode;
  variant?: 'default' | 'highlight';
  onPress?: () => void;
};

export default function ActionCard({
  title,
  meta,
  kicker,
  leftIcon,
  variant = 'default',
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, variant === 'highlight' ? styles.highlight : null]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.left}>
        <View style={[styles.iconCircle, variant === 'highlight' ? styles.iconCircleHighlight : null]}>
          {leftIcon}
        </View>

        <View style={styles.textBlock}>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {meta ? (
            <Text style={styles.meta} numberOfLines={1}>
              {meta}
            </Text>
          ) : null}
        </View>
      </View>

      <Feather name="chevron-right" size={22} color={theme.colors.mutedForeground} />
    </Pressable>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  highlight: {
    backgroundColor: theme.colors.terracottaLight,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleHighlight: {
    backgroundColor: theme.colors.card,
  },
  textBlock: { flex: 1 },
  kicker: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginBottom: 2,
  },
  title: {
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.foreground,
  },
  meta: {
    marginTop: 2,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
}));
