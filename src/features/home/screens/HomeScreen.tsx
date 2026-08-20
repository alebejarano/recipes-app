import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { router, useFocusEffect, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { i18n } from '@/localization/i18n';
import { useTranslation } from '@/localization';
import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';
import { theme } from '@/styles/theme';

import { useAuth } from '@/features/auth/context/AuthContext';
import { useAnalyticsCapture } from '@/features/analytics/events';
import {
  buildCollectionsForSegment,
  getCategorizingFolders,
  recipeMatchesCollection,
} from '@/features/collections/utils/collections';
import ActionCard from '@/features/home/components/ActionCard';
import EmptyHomeCard from '@/features/home/components/EmptyHomeCard';
import FolderSpotlightCard from '@/features/home/components/FolderSpotlightCard';
import HomeHeader from '@/features/home/components/HomeHeader';
import HomeLoadingSkeleton from '@/features/home/components/HomeLoadingSkeleton';
import PickCard from '@/features/home/components/PickCard';
import RecentActivityList from '@/features/home/components/RecentActivityList';
import RecipeCarousel, { type RecipePreview } from '@/features/home/components/RecipeCarousel';
import SectionHeaderRow from '@/features/home/components/SectionHeaderRow';
import SuccessBanner from '@/features/home/components/SuccessBanner';
import { useStrategyNotesList } from '@/features/notes/hooks/useStrategyNotes';
import { useRecipeDocumentUsageSummary } from '@/features/recipes/hooks/useRecipeDocuments';
import { useManagedImports } from '@/features/recipes/hooks/useManagedImports';
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
  formatRelativeDay,
  getMealTime,
  getRecommendedPick,
  sortMostRecent,
} from '@/features/home/utils/homeFormatters';
import {
  buildHomeActivity,
  getHomeCapabilities,
  getRecipeLibraryStage,
  type HomeActivityItem,
} from '@/features/home/utils/homeState';

