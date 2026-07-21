import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/localization';
import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';

type FolderSpotlightRecipe = {
  id: string;
  title: string;
  emoji?: string | null;
  imageUrl?: string | null;
};

type Props = {
  title: string;
  recipes: FolderSpotlightRecipe[];
  onPress?: () => void;
  onPressRecipe?: (id: string) => void;
};

export default function FolderSpotlightCard({ title, recipes, onPress, onPressRecipe }: Props) {
  const { t } = useTranslation()
  if (recipes.length === 0) return null;

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={t('home.cards.openFolderA11y', { title })}
      >
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Feather name="chevron-right" size={22} color={styles.chevron.color} />
      </Pressable>

      <View style={styles.list}>
        {recipes.map((recipe, index) => (
          <Pressable
            key={recipe.id}
            onPress={() => onPressRecipe?.(recipe.id)}
            style={({ pressed }) => [
              styles.recipeRow,
              index < recipes.length - 1 ? styles.recipeRowBorder : null,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('home.cards.openRecipeA11y', { title: recipe.title })}
          >
            <RecipeMedia emoji={recipe.emoji} imageUrl={recipe.imageUrl} />
            <Text style={styles.recipeTitle} numberOfLines={1}>
              {recipe.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function RecipeMedia({ emoji, imageUrl }: Pick<FolderSpotlightRecipe, 'emoji' | 'imageUrl'>) {
  const normalizedImageUrl = useMemo(() => imageUrl?.trim() ?? '', [imageUrl]);
  const [failedImageUrl, setFailedImageUrl] = useState('');
  const imageFailed = failedImageUrl === normalizedImageUrl;

  if (normalizedImageUrl && !imageFailed) {
    return (
      <Image
        source={{ uri: normalizedImageUrl }}
        style={styles.recipeImage}
        contentFit="cover"
        cachePolicy="memory-disk"
        onError={() => setFailedImageUrl(normalizedImageUrl)}
      />
    );
  }

  return <Text style={styles.recipeEmoji}>{emoji ?? '🍽️'}</Text>;
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
  pressed: {
    opacity: 0.7,
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
  recipeImage: {
    width: 24,
    height: 24,
    borderRadius: theme.radii.sm,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.muted,
  },
  recipeTitle: {
    flex: 1,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.foreground,
  },
}));
