import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

export type RecipePreview = {
  id: string;
  title: string;
  emoji?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  items: RecipePreview[];
  cardWidth: number;
  gap: number;
  rightPadding: number;
  formatMeta: (item: RecipePreview) => string;
  onPressItem?: (id: string) => void;
};

export default function RecipeCarousel({
  items,
  cardWidth,
  gap,
  rightPadding,
  formatMeta,
  onPressItem,
}: Props) {
  if (items.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.scroll, { paddingRight: rightPadding }]}
      snapToInterval={cardWidth + gap}
      snapToAlignment="start"
      decelerationRate="fast"
    >
      <View style={[styles.row, { columnGap: gap }]}>
        {items.map((r) => {
          const hasEmoji = Boolean(r.emoji);
          const isMinimal = !hasEmoji;

          const content = (
            <Pressable
              key={r.id}
              onPress={() => onPressItem?.(r.id)}
              style={[
                styles.card,
                { width: cardWidth },
                isMinimal ? styles.cardMinimal : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Open ${r.title}`}
            >
              {hasEmoji ? (
                <View style={styles.iconWrap}>
                  <Text style={styles.emoji}>{r.emoji}</Text>
                </View>
              ) : null}

              {isMinimal ? (
                <View style={styles.minimalContent}>
                  <Text style={styles.title} numberOfLines={2}>
                    {r.title}
                  </Text>

                  <Text style={styles.meta} numberOfLines={1}>
                    {formatMeta(r)}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.title} numberOfLines={2}>
                    {r.title}
                  </Text>

                  <Text style={styles.meta} numberOfLines={1}>
                    {formatMeta(r)}
                  </Text>
                </>
              )}
            </Pressable>
          );

          return content;
        })}
      </View>
    </ScrollView>
  );
}

const styles = createThemedStyles((theme) => ({
  scroll: {},
  row: {
    flexDirection: 'row',
  },
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  cardMinimal: {
    justifyContent: 'center',
  },
  minimalContent: {
    width: '100%',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emoji: {
    fontSize: 20,
  },
  title: {
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.foreground,
  },
  meta: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
}));
