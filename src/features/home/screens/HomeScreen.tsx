import { Feather } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import { buildCollectionsForSegment } from '@/features/collections/utils/collections';
import ActionCard from '@/features/home/components/ActionCard';
import CollectionCard from '@/features/home/components/CollectionCard';
import EmptyHomeCard from '@/features/home/components/EmptyHomeCard';
import HomeHeader from '@/features/home/components/HomeHeader';
import NotesStrip from '@/features/home/components/NotesStrip';
import PickCard from '@/features/home/components/PickCard';
import RecipeCarousel, { type RecipePreview } from '@/features/home/components/RecipeCarousel';
import SectionHeaderRow from '@/features/home/components/SectionHeaderRow';
import SuccessBanner from '@/features/home/components/SuccessBanner';
import { useNotesList } from '@/features/notes/hooks/useNotesList';
import { useRecipesList } from '@/features/recipes/hooks/useRecipesList';
import { useShoppingListStore } from '@/features/shopping-list/store/useShoppingListStore';

import {
  formatRelativeDay,
  getMealTime,
  getPickLabel,
  sortMostRecent,
} from '@/features/home/utils/homeFormatters';

type HomeProps = {
  showAccountSuccessBanner?: boolean;
};

type HomeRecipe = {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji?: string | null;
  imageUrl?: string | null;
  folders?: { id: string; name: string; emoji: string }[];
  mealTimes?: string[];
  createdAt: string;
  updatedAt?: string;
};

