import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { router, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import { useAuth } from '@/features/auth/context/AuthContext';
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
import { useRecipeDocumentUsageSummary } from '@/features/recipes/hooks/useRecipeDocuments';
import { useShoppingListStore } from '@/features/shopping-list/store/useShoppingListStore';
import { useStrategyNotesList } from '@/features/notes/hooks/useStrategyNotes';
import { useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes';
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode';
import type { RecipeMealTime } from '@/features/recipes/types/mealTimes'
import {
  FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
  FREE_PLAN_MAX_RECIPES,
} from '@/features/subscription/constants/limits';

import {
  formatRelativeDay,
  getMealTime,
  getRecommendedPick,
  sortMostRecent,
} from '@/features/home/utils/homeFormatters';

type HomeProps = {
  showAccountSuccessBanner?: boolean;
  showRecipeSuccessBanner?: boolean;
  mode?: 'auth' | 'public' | 'dev';
};

type HomeRecipe = {
  id: string;
  title: string;
  subtitle?: string | null;
  emoji?: string | null;
  imageUrl?: string | null;
  folders?: { id: string; name: string; emoji: string }[];
  mealTimes?: RecipeMealTime[];
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  createdAt: string;
  updatedAt?: string;
};

type HomeNote = {
  id: string;
  title: string;
  updatedAt: string;
};

const MIN_FEATURED_COLLECTION_RECIPES = 2;
const STORAGE_INFO_BANNER_DISMISSED_KEY = 'storage_banner_dismissed';
const STORAGE_RISK_BANNER_DISMISSED_EVENT_KEY = 'storage_risk_banner_dismissed_event';
const STORAGE_CONVERSION_BANNER_SEEN_TRIGGERS_KEY = 'storage_conversion_banner_seen_triggers';
const STORAGE_DEVICE_MARKER_CACHE_KEY = 'storage_device_marker_cache';
const SECURE_DEVICE_MARKER_KEY = 'storage_device_marker_secure';
type ConversionBannerTrigger = {
  id: string;
  title: string;
  body: string;
};

function makeStorageDeviceMarker() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseTriggerIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function getConversionBannerTrigger(params: {
  recipesCount: number;
  notesCount: number;
  importsCount: number;
  importsTotalBytes: number;
}): ConversionBannerTrigger | null {
  const { recipesCount, notesCount, importsCount, importsTotalBytes } = params;
  const recipeUsageRatio = recipesCount / FREE_PLAN_MAX_RECIPES;
  const importUsageRatio = importsTotalBytes / FREE_PLAN_MAX_IMPORT_TOTAL_BYTES;
  const totalInvestmentScore = recipesCount + notesCount + importsCount;

  if (recipesCount >= FREE_PLAN_MAX_RECIPES) {
    return {
      id: 'recipes-100',
      title: 'You reached the free recipe limit',
      body: 'Premium keeps everything backed up and removes limits.',
    };
  }

  if (recipeUsageRatio >= 0.8) {
    return {
      id: 'recipes-80-plus',
      title: "You're building a great collection",
      body: "You're close to the free limit. Premium keeps everything backed up and removes limits.",
    };
  }

  if (importUsageRatio >= 0.8) {
    return {
      id: 'imports-80-plus',
      title: "You're building a great collection",
      body: "You're close to the free limit on imports. Premium keeps everything backed up and removes limits.",
    };
  }

  if (totalInvestmentScore >= 40) {
    return {
      id: 'investment-40',
      title: "You're building a great collection",
      body: "You're close to the free limit. Premium keeps everything backed up and removes limits.",
    };
  }

  return null;
}

function getWeekKey(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export default function HomeScreen({
  showAccountSuccessBanner,
  showRecipeSuccessBanner,
  mode,
}: HomeProps) {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl);
  const segments = useSegments();
  const { user } = useAuth();
  const resolvedMode =
    mode ??
    (segments[0] === '(dev)' ? 'dev' : segments[0] === '(public)' ? 'public' : 'auth');
  const isPublic = resolvedMode === 'public';
  const isAuthenticated = Boolean(user);
  const { shouldUseLocalData } = useStorageDataMode(resolvedMode);

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

  const recipesQuery = useStrategyRecipesList({ limit: 50 }, resolvedMode);
  const notesQuery = useStrategyNotesList({ limit: 50 }, resolvedMode);
  const importsUsageQuery = useRecipeDocumentUsageSummary({ enabled: isPublic && !isAuthenticated });

  const hydrateShopping = useShoppingListStore((s) => s.hydrate);
  const isShoppingHydrated = useShoppingListStore((s) => s.isHydrated);
  const isShoppingHydrating = useShoppingListStore((s) => s.isHydrating);
  const shoppingItems = useShoppingListStore((s) => s.items);

  useEffect(() => {
    hydrateShopping();
  }, [hydrateShopping]);

  const recipes = useMemo<HomeRecipe[]>(
    () => {
      const source = recipesQuery.data ?? [];
      return source.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        subtitle: recipe.subtitle ?? null,
        emoji: recipe.emoji ?? null,
        imageUrl: recipe.imageUrl ?? null,
        folders: recipe.folders ?? [],
        mealTimes: recipe.mealTimes ?? [],
        prepTimeMinutes: recipe.prepTimeMinutes ?? null,
        cookTimeMinutes: recipe.cookTimeMinutes ?? null,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt ?? recipe.createdAt,
      }));
    },
    [recipesQuery.data]
  );

  useEffect(() => {
    const imageUrls = recipes
      .map((recipe) => recipe.imageUrl?.trim())
      .filter((url): url is string => Boolean(url))
      .slice(0, 24);
    if (!imageUrls.length) return;
    void ExpoImage.prefetch(imageUrls);
  }, [recipes]);

  const recipeCollections = useMemo(() => {
    const items = buildCollectionsForSegment(
      'recipes',
      (recipesQuery.data ?? []) as any
    );
    return items.filter(
      (item) => item.kind === 'tag' && item.count > 0 && item.label !== 'Uncategorized'
    );
  }, [recipesQuery.data]);

  const featuredCollection = useMemo(() => {
    const eligibleCollections = recipeCollections.filter(
      (collection) => collection.count >= MIN_FEATURED_COLLECTION_RECIPES
    );
    if (eligibleCollections.length === 0) return null;

    const eligibleCollectionsKey = eligibleCollections.map((collection) => collection.key).join('|');
    const weekKey = getWeekKey(new Date());
    let hash = 0;
    const seed = `${weekKey}|${eligibleCollectionsKey}`;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const index = hash % eligibleCollections.length;
    return eligibleCollections[index] ?? null;
  }, [recipeCollections]);

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
    () => {
      const source = notesQuery.data ?? [];
      return source.map((note) => ({
        id: note.id,
        title: note.title?.trim() || 'Untitled note',
        updatedAt: note.updatedAt,
      }));
    },
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
  const [storageBannerDismissed, setStorageBannerDismissed] = useState<boolean | null>(null);
  const [riskBannerEventId, setRiskBannerEventId] = useState<string | null>(null);
  const [seenConversionTriggerIds, setSeenConversionTriggerIds] = useState<string[] | null>(null);
  const [activeConversionTriggerId, setActiveConversionTriggerId] = useState<string | null>(null);
  const [storageBannerStateReady, setStorageBannerStateReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadStorageBannerState = async () => {
      try {
        const [infoDismissedRaw, riskDismissedEventRaw, seenTriggersRaw, markerCacheRaw] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_INFO_BANNER_DISMISSED_KEY),
            AsyncStorage.getItem(STORAGE_RISK_BANNER_DISMISSED_EVENT_KEY),
            AsyncStorage.getItem(STORAGE_CONVERSION_BANNER_SEEN_TRIGGERS_KEY),
            AsyncStorage.getItem(STORAGE_DEVICE_MARKER_CACHE_KEY),
          ]);

        if (!isMounted) return;

        setStorageBannerDismissed(infoDismissedRaw === 'true');
        setSeenConversionTriggerIds(parseTriggerIds(seenTriggersRaw));

        if (Platform.OS === 'web') {
          setRiskBannerEventId(null);
          setStorageBannerStateReady(true);
          return;
        }

        let secureMarker = await SecureStore.getItemAsync(SECURE_DEVICE_MARKER_KEY);
        if (!secureMarker) {
          secureMarker = makeStorageDeviceMarker();
          await SecureStore.setItemAsync(SECURE_DEVICE_MARKER_KEY, secureMarker);
          await AsyncStorage.setItem(STORAGE_DEVICE_MARKER_CACHE_KEY, secureMarker);
          if (!isMounted) return;
          setRiskBannerEventId(null);
          setStorageBannerStateReady(true);
          return;
        }

        const detectedRiskMoment = !markerCacheRaw || markerCacheRaw !== secureMarker;
        await AsyncStorage.setItem(STORAGE_DEVICE_MARKER_CACHE_KEY, secureMarker);

        if (!isMounted) return;
        const wasRiskEventDismissed = riskDismissedEventRaw === secureMarker;
        setRiskBannerEventId(detectedRiskMoment && !wasRiskEventDismissed ? secureMarker : null);
        setStorageBannerStateReady(true);
      } catch {
        if (!isMounted) return;
        setStorageBannerDismissed(false);
        setRiskBannerEventId(null);
        setSeenConversionTriggerIds([]);
        setStorageBannerStateReady(true);
      }
    };
    void loadStorageBannerState();
    return () => {
      isMounted = false;
    };
  }, []);

  const isInitialLoading =
    !shouldUseLocalData &&
    (recipesQuery.isLoading || notesQuery.isLoading) &&
    !recipesQuery.data &&
    !notesQuery.data;

  const emptyStateTitle = isPublic ? 'Start your recipe collection' : 'Your recipe space is ready.';
  const emptyStateBody = isPublic
    ? 'Add a recipe or a note. Everything stays on this device while you use the free local plan.'
    : 'Add a recipe or a note. Home will show recent activity and quick access once you do.';

  const handlePrimaryCta = () => {
    router.push(
      resolvedMode === 'public'
        ? '/(public)/create'
        : resolvedMode === 'dev'
          ? '/(dev)/create'
          : '/(auth)/create'
    );
  };

  const handleSecondaryCta = () => {
    router.push(
      resolvedMode === 'public'
        ? '/(public)/notes/create'
        : resolvedMode === 'dev'
          ? '/(dev)/notes/create'
          : '/(auth)/notes/create'
    );
  };

  const totalItems = recipes.length + notes.length;
  const isEmpty = totalItems === 0;
  const importsCount = importsUsageQuery.data?.totalCount ?? 0;
  const importsTotalBytes = importsUsageQuery.data?.totalBytes ?? 0;
  const hasUserGeneratedContent = recipes.length > 0 || notes.length > 0 || importsCount > 0;
  const conversionTrigger = useMemo(
    () =>
      getConversionBannerTrigger({
        recipesCount: recipes.length,
        notesCount: notes.length,
        importsCount,
        importsTotalBytes,
      }),
    [importsCount, importsTotalBytes, notes.length, recipes.length]
  );

  const showRiskBanner =
    isPublic && !isAuthenticated && storageBannerStateReady && Boolean(riskBannerEventId);
  const showConversionBanner =
    isPublic &&
    !isAuthenticated &&
    storageBannerStateReady &&
    !showRiskBanner &&
    Boolean(conversionTrigger) &&
    conversionTrigger?.id === activeConversionTriggerId;
  const shouldShowStorageInfoBanner =
    isPublic &&
    !isAuthenticated &&
    storageBannerStateReady &&
    !showRiskBanner &&
    !showConversionBanner &&
    hasUserGeneratedContent &&
    storageBannerDismissed === false;

  const dismissStorageInfoBanner = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_INFO_BANNER_DISMISSED_KEY, 'true');
    } finally {
      setStorageBannerDismissed(true);
    }
  };

  const dismissRiskBanner = async () => {
    if (!riskBannerEventId) return;
    try {
      await AsyncStorage.setItem(STORAGE_RISK_BANNER_DISMISSED_EVENT_KEY, riskBannerEventId);
    } finally {
      setRiskBannerEventId(null);
    }
  };

  const dismissConversionBanner = () => {
    setActiveConversionTriggerId(null);
  };

  useEffect(() => {
    if (!isPublic || isAuthenticated) return;
    if (!conversionTrigger) return;
    if (!seenConversionTriggerIds) return;
    if (seenConversionTriggerIds.includes(conversionTrigger.id)) return;

    const next = [...seenConversionTriggerIds, conversionTrigger.id];
    setSeenConversionTriggerIds(next);
    setActiveConversionTriggerId(conversionTrigger.id);
    AsyncStorage.setItem(STORAGE_CONVERSION_BANNER_SEEN_TRIGGERS_KEY, JSON.stringify(next)).catch(
      () => {
        // ignore persistence errors; we still keep in-memory state for this session
      }
    );
  }, [conversionTrigger, isAuthenticated, isPublic, seenConversionTriggerIds]);

  const isTransitional = totalItems >= 1 && totalItems <= 4;

  const shoppingListVisible = (shoppingList?.totalCount ?? 0) > 0;
  const activeShoppingList = shoppingListVisible ? shoppingList : null;
  const recipeCount = recipes.length;
  const isVeryFewRecipes = recipeCount < 5;
  const isMediumRecipeLibrary = recipeCount >= 5 && recipeCount < 20;
  const isLargeRecipeLibrary = recipeCount >= 20;

  const weeklyDinnerIdeas = useMemo(() => {
    if (!isLargeRecipeLibrary) return [];
    const sortedByLeastRecent = [...recipes].sort((a, b) => {
      const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
      return aTime - bTime;
    });
    if (sortedByLeastRecent.length === 0) return [];

    const weekKey = getWeekKey(new Date());
    let hash = 0;
    const seed = `${weekKey}|${sortedByLeastRecent.map((recipe) => recipe.id).join('|')}`;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }

    const startIndex = hash % sortedByLeastRecent.length;
    const count = Math.min(2, sortedByLeastRecent.length);
    const picks: HomeRecipe[] = [];
    for (let i = 0; i < count; i += 1) {
      picks.push(sortedByLeastRecent[(startIndex + i) % sortedByLeastRecent.length]);
    }
    return picks;
  }, [isLargeRecipeLibrary, recipes]);

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

    return getRecommendedPick(recipes, new Date());
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

  const formatRecipeDuration = (recipe: HomeRecipe) => {
    const prep = recipe.prepTimeMinutes ?? 0;
    const cook = recipe.cookTimeMinutes ?? 0;
    const total = prep + cook;
    if (total > 0) return `${total} min`;
    return 'Quick recipe';
  };

  const root =
    resolvedMode === 'dev' ? '(dev)' : resolvedMode === 'public' ? '(public)' : '(auth)';
  const recipeDetailPath =
    root === '(dev)'
      ? '/(dev)/recipes/[id]'
      : root === '(public)'
        ? '/(public)/recipes/[id]'
        : '/(auth)/recipes/[id]';
  const noteDetailPath =
    root === '(dev)'
      ? '/(dev)/notes/[id]'
      : root === '(public)'
        ? '/(public)/notes/[id]'
        : '/(auth)/notes/[id]';
  const collectionDetailPath =
    root === '(dev)' ? '/(dev)/collections/[key]' : '/(auth)/collections/[key]';
  const collectionsPath =
    root === '(dev)'
      ? '/(dev)/(tabs)/collections'
      : root === '(public)'
        ? '/(public)/(tabs)/collections'
        : '/(auth)/(tabs)/collections';
  const shoppingListPath =
    root === '(dev)'
      ? '/(dev)/shopping-list'
      : root === '(public)'
        ? '/(public)/shopping-list'
        : '/(auth)/shopping-list';

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
      {showAccountSuccessBanner && !bannerDismissed && !isPublic ? (
        <SuccessBanner
          text="You&apos;re all set! Your recipes are safe."
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}
      {showRecipeSuccessBanner && !bannerDismissed ? (
        <SuccessBanner
          text="Recipe saved! Create an account to sync it everywhere."
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}

      <HomeHeader
        greeting={greeting}
        title={
          <>
            What&apos;s cooking? <Text style={styles.wave}>👋</Text>
          </>
        }
        onPressAdd={() =>
          router.push(isPublic ? '/(public)/recipes/create' : '/create')
        }
      />

      {isEmpty ? (
        <EmptyHomeCard
          title={emptyStateTitle}
          body={emptyStateBody}
          primaryLabel="Add your first recipe"
          secondaryLabel="Create a note"
          onPressPrimary={handlePrimaryCta}
          onPressSecondary={handleSecondaryCta}
        />
      ) : null}

      {showRiskBanner ? (
        <View style={styles.contextBannerCard}>
          <View style={styles.contextBannerHeaderRow}>
            <View style={styles.contextBannerTitleRow}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color={styles.contextBannerInfoIcon.color}
              />
              <Text style={styles.contextBannerTitle}>Storage update</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss storage risk banner"
              hitSlop={8}
              onPress={() => {
                void dismissRiskBanner();
              }}
            >
              <Feather name="x" size={18} color={styles.contextBannerCloseIcon.color} />
            </Pressable>
          </View>
          <Text style={styles.contextBannerBody}>
            This device doesn&apos;t have your previous data. Premium keeps everything backed up
            across devices.
          </Text>
          <View style={styles.contextBannerActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Learn about Premium"
              onPress={() => {
                dismissConversionBanner();
                void dismissRiskBanner();
                router.push('/(public)/premium');
              }}
              style={({ pressed }) => [styles.contextPrimaryAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.contextPrimaryActionText}>Learn about Premium</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Not now"
              onPress={() => {
                void dismissRiskBanner();
              }}
              style={({ pressed }) => [styles.contextSecondaryAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.contextSecondaryActionText}>Not now</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {showConversionBanner && conversionTrigger ? (
        <View style={styles.contextBannerCard}>
          <View style={styles.contextBannerHeaderRow}>
            <View style={styles.contextBannerTitleRow}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={styles.contextBannerInfoIcon.color}
              />
              <Text style={styles.contextBannerTitle}>{conversionTrigger.title}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss premium suggestion banner"
              hitSlop={8}
              onPress={dismissConversionBanner}
            >
              <Feather name="x" size={18} color={styles.contextBannerCloseIcon.color} />
            </Pressable>
          </View>
          <Text style={styles.contextBannerBody}>{conversionTrigger.body}</Text>
          <View style={styles.contextBannerActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Learn about Premium"
              onPress={() => {
                dismissConversionBanner();
                router.push('/(public)/premium');
              }}
              style={({ pressed }) => [styles.contextPrimaryAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.contextPrimaryActionText}>Learn about Premium</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Not now"
              onPress={dismissConversionBanner}
              style={({ pressed }) => [styles.contextSecondaryAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.contextSecondaryActionText}>Not now</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {shouldShowStorageInfoBanner ? (
        <View style={styles.localOnlyCard}>
          <View style={styles.localOnlyHeaderRow}>
            <View style={styles.localOnlyTitleRow}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={styles.localOnlyInfoIcon.color}
              />
              <Text style={styles.localOnlyTitle}>Local-only for now</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss storage info banner"
              hitSlop={8}
              onPress={() => {
                void dismissStorageInfoBanner();
              }}
            >
              <Feather name="x" size={18} color={styles.localOnlyCloseIcon.color} />
            </Pressable>
          </View>
          <Text style={styles.localOnlyBody}>
            Everything stays on this device.{'\n'}
            You can{' '}
            <Text
              style={styles.localOnlyLink}
              onPress={() => {
                router.push('/(public)/register');
              }}
            >
              Create an account
            </Text>{' '}
            anytime. Cloud backup is available with{' '}
            <Text
              style={styles.localOnlyPremiumLink}
              onPress={() => {
                router.push('/(public)/premium');
              }}
            >
              Premium
            </Text>
            .
          </Text>
          <View style={styles.localOnlyFooterRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss storage info banner"
              onPress={() => {
                void dismissStorageInfoBanner();
              }}
              style={({ pressed }) => [styles.gotItButton, pressed && styles.gotItButtonPressed]}
            >
              <Text style={styles.gotItButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
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
            ctaLabel={isPublic ? undefined : 'See all'}
            onPressCta={isPublic ? undefined : () => router.push(collectionsPath)}
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
          <Text style={styles.sectionSubtitleLarge}>This Week</Text>

          {activeShoppingList ? (
            <ActionCard
              title="Shopping List"
              meta={`${activeShoppingList.checkedCount}/${activeShoppingList.totalCount} items checked`}
              variant="shoppingActive"
              leftIcon={<Feather name="shopping-cart" size={24} color={theme.colors.primary} />}
              onPress={() => {
                router.push(shoppingListPath);
              }}
            />
          ) : (
            <ActionCard
              title="Start a shopping list"
              meta="Keep track of ingredients"
              variant="shoppingEmpty"
              leftIcon={<Feather name="plus" size={28} color={theme.colors.primary} />}
              onPress={() => {
                router.push(shoppingListPath);
              }}
            />
          )}

          {isVeryFewRecipes ? (
            <ActionCard
              title="Add your first staples"
              meta="Save 3-5 recipes you cook often"
              variant="nextAction"
              leftIcon={<Ionicons name="star" size={22} color="#F49D0C" />}
              onPress={handlePrimaryCta}
            />
          ) : null}

          {isMediumRecipeLibrary ? (
            <ActionCard
              title="What's cooking this week?"
              meta="Pick a recipe and add ingredients to your list"
              variant="nextAction"
              leftIcon={<Text style={styles.actionEmoji}>🍽️</Text>}
              onPress={() => {
                router.push(collectionsPath);
              }}
            />
          ) : null}

          {isLargeRecipeLibrary ? (
            <View style={styles.ideasSection}>
              <Text style={styles.ideasTitle}>Ideas for this week</Text>
              <Text style={styles.ideasMeta}>A couple of recipes to keep in mind</Text>

              <View style={styles.ideasRow}>
                {weeklyDinnerIdeas.slice(0, 2).map((recipe) => (
                  <View key={recipe.id} style={styles.ideaCardWrap}>
                    <ActionCard
                      title={recipe.title}
                      meta={formatRecipeDuration(recipe)}
                      noTopMargin
                      leftIcon={<Text style={styles.actionEmoji}>{recipe.emoji ?? '🍽️'}</Text>}
                      onPress={() => {
                        router.push({ pathname: recipeDetailPath, params: { id: recipe.id } });
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {!isPublic && featuredCollection && featuredCollectionChips.length > 0 ? (
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
  ideasSection: {
    gap: theme.spacing.sm,
  },
  ideasTitle: {
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.foreground,
  },
  ideasMeta: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  ideasRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  ideaCardWrap: {
    flex: 1,
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
  contextBannerCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.sm,
  },
  contextBannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  contextBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexShrink: 1,
  },
  contextBannerInfoIcon: {
    color: theme.colors.mutedForeground,
  },
  contextBannerCloseIcon: {
    color: theme.colors.mutedForeground,
  },
  contextBannerTitle: {
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.foreground,
    flexShrink: 1,
  },
  contextBannerBody: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  contextBannerActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  contextPrimaryAction: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  contextPrimaryActionText: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
    textDecorationLine: 'underline',
  },
  contextSecondaryAction: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  contextSecondaryActionText: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  actionPressed: {
    opacity: 0.85,
  },
  localOnlyCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  localOnlyTitle: {
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.foreground,
  },
  localOnlyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  localOnlyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexShrink: 1,
  },
  localOnlyInfoIcon: {
    color: theme.colors.mutedForeground,
  },
  localOnlyCloseIcon: {
    color: theme.colors.mutedForeground,
  },
  localOnlyBody: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  localOnlyLink: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.foreground,
    textDecorationLine: 'underline',
  },
  localOnlyPremiumLink: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.semibold,
    color: theme.colors.foreground,
    textDecorationLine: 'underline',
  },
  localOnlyFooterRow: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  gotItButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  gotItButtonPressed: {
    opacity: 0.85,
  },
  gotItButtonText: {
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
  },
}));
