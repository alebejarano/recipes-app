import { Feather } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import BrowseCategorySection from '@/features/search/components/BrowseCategorySection';
import SectionHeader from '@/features/search/components/SectionHeader';
import SearchBar from '@/features/search/components/SearchBar';
import SearchFilterPills from '@/features/search/components/SearchFilterPills';
import SearchHeader from '@/features/search/components/SearchHeader';

import { useStrategyFoldersList } from '@/features/folders/hooks/useStrategyFolders';
import { useStrategyNotesList } from '@/features/notes/hooks/useStrategyNotes';
import RecipeRow from '@/features/recipes/components/RecipeRow';
import { useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes';
import {
  SEARCH_FILTERS,
  type BrowseCategory,
  type SearchFilterId,
} from '@/features/search/data/searchData';

type SearchScreenProps = {
  mode?: 'auth' | 'public';
};

export default function SearchScreen({ mode }: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterId>('all');
  const segments = useSegments();
  const resolvedMode =
    mode ??
    (segments[0] === '(public)' ? 'public' : 'auth');
  const trimmedQuery = query.trim();
  const isBrowsing = trimmedQuery.length === 0;
  const searchParams = useMemo(
    () => ({
      search: isBrowsing ? undefined : trimmedQuery,
      limit: 24,
    }),
    [isBrowsing, trimmedQuery]
  );
  const recipeSearchParams = useMemo(
    () => ({
      search: undefined,
      limit: 200,
    }),
    []
  )
  const foldersQuery = useStrategyFoldersList(resolvedMode, searchParams);
  const recipesQuery = useStrategyRecipesList(recipeSearchParams, resolvedMode);
  const notesQuery = useStrategyNotesList(searchParams, resolvedMode);

  const placeholder = useMemo(() => {
    switch (activeFilter) {
      case 'recipes':
        return 'Search recipes...';
      case 'collections':
        return 'Search folders...';
      case 'notes':
        return 'Search notes...';
      default:
        return 'Search anything...';
    }
  }, [activeFilter]);

  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl);
  const root = resolvedMode === 'public' ? '(public)' : '(auth)';
  const collectionDetailPath =
    root === '(public)'
        ? '/(public)/collections/[key]'
        : '/(auth)/collections/[key]';
  const searchReturnTo =
    root === '(public)' ? '/(public)/(tabs)/search' : '/(auth)/(tabs)/search';

  const collectionCards = useMemo<BrowseCategory[]>(() => {
    const source = foldersQuery.data ?? [];
    return source.map((folder) => ({
      id: folder.name,
      label: folder.name,
      icon: 'folder',
    }));
  }, [foldersQuery.data]);
  const recipeItems = useMemo(() => {
    const source = recipesQuery.data ?? []
    const normalizedQuery = trimmedQuery.toLowerCase()

    return source.filter((recipe) => {
      if (!normalizedQuery) return true

      const searchableText = [
        recipe.title,
        recipe.subtitle ?? '',
        recipe.description ?? '',
        ...(recipe.folders ?? []).map((folder) => folder.name),
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedQuery)
    })
  }, [recipesQuery.data, trimmedQuery]);
  const noteItems = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const folderItems = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);

  const showRecipes = !isBrowsing && (activeFilter === 'all' || activeFilter === 'recipes');
  const showFolders = !isBrowsing && (activeFilter === 'all' || activeFilter === 'collections');
  const showNotes = !isBrowsing && (activeFilter === 'all' || activeFilter === 'notes');

  const isSearching =
    (showRecipes && recipesQuery.isLoading) ||
    (showFolders && foldersQuery.isLoading) ||
    (showNotes && notesQuery.isLoading);
  const hasResults =
    (showRecipes && recipeItems.length > 0) ||
    (showFolders && folderItems.length > 0) ||
    (showNotes && noteItems.length > 0);

  return (
    <Screen
      scroll
      bottomPadding={bottomPadding}
      contentStyle={styles.content}
    >
      <SearchHeader
        title="Search"
        subtitle="Find recipes, folders, and notes in one place."
      />

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
      />

      <SearchFilterPills
        options={SEARCH_FILTERS}
        value={activeFilter}
        onChange={setActiveFilter}
      />

      {isBrowsing ? (
        <>
          {activeFilter === 'collections' ? (
            collectionCards.length > 0 ? (
              <BrowseCategorySection
                title="Folders"
                items={collectionCards}
                onPressItem={(label) => {
                  const key =
                    label === 'Uncategorized'
                      ? 'uncategorized'
                      : encodeURIComponent(label);
                  router.push({
                    pathname: collectionDetailPath,
                    params: { key, returnTo: searchReturnTo },
                  });
                }}
              />
            ) : (
              <Text style={styles.emptyText}>No folders yet.</Text>
            )
          ) : null}
        </>
      ) : (
        <View style={styles.resultsWrap}>
          {isSearching ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={styles.loadingText.color} />
              <Text style={styles.loadingText}>Searching…</Text>
            </View>
          ) : null}

          {showRecipes && recipeItems.length > 0 ? (
            <View style={styles.sectionWrap}>
              <SectionHeader icon="book-open" title="Recipes" />
              <View style={styles.resultsList}>
                {recipeItems.map((item) => (
                  <RecipeRow
                    key={item.id}
                    title={item.title}
                    folders={item.folders?.map((folder) => folder.name)}
                    emoji={item.emoji}
                    imageUrl={item.imageUrl}
                    onPress={() =>
                      router.push({
                        pathname:
                          root === '(public)'
                              ? '/(public)/recipes/[id]'
                              : '/(auth)/recipes/[id]',
                        params: {
                          id: item.id,
                          returnTo: searchReturnTo,
                        },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          {showFolders && folderItems.length > 0 ? (
            <View style={styles.sectionWrap}>
              <SectionHeader icon="folder" title="Folders" />
              <View style={styles.resultsList}>
                {folderItems.map((folder) => (
                  <Pressable
                    key={folder.id}
                    onPress={() => {
                      const key =
                        folder.name === 'Uncategorized'
                          ? 'uncategorized'
                          : encodeURIComponent(folder.name);
                      router.push({
                        pathname: collectionDetailPath,
                        params: { key, returnTo: searchReturnTo },
                      });
                    }}
                    style={styles.simpleRow}
                    accessibilityRole="button"
                    accessibilityLabel={`Open folder ${folder.name}`}
                  >
                    <View style={styles.simpleRowIcon}>
                      <Text style={styles.emoji}>{folder.emoji ?? '📁'}</Text>
                    </View>
                    <Text style={styles.simpleRowTitle} numberOfLines={1}>
                      {folder.name}
                    </Text>
                    <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {showNotes && noteItems.length > 0 ? (
            <View style={styles.sectionWrap}>
              <SectionHeader icon="file-text" title="Notes" />
              <View style={styles.resultsList}>
                {noteItems.map((note) => (
                  <Pressable
                    key={note.id}
                    onPress={() =>
                      router.push({
                        pathname:
                          root === '(public)'
                              ? '/(public)/notes/[id]'
                              : '/(auth)/notes/[id]',
                        params: {
                          id: note.id,
                          returnTo: searchReturnTo,
                        },
                      })
                    }
                    style={styles.simpleRow}
                    accessibilityRole="button"
                    accessibilityLabel={`Open note ${note.title?.trim() || 'Untitled note'}`}
                  >
                    <View style={styles.simpleRowIcon}>
                      <Feather name="file-text" size={16} color={theme.colors.mutedForeground} />
                    </View>
                    <View style={styles.noteTextWrap}>
                      <Text style={styles.simpleRowTitle} numberOfLines={1}>
                        {note.title?.trim() || 'Untitled note'}
                      </Text>
                      <Text style={styles.simpleRowMeta} numberOfLines={1}>
                        {(note.content ?? '').trim() || 'No note content yet.'}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={theme.colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {!isSearching && !hasResults ? (
            <Text style={styles.emptyText}>{`No matches found for "${trimmedQuery}".`}</Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.xl,
  },
  resultsWrap: {
    gap: theme.spacing.lg,
  },
  sectionWrap: {
    gap: theme.spacing.md,
  },
  resultsList: {
    gap: theme.spacing.sm,
  },
  loadingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  simpleRowIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emoji: {
    fontSize: 16,
  },
  simpleRowTitle: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  noteTextWrap: {
    flex: 1,
  },
  simpleRowMeta: {
    marginTop: 2,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  emptyText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}));
