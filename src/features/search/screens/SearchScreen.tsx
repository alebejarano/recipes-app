import { router, useSegments } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Text } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import BrowseCategorySection from '@/features/search/components/BrowseCategorySection';
import SearchBar from '@/features/search/components/SearchBar';
import SearchFilterPills from '@/features/search/components/SearchFilterPills';
import SearchHeader from '@/features/search/components/SearchHeader';

import { useFoldersList } from '@/features/folders/hooks/useFoldersList';
import {
  SEARCH_FILTERS,
  type BrowseCategory,
  type SearchFilterId,
} from '@/features/search/data/searchMockData';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterId>('all');
  const segments = useSegments();
  const foldersQuery = useFoldersList();

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
  const isBrowsing = query.trim().length === 0;
  const root = segments[0] === '(dev)' ? '(dev)' : '(auth)';
  const collectionDetailPath =
    root === '(dev)' ? '/(dev)/collections/[key]' : '/(auth)/collections/[key]';
  const searchReturnTo =
    root === '(dev)' ? '/(dev)/(tabs)/search' : '/(auth)/(tabs)/search';

  const collectionCards = useMemo<BrowseCategory[]>(() => {
    return (foldersQuery.data ?? []).map((folder, index) => ({
      id: folder.name,
      label: folder.name,
      icon: 'folder',
      tone: index % 2 === 0 ? 'sage' : 'neutral',
    }));
  }, [foldersQuery.data]);

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
        // Placeholder for results mode (wire later)
        <></>
      )}
    </Screen>
  );
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.xl,
  },
  emptyText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}));