type HomeNote = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function HomeScreen({ showAccountSuccessBanner }: HomeProps) {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl);
  const segments = useSegments();

  const { width: screenWidth } = useWindowDimensions();

  // Horizontal carousel sizing
  const PAGE_PADDING = theme.spacing.lg; // Screen default
  const CARD_GAP = theme.spacing.md;
  const PEEK = 16;

  const MIN_CARD_WIDTH = 180;
  const MAX_CARD_WIDTH = 200;

  const recipeCardWidth = useMemo(() => {
    const availableWidth = screenWidth - 2 * PAGE_PADDING;
    const ideal = availableWidth - CARD_GAP - PEEK;
    const clamped = Math.min(Math.max(ideal, MIN_CARD_WIDTH), MAX_CARD_WIDTH);
    return Math.floor(clamped);
  }, [screenWidth, PAGE_PADDING, CARD_GAP]);

  const getWeekKey = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  };

  const recipesQuery = useRecipesList({ limit: 50 });
  const notesQuery = useNotesList({ limit: 50 });

  const hydrateShopping = useShoppingListStore((s) => s.hydrate);
  const isShoppingHydrated = useShoppingListStore((s) => s.isHydrated);
  const isShoppingHydrating = useShoppingListStore((s) => s.isHydrating);
  const shoppingItems = useShoppingListStore((s) => s.items);

  useEffect(() => {
    hydrateShopping();
  }, [hydrateShopping]);

  const recipes = useMemo<HomeRecipe[]>(
    () =>
      (recipesQuery.data ?? []).map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        subtitle: recipe.subtitle ?? null,
        emoji: recipe.emoji ?? null,
        imageUrl: recipe.imageUrl ?? null,
        folders: recipe.folders ?? [],
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt ?? recipe.createdAt,
      })),
    [recipesQuery.data]
  );

  const recipeCollections = useMemo(() => {
    const items = buildCollectionsForSegment('recipes', recipesQuery.data ?? []);
    return items.filter(
      (item) => item.kind === 'tag' && item.count > 0 && item.label !== 'Uncategorized'
    );
  }, [recipesQuery.data]);

  const recipeCollectionsKey = useMemo(
    () => recipeCollections.map((item) => item.key).join('|'),
    [recipeCollections]
  );

  const featuredCollection = useMemo(() => {
    if (recipeCollections.length === 0) return null;
    const weekKey = getWeekKey(new Date());
    let hash = 0;
    const seed = `${weekKey}|${recipeCollectionsKey}`;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const index = hash % recipeCollections.length;
    return recipeCollections[index] ?? null;
  }, [recipeCollectionsKey]);

  const featuredCollectionRecipes = useMemo(() => {
    if (!featuredCollection) return [];
    const list = recipesQuery.data ?? [];

    if (featuredCollection.label === 'Uncategorized') {
      return list.filter((recipe) => (recipe.folders?.length ?? 0) === 0);
    }

    return list.filter((recipe) =>
      (recipe.folders ?? []).map((folder) => folder.name.trim()).includes(featuredCollection.label)
    );
  }, [featuredCollection, recipesQuery.data]);

  const featuredCollectionChips = useMemo(() => {
    const chips = featuredCollectionRecipes.slice(0, 2).map((recipe) => {
      if (recipe.emoji) return `${recipe.emoji} ${recipe.title}`;
      return recipe.title;
    });
    const remainingCount = featuredCollectionRecipes.length - chips.length;
    if (remainingCount > 0) {
      chips.push(`+${remainingCount} more`);
    }
    return chips;
  }, [featuredCollectionRecipes]);

  const notes = useMemo<HomeNote[]>(
    () =>
      (notesQuery.data ?? []).map((note) => ({
        id: note.id,
        title: note.title?.trim() || 'Untitled note',
        updatedAt: note.updatedAt,
      })),
    [notesQuery.data]
  );

  const shoppingList = useMemo(() => {
    if (!isShoppingHydrated || isShoppingHydrating) return null;
    const totalCount = shoppingItems.length;
    if (totalCount === 0) return null;
    const checkedCount = shoppingItems.reduce((acc, item) => acc + (item.checked ? 1 : 0), 0);
    return { totalCount, checkedCount };
  }, [isShoppingHydrated, isShoppingHydrating, shoppingItems]);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isInitialLoading =
    (recipesQuery.isLoading || notesQuery.isLoading) &&
    !recipesQuery.data &&
    !notesQuery.data;

  const totalItems = recipes.length + notes.length;
  const isEmpty = totalItems <= 1;
  const isTransitional = totalItems >= 2 && totalItems <= 4;

  const shoppingListVisible = (shoppingList?.totalCount ?? 0) > 0;
  const activeShoppingList = shoppingListVisible ? shoppingList : null;

  const dinnerTonightVisible = !shoppingListVisible && !isEmpty;

  const greeting = useMemo(() => {
    const meal = getMealTime(new Date());
    if (meal === 'breakfast') return 'Good morning';
    if (meal === 'lunch') return 'Good afternoon';
    if (meal === 'snack') return 'Good afternoon';
    return 'Good evening';
  }, []);

  const pick = useMemo(() => {
    const PICK_MIN_RECIPES = 5;
    if (isEmpty) return null;
    if (recipes.length < PICK_MIN_RECIPES) return null;

    const meal = getMealTime(new Date());
    const candidates = recipes.filter((r) => (r.mealTimes ?? []).includes(meal));
    const pool = candidates.length ? candidates : recipes;
    const recipe = sortMostRecent(pool)[0] ?? null;

    return recipe
      ? {
          label: getPickLabel(meal),
          recipe,
        }
      : null;
  }, [isEmpty, recipes]);

  const recentRecipes = useMemo(() => {
    const sliceCount = isTransitional ? 2 : 6;
    return sortMostRecent(recipes).slice(0, sliceCount);
  }, [recipes, isTransitional]);

  const recentRecipeCards = useMemo<RecipePreview[]>(
    () =>
      recentRecipes.map((r) => ({
        id: r.id,
        title: r.title,
        emoji: r.emoji ?? undefined,
        imageUrl: r.imageUrl ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    [recentRecipes]
  );

  const firstRecentNote = useMemo(() => sortMostRecent(notes)[0], [notes]);

  const root = segments[0] === '(dev)' ? '(dev)' : '(auth)';
  const recipeDetailPath =
    root === '(dev)' ? '/(dev)/recipes/[id]' : '/(auth)/recipes/[id]';
  const noteDetailPath = root === '(dev)' ? '/(dev)/notes/[id]' : '/(auth)/notes/[id]';
  const collectionDetailPath =
    root === '(dev)' ? '/(dev)/collections/[key]' : '/(auth)/collections/[key]';
  const collectionsPath =
    root === '(dev)' ? '/(dev)/(tabs)/collections' : '/(auth)/(tabs)/collections';
  const shoppingListPath =
    root === '(dev)' ? '/(dev)/shopping-list' : '/(auth)/shopping-list';

  if (isInitialLoading) {
    return (
      <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading your recipes…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      {showAccountSuccessBanner && !bannerDismissed ? (
        <SuccessBanner
          text="You're all set! Your recipes are safe."
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}

      <HomeHeader
        greeting={greeting}
        title={
          <>
            What's cooking? <Text style={styles.wave}>👋</Text>
          </>
        }
        onPressAdd={() => router.push('/create')}
      />

      {isEmpty ? (
        <EmptyHomeCard
          title="Your recipe space is ready."
          body="Add a recipe or a note. Home will show recent activity and quick access once you do."
          primaryLabel="Add your first recipe"
          secondaryLabel="Create a note"
          onPressPrimary={() => router.push('/create')}
          onPressSecondary={() => router.push(collectionsPath)}
        />
      ) : null}

      {pick ? (
        <PickCard
          label={pick.label}
          title={pick.recipe.title}
          subtitle={pick.recipe.subtitle ?? undefined}
          emoji={pick.recipe.emoji ?? undefined}
          imageUrl={pick.recipe.imageUrl ?? undefined}
          onPress={() => {
            router.push({ pathname: recipeDetailPath, params: { id: pick.recipe.id } });
          }}
        />
      ) : null}

      {!isEmpty ? (
        <View style={styles.section}>
          <SectionHeaderRow
            title="Recent Activity"
            subtitle="Recently added recipes"
            ctaLabel="See all"
            onPressCta={() => router.push(collectionsPath)}
          />

          {recentRecipeCards.length > 0 ? (
            <RecipeCarousel
              items={recentRecipeCards}
              cardWidth={recipeCardWidth}
              gap={CARD_GAP}
              rightPadding={theme.spacing.lg}
              formatMeta={(r) => formatRelativeDay(r.createdAt ?? r.updatedAt)}
              onPressItem={(id) => {
                router.push({ pathname: recipeDetailPath, params: { id } });
              }}
            />
          ) : (
            <View style={styles.mutedRow}>
              <Text style={styles.mutedRowText}>No recipes yet.</Text>
            </View>
          )}
        </View>
      ) : null}

      {!isEmpty && firstRecentNote ? (
        <NotesStrip
          title="Recently edited notes"
          note={{ title: firstRecentNote.title, updatedAt: firstRecentNote.updatedAt }}
          meta={formatRelativeDay(firstRecentNote.updatedAt)}
          onPress={() => {
            router.push({ pathname: noteDetailPath, params: { id: firstRecentNote.id } });
          }}
        />
      ) : null}

      {!isEmpty ? (
        <View style={styles.section}>
          <Text style={styles.sectionSubtitleLarge}>This week</Text>

          {activeShoppingList ? (
            <ActionCard
              title="Shopping List"
              meta={`${activeShoppingList.checkedCount}/${activeShoppingList.totalCount} items checked`}
              variant="highlight"
              leftIcon={<Feather name="shopping-cart" size={18} color={theme.colors.mutedForeground} />}
              onPress={() => {
                router.push(shoppingListPath);
              }}
            />
          ) : null}

          {dinnerTonightVisible ? (
            <ActionCard
              title="Dinner tonight"
              meta="Get inspired"
              leftIcon={<Feather name="star" size={18} color={theme.colors.mutedForeground} />}
              onPress={() => {
                // TODO: open dinner tonight
              }}
            />
          ) : null}

          {featuredCollection && featuredCollectionChips.length > 0 ? (
            <CollectionCard
              title={featuredCollection.label}
              meta={`${featuredCollection.count} recipe${
                featuredCollection.count === 1 ? '' : 's'
              }`}
              chips={featuredCollectionChips}
              onPress={() => {
                const collectionKey =
                  featuredCollection.label === 'Uncategorized'
                    ? 'uncategorized'
                    : encodeURIComponent(featuredCollection.label);
                router.push({
                  pathname: collectionDetailPath,
                  params: { key: collectionKey },
                });
              }}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = createThemedStyles((theme) => ({
  content: {
    paddingTop: theme.spacing.xl,
    gap: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionSubtitleLarge: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  mutedRow: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.muted,
  },
  mutedRowText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  wave: {
    fontSize: theme.fontSize.hero,
  },
  actionEmoji: {
    fontSize: 20,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.mutedForeground,
  },
}));
