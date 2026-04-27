import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';

type FolderSpotlightRecipe = {
  id: string;
  title: string;
  emoji?: string | null;
};

type Props = {
  title: string;
  recipes: FolderSpotlightRecipe[];
  onPress?: () => void;
};

export default function FolderSpotlightCard({ title, recipes, onPress }: Props) {
  if (recipes.length === 0) return null;

  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button">
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Feather name="chevron-right" size={22} color={styles.chevron.color} />
      </View>

      <View style={styles.list}>
        {recipes.map((recipe, index) => (
          <View
            key={recipe.id}
            style={[styles.recipeRow, index < recipes.length - 1 ? styles.recipeRowBorder : null]}
          >
            <Text style={styles.recipeEmoji}>{recipe.emoji ?? '🍽️'}</Text>
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: layout.cardPadding,
    paddingVertical: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
  },
  chevron: {
    color: theme.colors.mutedForeground,
  },
  list: {
    marginTop: theme.spacing.xs,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    minHeight: 56,
  },
  recipeRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  recipeEmoji: {
    width: 24,
    textAlign: 'center',
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
  },
  recipeTitle: {
    flex: 1,
    fontSize: theme.fontSize['2xl'],
    lineHeight: theme.lineHeight['2xl'],
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.foreground,
  },
}));
