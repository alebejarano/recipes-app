import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';
import { theme } from '@/styles/theme';

type Props = {
  title: string;
  meta?: string;
  kicker?: string;
  leftIcon?: React.ReactNode;
  variant?: 'default' | 'highlight' | 'shoppingEmpty' | 'shoppingActive' | 'nextAction';
  noTopMargin?: boolean;
  onPress?: () => void;
};

export default function ActionCard({
  title,
  meta,
  kicker,
  leftIcon,
  variant = 'default',
  noTopMargin = false,
  onPress,
}: Props) {
  const isHighlight = variant === 'highlight';
  const isShoppingEmpty = variant === 'shoppingEmpty';
  const isShoppingActive = variant === 'shoppingActive';
  const isNextAction = variant === 'nextAction';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        noTopMargin ? styles.noTopMargin : null,
        isHighlight ? styles.highlight : null,
        isShoppingEmpty ? styles.shoppingEmpty : null,
        isShoppingActive ? styles.shoppingActive : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.iconCircle,
            isHighlight ? styles.iconCircleHighlight : null,
            isShoppingEmpty ? styles.shoppingIconCircle : null,
            isShoppingActive ? styles.shoppingIconCircleActive : null,
            isNextAction ? styles.nextActionIconCircle : null,
          ]}
        >
          {leftIcon}
        </View>

        <View style={styles.textBlock}>
          {kicker ? <Text style={styles.kicker}>{kicker}</Text> : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {meta ? (
            <Text
              style={[
                styles.meta,
                isShoppingEmpty || isShoppingActive ? styles.shoppingMeta : null,
              ]}
              numberOfLines={1}
            >
              {meta}
            </Text>
          ) : null}
        </View>
      </View>

      <Feather
        name="chevron-right"
        size={22}
        color={isShoppingActive ? theme.colors.primary : theme.colors.mutedForeground}
      />
    </Pressable>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    marginTop: theme.spacing.md,
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noTopMargin: {
    marginTop: 0,
  },
  highlight: {
    backgroundColor: theme.colors.terracottaLight,
  },
  shoppingEmpty: {
    borderStyle: 'dashed',
    borderColor: theme.colors.primarySoft,
    backgroundColor: theme.colors.cream,
  },
  shoppingActive: {
    borderColor: theme.colors.primarySoft,
    backgroundColor: theme.colors.muted,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.cardGap,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleHighlight: {
    backgroundColor: theme.colors.card,
  },
  shoppingIconCircle: {
    width: 50,
    height: 50,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary16,
  },
  shoppingIconCircleActive: {
    width: 50,
    height: 50,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary16,
  },
  nextActionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.secondary,
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
  shoppingMeta: {
    marginTop: 0,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.xl,
  },
}));