type HomeProps = {
  showAccountSuccessBanner?: boolean;
  showRecipeSuccessBanner?: boolean;
  mode?: 'auth' | 'public';
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
  createdAt: string;
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
      title: i18n.t('home.conversion.limitTitle'),
      body: i18n.t('home.conversion.body'),
    };
  }

  if (recipeUsageRatio >= 0.8) {
    return {
      id: 'recipes-80-plus',
      title: i18n.t('home.conversion.title'),
      body: i18n.t('home.conversion.body'),
    };
  }

  if (importUsageRatio >= 0.8) {
    return {
      id: 'imports-80-plus',
      title: i18n.t('home.conversion.title'),
      body: i18n.t('home.conversion.importsBody'),
    };
  }

  if (totalInvestmentScore >= 40) {
    return {
      id: 'investment-40',
      title: i18n.t('home.conversion.title'),
      body: i18n.t('home.conversion.body'),
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
}: HomeProps) {
  const { t } = useTranslation();
  const captureAnalyticsEvent = useAnalyticsCapture();
  const queryClient = useQueryClient();
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl);
  const segments = useSegments();
  const { user } = useAuth();
  const resolvedMode =
    mode ??
    (segments[0] === '(public)' ? 'public' : 'auth');
  const isPublic = resolvedMode === 'public';
  const isAuthenticated = Boolean(user);
  const { isStorageModeReady } = useStorageDataMode(resolvedMode);

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
  const importsQuery = useManagedImports(resolvedMode);
  const importsUsageQuery = useRecipeDocumentUsageSummary({ enabled: isPublic && !isAuthenticated });

  const hydrateShopping = useShoppingListStore((s) => s.hydrate);
  const isShoppingHydrated = useShoppingListStore((s) => s.isHydrated);
  const isShoppingHydrating = useShoppingListStore((s) => s.isHydrating);
  const shoppingListId = useShoppingListStore((s) => s.listId);
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

  const visibleRecipes = recipes;

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
      return list.filter((recipe) => getCategorizingFolders(recipe.folders).length === 0);
    }

    return list.filter((recipe) => recipeMatchesCollection(recipe, featuredCollection.label));
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
        title: note.title?.trim() || t('notes.fallbackTitle'),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }));
    },
    [notesQuery.data, t]
  );

  const visibleNotes = notes;

  const shoppingList = useMemo(() => {
    if (!isShoppingHydrated || isShoppingHydrating) return null;
    const totalCount = shoppingItems.length;
    if (totalCount === 0) return null;
    const checkedCount = shoppingItems.reduce((acc, item) => acc + (item.checked ? 1 : 0), 0);
    return { totalCount, checkedCount };
  }, [isShoppingHydrated, isShoppingHydrating, shoppingItems]);

  const visibleShoppingList = shoppingList;

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
      // Imports can be saved from a different route (or arrive through sync)
      // while this tab remains mounted. Revalidate the sources that compose
      // the Home states whenever the user returns to this screen.
      void queryClient.invalidateQueries({ queryKey: ['recipes'] });
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    }, [queryClient, refreshRecipeOpenHistory])
  );

  const isInitialLoading =
    !isStorageModeReady ||
    recipesQuery.isLoading ||
    notesQuery.isLoading ||
    importsQuery.isLoading;

  const emptyStateTitle = t('home.empty.title');
  const emptyStateBody = t('home.empty.body');

  const handlePrimaryCta = () => {
    captureAnalyticsEvent('home_create_recipe_pressed', {
      recipe_library_stage: getRecipeLibraryStage(recipes.length),
    });
    router.push(
      resolvedMode === 'public'
        ? '/(public)/create'
        : '/(auth)/create'
    );
  };

  const handleSecondaryCta = () => {
    router.push(
      resolvedMode === 'public'
        ? '/(public)/notes/create'
      : '/(auth)/notes/create'
    );
  };

  const importsCount = importsQuery.data?.length ?? importsUsageQuery.data?.totalCount ?? 0;
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
    const timeout = setTimeout(() => {
      setSeenConversionTriggerIds(next);
      setActiveConversionTriggerId(conversionTrigger.id);
      AsyncStorage.setItem(STORAGE_CONVERSION_BANNER_SEEN_TRIGGERS_KEY, JSON.stringify(next)).catch(
        () => {
          // ignore persistence errors; we still keep in-memory state for this session
        }
      );
    }, 0);
    return () => clearTimeout(timeout);
  }, [conversionTrigger, isAuthenticated, isPublic, seenConversionTriggerIds]);

  const shoppingListVisible = (visibleShoppingList?.totalCount ?? 0) > 0;
  const activeShoppingList = shoppingListVisible ? visibleShoppingList : null;
  const recipeCount = visibleRecipes.length;
  const homeCapabilities = useMemo(
    () =>
      getHomeCapabilities({
        recipeCount,
        notesCount: visibleNotes.length,
        importsCount,
        hasShoppingList: Boolean(isShoppingHydrated && !isShoppingHydrating && shoppingListId),
        hasCollections: recipeCollections.length > 0,
        hasFavorites: visibleRecipes.some((recipe) =>
          recipe.folders?.some((folder) => folder.name.trim().toLowerCase() === 'favorites')
        ),
      }),
    [importsCount, isShoppingHydrated, isShoppingHydrating, recipeCollections.length, recipeCount, shoppingListId, visibleNotes.length, visibleRecipes]
  );
  const isEmpty = homeCapabilities.stage === 'empty' && !homeCapabilities.hasRecentActivity;
  const isRecipeEmptyWithActivity = homeCapabilities.stage === 'empty' && homeCapabilities.hasRecentActivity;
  const isStarterLibrary = homeCapabilities.stage === 'starter';
  const isMediumRecipeLibrary = homeCapabilities.stage === 'established';
  const isLargeRecipeLibrary = homeCapabilities.stage === 'large';

  const weeklyIdeaRecipes = useMemo(() => {
    if (!isLargeRecipeLibrary) return [];
    return buildWeeklyIdeaRecipes(visibleRecipes, recipeOpenHistory, new Date());
  }, [isLargeRecipeLibrary, recipeOpenHistory, visibleRecipes]);

  const greeting = useMemo(() => {
    const meal = getMealTime(new Date());
    if (meal === 'breakfast') return t('home.greeting.morning');
    if (meal === 'lunch') return t('home.greeting.afternoon');
    if (meal === 'snack') return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  }, [t]);

  const pick = useMemo(() => {
    const PICK_MIN_RECIPES = 6;
    if (!homeCapabilities.hasRecipes) return null;
    if (visibleRecipes.length < PICK_MIN_RECIPES) return null;

    return getRecommendedPick(visibleRecipes, new Date());
  }, [homeCapabilities.hasRecipes, visibleRecipes]);
  const mediumHeroRecipe = useMemo(() => {
    if (!isMediumRecipeLibrary) return null;
    return getRecommendedPick(visibleRecipes, new Date())?.recipe ?? null;
  }, [isMediumRecipeLibrary, visibleRecipes]);

  const recentRecipes = useMemo(() => {
    const sliceCount = isStarterLibrary ? 5 : 6;
    return sortMostRecent(visibleRecipes).slice(0, sliceCount);
  }, [isStarterLibrary, visibleRecipes]);

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
  const recentActivity = useMemo(
    () =>
      buildHomeActivity({
        recipes: isRecipeEmptyWithActivity ? visibleRecipes : [],
        notes: visibleNotes,
        imports: (importsQuery.data ?? []).map((item) => ({
          ...item,
          title: item.title ?? item.fileName,
        })),
        noteFallbackTitle: t('notes.fallbackTitle'),
        importFallbackTitle: t('home.activity.importFallbackTitle'),
        limit: isStarterLibrary ? 2 : 4,
      }),
    [importsQuery.data, isRecipeEmptyWithActivity, isStarterLibrary, t, visibleNotes, visibleRecipes]
  );

  const root = resolvedMode === 'public' ? '(public)' : '(auth)';
  const recipeDetailPath = root === '(public)' ? '/(public)/recipes/[id]' : '/(auth)/recipes/[id]';
  const homePath = root === '(public)' ? '/(public)/(tabs)' : '/(auth)/(tabs)';
  const collectionDetailPath = root === '(public)' ? '/(public)/collections/[key]' : '/(auth)/collections/[key]';
  const collectionsPath =
    root === '(public)'
        ? '/(public)/(tabs)/collections'
        : '/(auth)/(tabs)/collections';
  const shoppingListPath =
    root === '(public)'
        ? '/(public)/shopping-list'
        : '/(auth)/shopping-list';
  const recipeDocumentDetailPath =
    root === '(public)'
      ? '/(public)/recipes/documents/[id]'
      : '/(auth)/recipes/documents/[id]';
  const importsPath =
    root === '(public)'
      ? '/(public)/imports/manage'
      : '/(auth)/imports/manage';
  const recipeDocumentsPath =
    root === '(public)'
      ? '/(public)/(tabs)/collections?segment=recipes&recipesSegment=documents'
      : '/(auth)/(tabs)/collections?segment=recipes&recipesSegment=documents';
  const openRecentActivityItem = (item: HomeActivityItem) => {
    captureAnalyticsEvent('home_recent_activity_opened', {
      recipe_library_stage: homeCapabilities.stage,
      item_type: item.type,
    });
    if (item.destination === 'note') {
      router.push({
        pathname: root === '(public)' ? '/(public)/notes/[id]' : '/(auth)/notes/[id]',
        params: { id: item.id.replace(/^note:/, '') },
      });
      return;
    }
    if (item.destination === 'imports' && item.documentId) {
      router.push({
        pathname: recipeDocumentDetailPath,
        params: { id: item.documentId, returnTo: homePath },
      });
      return;
    }
    if (item.destination === 'imports') {
      router.push(importsPath);
    }
  };
  const openShoppingList = () => {
    captureAnalyticsEvent('home_shopping_list_opened', {
      recipe_library_stage: homeCapabilities.stage,
    });
    router.push(shoppingListPath);
  };
  const shoppingListCard = activeShoppingList ? (
    <ActionCard
      title={t('home.shopping.activeTitle')}
      meta={t('home.shopping.activeMeta', {
        checked: activeShoppingList.checkedCount,
        total: activeShoppingList.totalCount,
      })}
      variant="shoppingActive"
      leftIcon={<Feather name="shopping-cart" size={24} color={theme.colors.primaryDark} />}
      onPress={openShoppingList}
    />
  ) : (
    <ActionCard
      title={t('home.shopping.emptyTitle')}
      meta={t('home.shopping.emptyMeta')}
      variant="shoppingEmpty"
      leftIcon={<Feather name="plus" size={28} color={theme.colors.primaryDark} />}
      onPress={openShoppingList}
    />
  );

  if (isInitialLoading) {
    return (
      <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
        <HomeLoadingSkeleton cardWidth={recipeCardWidth} label={t('home.loading')} />
      </Screen>
    );
  }

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      {showAccountSuccessBanner && !bannerDismissed && !isPublic ? (
        <SuccessBanner
          text={t('home.success.account')}
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}
      {showRecipeSuccessBanner && !bannerDismissed ? (
        <SuccessBanner
          text={t('home.success.recipe')}
          onDismiss={() => setBannerDismissed(true)}
        />
      ) : null}

      <HomeHeader
        greeting={greeting}
        title={
          <>
            {t('home.headerTitle')} <Text style={styles.wave}>👋</Text>
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
            primaryLabel={t('home.empty.primary')}
            secondaryLabel={t('home.empty.secondary')}
            onPressPrimary={handlePrimaryCta}
            onPressSecondary={handleSecondaryCta}
          />
        </View>
      ) : null}

      {isRecipeEmptyWithActivity ? (
        <View style={styles.recipeCtaWrap}>
          <EmptyHomeCard
            title={t('home.activity.recipeCtaTitle')}
            body={t('home.activity.recipeCtaBody')}
            primaryLabel={t('home.activity.createRecipe')}
            secondaryLabel={t('home.activity.importRecipe')}
            onPressPrimary={handlePrimaryCta}
            onPressSecondary={() => {
              captureAnalyticsEvent('home_import_recipe_pressed', {
                recipe_library_stage: homeCapabilities.stage,
              });
              router.push(recipeDocumentsPath);
            }}
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
              <Text style={styles.contextBannerTitle}>{t('home.banners.storageUpdateTitle')}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.banners.dismissStorageRiskA11y')}
              hitSlop={8}
              onPress={() => {
                void dismissRiskBanner();
              }}
            >
              <Feather name="x" size={18} color={styles.contextBannerCloseIcon.color} />
            </Pressable>
          </View>
          <Text style={styles.contextBannerBody}>
            {t('home.banners.storageUpdateBody')}
          </Text>
          <View style={styles.contextBannerActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.banners.learnPremiumA11y')}
              onPress={() => {
                dismissConversionBanner();
                void dismissRiskBanner();
                router.push('/(public)/premium');
              }}
              style={({ pressed }) => [styles.contextPrimaryAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.contextPrimaryActionText}>{t('home.banners.learnPremium')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.banners.notNowA11y')}
              onPress={() => {
                void dismissRiskBanner();
              }}
              style={({ pressed }) => [styles.contextSecondaryAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.contextSecondaryActionText}>{t('home.banners.notNow')}</Text>
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
              accessibilityLabel={t('home.banners.dismissPremiumSuggestionA11y')}
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
              accessibilityLabel={t('home.banners.learnPremiumA11y')}
              onPress={() => {
                dismissConversionBanner();
                router.push('/(public)/premium');
              }}
              style={({ pressed }) => [styles.contextPrimaryAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.contextPrimaryActionText}>{t('home.banners.learnPremium')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.banners.notNowA11y')}
              onPress={dismissConversionBanner}
              style={({ pressed }) => [styles.contextSecondaryAction, pressed && styles.actionPressed]}
            >
              <Text style={styles.contextSecondaryActionText}>{t('home.banners.notNow')}</Text>
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
              <Text style={styles.localOnlyTitle}>{t('home.banners.localOnlyTitle')}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.banners.dismissStorageInfoA11y')}
              hitSlop={8}
              onPress={() => {
                void dismissStorageInfoBanner();
              }}
            >
              <Feather name="x" size={18} color={styles.localOnlyCloseIcon.color} />
            </Pressable>
          </View>
          <Text style={styles.localOnlyBody}>
            {t('home.banners.localOnlyBodyLead')}{'\n'}
            {t('home.banners.localOnlyYouCan')}
            <Text
              style={styles.localOnlyLink}
              onPress={() => {
                router.push('/(public)/register');
              }}
            >
              {t('home.banners.localOnlyBodyCreate')}
            </Text>{' '}
            {t('home.banners.localOnlyBodyMiddle')}
            <Text
              style={styles.localOnlyPremiumLink}
              onPress={() => {
                router.push('/(public)/premium');
              }}
            >
              {t('home.banners.localOnlyBodyPremium')}
            </Text>
            .
          </Text>
          <View style={styles.localOnlyFooterRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('home.banners.dismissStorageInfoA11y')}
              onPress={() => {
                void dismissStorageInfoBanner();
              }}
              style={({ pressed }) => [styles.gotItButton, pressed && styles.gotItButtonPressed]}
            >
              <Text style={styles.gotItButtonText}>{t('home.banners.gotIt')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {isMediumRecipeLibrary && mediumHeroRecipe ? (
        <PickCard
          label={t('home.picks.tryThis')}
          title={mediumHeroRecipe.title}
          subtitle={mediumHeroRecipe.subtitle ?? t('home.picks.fitsRightNow')}
          emoji={mediumHeroRecipe.emoji ?? undefined}
          imageUrl={mediumHeroRecipe.imageUrl ?? undefined}
          onPress={() => {
            captureAnalyticsEvent('home_recipe_recommendation_opened', {
              recipe_library_stage: homeCapabilities.stage,
              section: 'hero',
            });
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
            captureAnalyticsEvent('home_recipe_recommendation_opened', {
              recipe_library_stage: homeCapabilities.stage,
              section: 'hero',
            });
            router.push({ pathname: recipeDetailPath, params: { id: pick.recipe.id, returnTo: homePath } });
          }}
        />
      ) : null}

      {!pick && isStarterLibrary && lowContentHeroRecipe ? (
        <PickCard
          label={t('home.picks.tryThis')}
          title={lowContentHeroRecipe.title}
          subtitle={lowContentHeroRecipe.subtitle ?? t('home.picks.savedRecipe')}
          emoji={lowContentHeroRecipe.emoji ?? undefined}
          imageUrl={lowContentHeroRecipe.imageUrl ?? undefined}
          onPress={() => {
            captureAnalyticsEvent('home_recipe_recommendation_opened', {
              recipe_library_stage: homeCapabilities.stage,
              section: 'hero',
            });
            router.push({
              pathname: recipeDetailPath,
              params: { id: lowContentHeroRecipe.id, returnTo: homePath },
            });
          }}
        />
      ) : null}

      {isRecipeEmptyWithActivity && recentActivity.length > 0 ? (
        <View style={styles.section}>
          <SectionHeaderRow title={t('home.activity.title')} />
          <RecentActivityList
            items={recentActivity}
            formatMeta={formatRelativeDay}
            onPressItem={openRecentActivityItem}
          />
        </View>
      ) : null}

      {homeCapabilities.hasRecipes && isLargeRecipeLibrary ? (
        <View style={styles.section}>
          <SectionHeaderRow title={t('home.sections.ideas')} />

          {weeklyIdeaCards.length > 0 ? (
            <RecipeCarousel
              items={weeklyIdeaCards}
              cardWidth={recipeCardWidth}
              gap={CARD_GAP}
              rightPadding={theme.spacing.lg}
              onPressItem={(id) => {
                captureAnalyticsEvent('home_recipe_recommendation_opened', {
                  recipe_library_stage: homeCapabilities.stage,
                  section: 'ideas',
                });
                router.push({ pathname: recipeDetailPath, params: { id, returnTo: homePath } });
              }}
              showMeta={false}
            />
          ) : (
            <View style={styles.mutedRow}>
              <Text style={styles.mutedRowText}>{t('home.emptyState.noSuggestions')}</Text>
            </View>
          )}

          {featuredCollection && folderSpotlightRecipes.length > 0 ? (
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
              onPressRecipe={(id) => {
                router.push({ pathname: recipeDetailPath, params: { id, returnTo: homePath } });
              }}
            />
          ) : null}
        </View>
      ) : homeCapabilities.hasRecipes ? (
        <View style={styles.section}>
          {isStarterLibrary ? (
            <SectionHeaderRow title={t('home.sections.firstRecipes')} />
          ) : isMediumRecipeLibrary ? (
            <SectionHeaderRow
              title={t('home.sections.recentlyAdded')}
              ctaLabel={isPublic ? undefined : t('home.sections.seeAll')}
              onPressCta={isPublic ? undefined : () => router.push(collectionsPath)}
              inlineTitleCta
            />
          ) : (
            <SectionHeaderRow
              title={t('home.sections.recentlyAdded')}
              ctaLabel={isPublic ? undefined : t('home.sections.seeAll')}
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
                captureAnalyticsEvent('home_recipe_recommendation_opened', {
                  recipe_library_stage: homeCapabilities.stage,
                  section: isStarterLibrary ? 'first_recipes' : 'recently_added',
                });
                router.push({ pathname: recipeDetailPath, params: { id, returnTo: homePath } });
              }}
            />
          ) : (
            <View style={styles.mutedRow}>
              <Text style={styles.mutedRowText}>{t('home.emptyState.noRecipes')}</Text>
            </View>
          )}
        </View>
      ) : null}

      {isStarterLibrary && recentActivity.length > 0 ? (
        <View style={styles.section}>
          <SectionHeaderRow title={t('home.activity.title')} />
          <RecentActivityList
            items={recentActivity}
            formatMeta={formatRelativeDay}
            onPressItem={openRecentActivityItem}
          />
        </View>
      ) : null}

      {homeCapabilities.hasRecipes && isMediumRecipeLibrary ? (
        <View style={styles.section}>
          {featuredCollection && folderSpotlightRecipes.length > 0 ? (
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
              onPressRecipe={(id) => {
                router.push({ pathname: recipeDetailPath, params: { id, returnTo: homePath } });
              }}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.section}>{shoppingListCard}</View>
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
  recipeCtaWrap: {
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
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  wave: {
    fontSize: theme.fontSize.hero,
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
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
    flexShrink: 1,
  },
  contextBannerBody: {
    ...theme.textVariants.body,
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
    ...theme.textVariants.labelSmall,
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
    ...theme.textVariants.caption,
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
    ...theme.textVariants.subtitle,
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
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  localOnlyLink: {
    ...theme.textVariants.body,
    color: theme.colors.foreground,
    textDecorationLine: 'underline',
  },
  localOnlyPremiumLink: {
    ...theme.textVariants.emphasis,
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
    ...theme.textVariants.labelSmall,
    color: theme.colors.foreground,
  },
}));
