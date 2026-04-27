import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { router, useFocusEffect, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';
import { theme } from '@/styles/theme';

import { useAuth } from '@/features/auth/context/AuthContext';
import { buildCollectionsForSegment } from '@/features/collections/utils/collections';
import ActionCard from '@/features/home/components/ActionCard';
import EmptyHomeCard from '@/features/home/components/EmptyHomeCard';
import FolderSpotlightCard from '@/features/home/components/FolderSpotlightCard';
import HomeHeader from '@/features/home/components/HomeHeader';
import PickCard from '@/features/home/components/PickCard';
import RecipeCarousel, { type RecipePreview } from '@/features/home/components/RecipeCarousel';
import SectionHeaderRow from '@/features/home/components/SectionHeaderRow';
import SuccessBanner from '@/features/home/components/SuccessBanner';
import { useStrategyNotesList } from '@/features/notes/hooks/useStrategyNotes';
import { useRecipeDocumentUsageSummary } from '@/features/recipes/hooks/useRecipeDocuments';
import { useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes';
import type { RecipeMealTime } from '@/features/recipes/types/mealTimes';
import { useShoppingListStore } from '@/features/shopping-list/store/useShoppingListStore';
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode';
import {
  FREE_PLAN_MAX_IMPORT_TOTAL_BYTES,
  FREE_PLAN_MAX_RECIPES,
} from '@/features/subscription/constants/limits';
import {
  loadRecipeOpenHistory,
  type RecipeOpenHistory,
} from '@/features/home/utils/recipeOpenHistory';

import {
  getEmptyHomeMocks,
  getMediumHomeMocks,
  getMatureHomeMocks,
  getTransitionalHomeMocks,
} from '@/__mocks__/home';
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
  devScenario?: 'empty' | 'few' | 'medium' | 'many';
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

function hashSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getSeededRecipeOrder<T extends { id: string }>(items: T[], seed: string) {
  return [...items].sort((a, b) => {
    const aRank = hashSeed(`${seed}|${a.id}`);
    const bRank = hashSeed(`${seed}|${b.id}`);
    if (aRank !== bRank) return aRank - bRank;
    return a.id.localeCompare(b.id);
  });
}

function getRecipePreferenceTags(recipe: HomeRecipe) {
  const tags = new Set<string>();

  for (const mealTime of recipe.mealTimes ?? []) {
    tags.add(`meal:${mealTime}`);
  }

  for (const folder of recipe.folders ?? []) {
    const normalized = folder.name.trim().toLowerCase();
    if (normalized) tags.add(`folder:${normalized}`);
  }

  const totalMinutes = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  if (totalMinutes > 0 && totalMinutes <= 30) {
    tags.add('trait:quick');
  }

  return [...tags];
}

function buildWeeklyIdeaRecipes(
  recipes: HomeRecipe[],
  recipeOpenHistory: RecipeOpenHistory,
  now: Date
) {
  if (recipes.length === 0) return [];

  const weekKey = getWeekKey(now);
  const seededRecipes = getSeededRecipeOrder(recipes, `${weekKey}|ideas`);
  const sortedHistory = Object.entries(recipeOpenHistory)
    .sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return b[1].lastOpenedAt - a[1].lastOpenedAt;
    })
    .filter(([recipeId]) => recipes.some((recipe) => recipe.id === recipeId));

  const frequentlyOpenedIds = new Set(sortedHistory.slice(0, 3).map(([recipeId]) => recipeId));
  const tagScores = new Map<string, number>();

  for (const [recipeId, entry] of sortedHistory) {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) continue;

    for (const tag of getRecipePreferenceTags(recipe)) {
      tagScores.set(tag, (tagScores.get(tag) ?? 0) + entry.count);
    }
  }

  const preferredTags = [...tagScores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);

  const selected: HomeRecipe[] = [];
  const selectedIds = new Set<string>();

  for (const tag of preferredTags) {
    const match = seededRecipes.find((recipe) => {
      if (selectedIds.has(recipe.id) || frequentlyOpenedIds.has(recipe.id)) return false;
      return getRecipePreferenceTags(recipe).includes(tag);
    });

    if (!match) continue;
    selected.push(match);
    selectedIds.add(match.id);
    if (selected.length === 3) break;
  }

  if (selected.length < 3) {
    for (const recipe of seededRecipes) {
      if (selectedIds.has(recipe.id) || frequentlyOpenedIds.has(recipe.id)) continue;
      selected.push(recipe);
      selectedIds.add(recipe.id);
      if (selected.length === 3) break;
    }
  }

  const selectedTagSet = new Set(selected.flatMap((recipe) => getRecipePreferenceTags(recipe)));
  const remaining = seededRecipes.filter((recipe) => !selectedIds.has(recipe.id));

  for (const recipe of remaining) {
    const tags = getRecipePreferenceTags(recipe);
    const addsVariety = tags.some((tag) => !selectedTagSet.has(tag));
    if (!addsVariety) continue;
    selected.push(recipe);
    selectedIds.add(recipe.id);
    for (const tag of tags) selectedTagSet.add(tag);
    if (selected.length === 5) break;
  }

  if (selected.length < 5) {
    for (const recipe of remaining) {
      if (selectedIds.has(recipe.id)) continue;
      selected.push(recipe);
      selectedIds.add(recipe.id);
      if (selected.length === 5) break;
    }
  }

  return selected.slice(0, 5);
}

