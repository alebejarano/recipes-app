import React, { useMemo, useState } from 'react';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import BrowseCategorySection from '@/features/search/components/BrowseCategorySection';
import RecentSection from '@/features/search/components/RecentSection';
import SearchBar from '@/features/search/components/SearchBar';
import SearchFilterPills from '@/features/search/components/SearchFilterPills';
import SearchHeader from '@/features/search/components/SearchHeader';
import TrendingSection from '@/features/search/components/TrendingSection';

import {
  BROWSE_CATEGORIES,
  RECENT_SEARCHES,
  SEARCH_FILTERS,
  TRENDING_NOW,
  type SearchFilterId,
} from '@/features/search/data/searchMockData';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterId>('all');

  // Local state for now (later: persist it)
  const [recents, setRecents] = useState<string[]>(RECENT_SEARCHES);

  const placeholder = useMemo(() => {
    switch (activeFilter) {
      case 'recipes':
        return 'Search recipes...';
      case 'collections':
        return 'Search collections...';
      case 'notes':
        return 'Search notes...';
      default:
        return 'Search anything...';
    }
  }, [activeFilter]);

  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl);
  const isBrowsing = query.trim().length === 0;

  const handlePickRecent = (value: string) => setQuery(value);
  const handleClearRecents = () => setRecents([]);

  return (
    <Screen
      scroll
      bottomPadding={bottomPadding}
      contentStyle={styles.content}
    >
      <SearchHeader
        title="Search"
        subtitle="Find recipes, collections, and notes in one place."
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
          <BrowseCategorySection
            title="Browse by category"
            items={BROWSE_CATEGORIES}
            onPressItem={(id) => {
              // later: route/filter by category
              // optionally: setQuery(id)
              // setQuery(id);
            }}
          />

          <TrendingSection
            title="Trending now"
            items={TRENDING_NOW}
            onPressItem={(id) => {
              // later: set query or navigate
            }}
          />

          <RecentSection
            items={recents}
            onPick={handlePickRecent}
            onClearAll={handleClearRecents}
          />
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
}));
