import { Feather } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

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
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt ?? recipe.createdAt,
      })),
    [recipesQuery.data]
  );

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

  const totalItems = recipes.length + notes.length;
  const isEmpty = totalItems <= 1;
  const isTransitional = totalItems >= 2 && totalItems <= 4;
  const isMature = totalItems >= 5;

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
  const collectionsPath =
    root === '(dev)' ? '/(dev)/(tabs)/collections' : '/(auth)/(tabs)/collections';
  const shoppingListPath =
    root === '(dev)' ? '/(dev)/shopping-list' : '/(auth)/shopping-list';

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
          <Text style={styles.sectionSubtitleLarge}>Continue where you left off</Text>

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

          {isMature ? (
            <CollectionCard
              title="Anti-inflammatory"
              meta="6 recipes"
              chips={['🍲 Turmeric Soup', '🫐 Berry Smoothie']}
              onPress={() => {
                // TODO: open collection
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
}));