export default function HomeScreen({
  showAccountSuccessBanner,
  showRecipeSuccessBanner,
  mode,
  devScenario,
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
  const PAGE_PADDING = layout.screenPadding;
  const CARD_GAP = layout.cardGap;
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

  const mockedHomeData = useMemo(() => {
    if (resolvedMode !== 'dev' || !devScenario) return null;
    if (devScenario === 'empty') return getEmptyHomeMocks();
    if (devScenario === 'few') return getTransitionalHomeMocks();
    if (devScenario === 'medium') return getMediumHomeMocks();
    return getMatureHomeMocks();
  }, [devScenario, resolvedMode]);

  const visibleRecipes = useMemo<HomeRecipe[]>(
    () => {
      if (!mockedHomeData) return recipes;
      return mockedHomeData.recipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        subtitle: recipe.subtitle ?? null,
        emoji: recipe.emoji ?? null,
        imageUrl: null,
        folders: recipe.folders ?? [],
        mealTimes: recipe.mealTimes ?? [],
        prepTimeMinutes: null,
        cookTimeMinutes: null,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt ?? recipe.createdAt,
      }));
    },
    [mockedHomeData, recipes]
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
      visibleRecipes as any
    );
    return items.filter(
      (item) => item.kind === 'tag' && item.count > 0 && item.label !== 'Uncategorized'
    );
  }, [visibleRecipes]);

  const featuredCollection = useMemo(() => {
    const eligibleCollections = recipeCollections.filter(
      (collection) => collection.count >= MIN_FEATURED_COLLECTION_RECIPES
    );
    if (eligibleCollections.length === 0) return null;

    const eligibleCollectionsKey = eligibleCollections.map((collection) => collection.key).join('|');
    const weekKey = getWeekKey(new Date());
    const seed = `${weekKey}|${eligibleCollectionsKey}`;
    const hash = hashSeed(seed);
    const index = hash % eligibleCollections.length;
    return eligibleCollections[index] ?? null;
  }, [recipeCollections]);

  const featuredCollectionRecipes = useMemo(() => {
    if (!featuredCollection) return [];
    const list = visibleRecipes;

    if (featuredCollection.label === 'Uncategorized') {
      return list.filter((recipe) => (recipe.folders?.length ?? 0) === 0);
    }

    return list.filter((recipe) =>
      (recipe.folders ?? []).map((folder) => folder.name.trim()).includes(featuredCollection.label)
    );
  }, [featuredCollection, visibleRecipes]);

  const folderSpotlightRecipes = useMemo(() => {
    if (!featuredCollection) return [];

    const recipesInCollection = sortMostRecent(featuredCollectionRecipes);
    const totalRecipes = recipesInCollection.length;
    if (totalRecipes <= 3) return recipesInCollection.slice(0, 3);

    const now = new Date();
    const weekKey = getWeekKey(now);
    const ordered = getSeededRecipeOrder(
      recipesInCollection,
      `${weekKey}|${featuredCollection.key}|spotlight`
    );

    if (totalRecipes >= 6) {
      const dayOfWeek = now.getUTCDay() || 7;
      const phase = dayOfWeek <= 3 ? 0 : 1;
      const start = (phase * 3) % ordered.length;
      return Array.from({ length: 3 }, (_, index) => ordered[(start + index) % ordered.length]);
    }

    const fixed = ordered.slice(0, 2);
    const rotating = ordered.slice(2);
    const dayOfWeek = now.getUTCDay() || 7;
    const rotatingRecipe = rotating[(dayOfWeek - 1) % rotating.length];
    return [...fixed, rotatingRecipe];
  }, [featuredCollection, featuredCollectionRecipes]);

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

  const visibleNotes = useMemo<HomeNote[]>(
    () => {
      if (!mockedHomeData) return notes;
      return mockedHomeData.notes.map((note) => ({
        id: note.id,
        title: note.title?.trim() || 'Untitled note',
        updatedAt: note.updatedAt,
      }));
    },
    [mockedHomeData, notes]
  );

  const shoppingList = useMemo(() => {
    if (!isShoppingHydrated || isShoppingHydrating) return null;
    const totalCount = shoppingItems.length;
    if (totalCount === 0) return null;
    const checkedCount = shoppingItems.reduce((acc, item) => acc + (item.checked ? 1 : 0), 0);
    return { totalCount, checkedCount };
  }, [isShoppingHydrated, isShoppingHydrating, shoppingItems]);

  const visibleShoppingList = mockedHomeData?.shoppingList ?? shoppingList;

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [storageBannerDismissed, setStorageBannerDismissed] = useState<boolean | null>(null);
  const [riskBannerEventId, setRiskBannerEventId] = useState<string | null>(null);
  const [seenConversionTriggerIds, setSeenConversionTriggerIds] = useState<string[] | null>(null);
  const [activeConversionTriggerId, setActiveConversionTriggerId] = useState<string | null>(null);
  const [storageBannerStateReady, setStorageBannerStateReady] = useState(false);
  const [recipeOpenHistory, setRecipeOpenHistory] = useState<RecipeOpenHistory>({});

  const refreshRecipeOpenHistory = useCallback(async () => {
    try {
      const next = await loadRecipeOpenHistory();
      setRecipeOpenHistory(next);
    } catch {
      setRecipeOpenHistory({});
    }
  }, []);

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

  useFocusEffect(
    useCallback(() => {
      void refreshRecipeOpenHistory();
    }, [refreshRecipeOpenHistory])
  );

  const isInitialLoading =
    !mockedHomeData &&
    !shouldUseLocalData &&
    (recipesQuery.isLoading || notesQuery.isLoading) &&
    !recipesQuery.data &&
    !notesQuery.data;

  const emptyStateTitle = 'Your kitchen is just getting started.';
  const emptyStateBody = 'Add your first recipe and make this space yours.';

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

  const totalItems = visibleRecipes.length + visibleNotes.length;
  const isEmpty = totalItems === 0;
  const importsCount = importsUsageQuery.data?.totalCount ?? 0;
  const importsTotalBytes = importsUsageQuery.data?.totalBytes ?? 0;
  const hasUserGeneratedContent =
    visibleRecipes.length > 0 || visibleNotes.length > 0 || importsCount > 0;
  const conversionTrigger = useMemo(
    () =>
      getConversionBannerTrigger({
        recipesCount: visibleRecipes.length,
        notesCount: visibleNotes.length,
        importsCount,
        importsTotalBytes,
      }),
    [importsCount, importsTotalBytes, visibleNotes.length, visibleRecipes.length]
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

  const shoppingListVisible = (visibleShoppingList?.totalCount ?? 0) > 0;
  const activeShoppingList = shoppingListVisible ? visibleShoppingList : null;
  const recipeCount = visibleRecipes.length;
  const isVeryFewRecipes = recipeCount > 0 && recipeCount <= 5;
  const isFirstRecipesState = recipeCount >= 1 && recipeCount <= 3;
  const isMediumRecipeLibrary = recipeCount >= 6 && recipeCount < 20;
  const isLargeRecipeLibrary = recipeCount >= 20;

  const weeklyIdeaRecipes = useMemo(() => {
    if (!isLargeRecipeLibrary) return [];
    return buildWeeklyIdeaRecipes(visibleRecipes, recipeOpenHistory, new Date());
  }, [isLargeRecipeLibrary, recipeOpenHistory, visibleRecipes]);

  const greeting = useMemo(() => {
    const meal = getMealTime(new Date());
    if (meal === 'breakfast') return 'Good morning';
    if (meal === 'lunch') return 'Good afternoon';
    if (meal === 'snack') return 'Good afternoon';
    return 'Good evening';
  }, []);

  const pick = useMemo(() => {
    const PICK_MIN_RECIPES = 6;
    if (isEmpty) return null;
    if (visibleRecipes.length < PICK_MIN_RECIPES) return null;

    return getRecommendedPick(visibleRecipes, new Date());
  }, [isEmpty, visibleRecipes]);
  const mediumHeroRecipe = useMemo(() => {
    if (!isMediumRecipeLibrary) return null;
    return getRecommendedPick(visibleRecipes, new Date())?.recipe ?? null;
  }, [isMediumRecipeLibrary, visibleRecipes]);

  const recentRecipes = useMemo(() => {
    const sliceCount = isTransitional ? 2 : 6;
    return sortMostRecent(visibleRecipes).slice(0, sliceCount);
  }, [isTransitional, visibleRecipes]);

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
  const weeklyIdeaCards = useMemo<RecipePreview[]>(
    () =>
      weeklyIdeaRecipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        emoji: recipe.emoji ?? undefined,
        imageUrl: recipe.imageUrl ?? undefined,
      })),
    [weeklyIdeaRecipes]
  );
  const lowContentHeroRecipe = useMemo(() => sortMostRecent(visibleRecipes)[0] ?? null, [visibleRecipes]);

  const root =
    resolvedMode === 'dev' ? '(dev)' : resolvedMode === 'public' ? '(public)' : '(auth)';
  const recipeDetailPath =
    root === '(dev)'
      ? '/(dev)/recipes/[id]'
      : root === '(public)'
        ? '/(public)/recipes/[id]'
        : '/(auth)/recipes/[id]';
  const homePath =
    root === '(dev)'
      ? '/(dev)/(tabs)'
      : root === '(public)'
        ? '/(public)/(tabs)'
        : '/(auth)/(tabs)';
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
  const shoppingListCard = activeShoppingList ? (
    <ActionCard
      title="Shopping List"
      meta={`${activeShoppingList.checkedCount}/${activeShoppingList.totalCount} items checked`}
      variant="shoppingActive"
      leftIcon={<Feather name="shopping-cart" size={24} color={theme.colors.primaryDark} />}
      onPress={() => {
        router.push(shoppingListPath);
      }}
    />
  ) : (
    <ActionCard
      title="Start a shopping list"
      meta="Keep track of ingredients"
      variant="shoppingEmpty"
      leftIcon={<Feather name="plus" size={28} color={theme.colors.primaryDark} />}
      onPress={() => {
        router.push(shoppingListPath);
      }}
    />
  );

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
        <View style={styles.emptyStateWrap}>
          <EmptyHomeCard
            title={emptyStateTitle}
            body={emptyStateBody}
            primaryLabel="Add your first recipe"
            secondaryLabel="Create a note"
            onPressPrimary={handlePrimaryCta}
            onPressSecondary={handleSecondaryCta}
          />
        </View>
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

      {isMediumRecipeLibrary && mediumHeroRecipe ? (
        <PickCard
          label="Try this →"
          title={mediumHeroRecipe.title}
          subtitle={mediumHeroRecipe.subtitle ?? 'A recipe that fits right now'}
          emoji={mediumHeroRecipe.emoji ?? undefined}
          imageUrl={mediumHeroRecipe.imageUrl ?? undefined}
          onPress={() => {
            router.push({
              pathname: recipeDetailPath,
              params: { id: mediumHeroRecipe.id, returnTo: homePath },
            });
          }}
        />
      ) : null}

      {!isMediumRecipeLibrary && pick ? (
        <PickCard
          label={pick.label}
          title={pick.recipe.title}
          subtitle={pick.recipe.subtitle ?? undefined}
          emoji={pick.recipe.emoji ?? undefined}
          imageUrl={pick.recipe.imageUrl ?? undefined}
          onPress={() => {
            router.push({ pathname: recipeDetailPath, params: { id: pick.recipe.id, returnTo: homePath } });
          }}
        />
      ) : null}

      {!pick && isVeryFewRecipes && lowContentHeroRecipe ? (
        <PickCard
          label={isFirstRecipesState ? 'Your first recipes' : 'Try this tonight'}
          title={lowContentHeroRecipe.title}
          subtitle={lowContentHeroRecipe.subtitle ?? 'A recipe you saved'}
          emoji={lowContentHeroRecipe.emoji ?? undefined}
          imageUrl={lowContentHeroRecipe.imageUrl ?? undefined}
          onPress={() => {
            router.push({
              pathname: recipeDetailPath,
              params: { id: lowContentHeroRecipe.id, returnTo: homePath },
            });
          }}
        />
      ) : null}

      {!isEmpty && isLargeRecipeLibrary ? (
        <View style={styles.section}>
          <SectionHeaderRow title="Ideas for this week" />

          {weeklyIdeaCards.length > 0 ? (
            <RecipeCarousel
              items={weeklyIdeaCards}
              cardWidth={recipeCardWidth}
              gap={CARD_GAP}
              rightPadding={theme.spacing.lg}
              onPressItem={(id) => {
                router.push({ pathname: recipeDetailPath, params: { id, returnTo: homePath } });
              }}
              showMeta={false}
            />
          ) : (
            <View style={styles.mutedRow}>
              <Text style={styles.mutedRowText}>No suggestions yet.</Text>
            </View>
          )}

          {!isPublic && featuredCollection && folderSpotlightRecipes.length > 0 ? (
            <FolderSpotlightCard
              title={featuredCollection.label}
              recipes={folderSpotlightRecipes}
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
      ) : !isEmpty ? (
        <View style={styles.section}>
          {isVeryFewRecipes ? (
            <SectionHeaderRow title="Your first recipes" />
          ) : isMediumRecipeLibrary ? (
            <SectionHeaderRow
              title="Recently added"
              ctaLabel={isPublic ? undefined : 'See all'}
              onPressCta={isPublic ? undefined : () => router.push(collectionsPath)}
              inlineTitleCta
            />
          ) : (
            <SectionHeaderRow
              title="Recently added"
              ctaLabel={isPublic ? undefined : 'See all'}
              onPressCta={isPublic ? undefined : () => router.push(collectionsPath)}
              inlineTitleCta
            />
          )}

          {recentRecipeCards.length > 0 ? (
            <RecipeCarousel
              items={recentRecipeCards}
              cardWidth={recipeCardWidth}
              gap={CARD_GAP}
              rightPadding={theme.spacing.lg}
              formatMeta={(r) => formatRelativeDay(r.createdAt ?? r.updatedAt)}
              onPressItem={(id) => {
                router.push({ pathname: recipeDetailPath, params: { id, returnTo: homePath } });
              }}
            />
          ) : (
            <View style={styles.mutedRow}>
              <Text style={styles.mutedRowText}>No recipes yet.</Text>
            </View>
          )}
        </View>
      ) : null}

      {!isEmpty && isMediumRecipeLibrary ? (
        <View style={styles.section}>
          {!isPublic && featuredCollection && folderSpotlightRecipes.length > 0 ? (
            <FolderSpotlightCard
              title={featuredCollection.label}
              recipes={folderSpotlightRecipes}
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
          {shoppingListCard}
        </View>
      ) : !isEmpty ? (
        <View style={styles.section}>
          {shoppingListCard}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = createThemedStyles((theme) => ({
  content: {
    paddingTop: theme.spacing.xl,
    gap: layout.sectionGap,
  },
  emptyStateWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  section: {
    gap: layout.cardGap,
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
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.listGap,
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.mutedForeground,
  },
  contextBannerCard: {
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: layout.listGap,
  },
  contextBannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: layout.listGap,
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
