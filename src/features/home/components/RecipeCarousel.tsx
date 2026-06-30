import { Image } from 'expo-image';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';

export type RecipePreview = {
  id: string;
  title: string;
  emoji?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  items: RecipePreview[];
  cardWidth: number;
  gap: number;
  rightPadding: number;
  formatMeta?: (item: RecipePreview) => string;
  onPressItem?: (id: string) => void;
  showMeta?: boolean;
  variant?: 'default' | 'compact';
};

export default function RecipeCarousel({
  items,
  cardWidth,
  gap,
  rightPadding,
  formatMeta,
  onPressItem,
  showMeta = true,
  variant = 'default',
}: Props) {
  if (items.length === 0) return null;
  const isCompact = variant === 'compact';

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
          const hasMedia = Boolean(r.emoji || r.imageUrl);
          const isMinimal = !hasMedia;

          const content = (
            <Pressable
              key={r.id}
              onPress={() => onPressItem?.(r.id)}
              style={[
                styles.card,
                isCompact ? styles.cardCompact : null,
                { width: cardWidth },
                isMinimal ? styles.cardMinimal : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Open ${r.title}`}
            >
              {hasMedia ? (
                <View style={[styles.iconWrap, isCompact ? styles.iconWrapCompact : null]}>
                  {r.imageUrl ? (
                    <Image
                      source={{ uri: r.imageUrl }}
                      style={styles.image}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <Text style={[styles.emoji, isCompact ? styles.emojiCompact : null]}>{r.emoji}</Text>
                  )}
                </View>
              ) : null}

              {isMinimal ? (
                <View style={styles.minimalContent}>
                  <Text style={[styles.title, isCompact ? styles.titleCompact : null]} numberOfLines={2}>
                    {r.title}
                  </Text>

                  {showMeta && formatMeta ? (
                    <Text style={[styles.meta, isCompact ? styles.metaCompact : null]} numberOfLines={1}>
                      {formatMeta(r)}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <>
                  <Text style={[styles.title, isCompact ? styles.titleCompact : null]} numberOfLines={2}>
                    {r.title}
                  </Text>

                  {showMeta && formatMeta ? (
                    <Text style={[styles.meta, isCompact ? styles.metaCompact : null]} numberOfLines={1}>
                      {formatMeta(r)}
                    </Text>
                  ) : null}
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
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.cream,
    ...theme.shadows.soft,
  },
  cardCompact: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
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
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  iconWrapCompact: {
    width: 36,
    height: 36,
    marginBottom: theme.spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  emoji: {
    fontSize: 20,
  },
  emojiCompact: {
    fontSize: 18,
  },
  title: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  titleCompact: {
    ...theme.textVariants.label,
  },
  meta: {
    marginTop: theme.spacing.sm,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  metaCompact: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
}));
