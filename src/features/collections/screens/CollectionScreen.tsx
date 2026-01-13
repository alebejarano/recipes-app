import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import CollectionTile from '@/features/collections/components/CollectionTile';
import NewCollectionTile from '@/features/collections/components/NewCollectionTile';
import SegmentedTabs from '@/features/collections/components/SegmentedTabs';

import type {
  CollectionItem,
  Recipe,
  SegmentKey,
} from '@/features/collections/types';
import {
  buildCollectionsForSegment,
  getCollectionsHelperText,
  pickVariant,
} from '@/features/collections/utils/collections';

const MOCK_RECIPES: Recipe[] = [
  { id: '1', title: 'Pasta', tags: ['Dinner'] },
  { id: '2', title: 'Granola Bowl', tags: ['Breakfast'] },
  { id: '3', title: 'Salad', tags: ['Lunch', 'Vegan'] },
  { id: '4', title: 'Brownies', tags: ['Dessert'] },
  { id: '5', title: 'Rice', tags: ['Quick Meals'] },
  { id: '6', title: 'Soup', tags: ['Quick Meals'] },
  { id: '7', title: 'Oats', tags: ['Breakfast'] },
  { id: '8', title: 'Buddha bowl', tags: ['Vegan'] },
];

export default function CollectionsScreen() {
  const [segment, setSegment] = useState<SegmentKey>('recipes');

  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl);

  const collections = useMemo<CollectionItem[]>(
    () => buildCollectionsForSegment(segment, MOCK_RECIPES),
    [segment]
  );

  const onPressFab = () => {
    // TODO: open create collection / add recipe flow
  };

  return (
    <Screen
      scroll={false}
      // Let Screen handle top + horizontal padding consistently.
      // Only add bottom extra if you want additional padding besides tab bar.
      contentStyle={styles.screenContent}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>Everything organized in one place</Text>
        </View>

        <Pressable
          onPress={onPressFab}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Create collection"
        >
          <Feather name="plus" size={22} color={theme.colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Segmented control */}
      <SegmentedTabs value={segment} onChange={setSegment} />

      {/* Helper text */}
      <Text style={styles.helperText}>{getCollectionsHelperText(segment)}</Text>

      {/* Grid */}
      <FlatList
        data={collections}
        keyExtractor={(item) => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          if (item.kind === 'new') {
            return <NewCollectionTile onPress={() => {}} />;
          }

          return (
            <CollectionTile
              label={item.label}
              count={item.count}
              variant={pickVariant(item.label, index)}
              onPress={() => {
                // TODO: router.push(`/(tabs)/collections/${encodeURIComponent(item.key)}`)
              }}
            />
          );
        }}
      />
    </Screen>
  );
}

const styles = createThemedStyles((theme) => ({
  // Only layout-specific spacing that is NOT safe-area related lives here.
  screenContent: {
    // Screen already provides paddingTop + paddingHorizontal.
    // Keep content flexible.
    flex: 1,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },

  headerText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    color: theme.colors.foreground,
  },

  subtitle: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  fab: {
    width: 54,
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.sage,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  helperText: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    maxWidth: 320,
  },

  grid: {
    // IMPORTANT: FlatList contentContainerStyle is the right place to handle bottom padding.
    // Do not set paddingTop/paddingHorizontal here anymore.
    paddingTop: 0,
  },

  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
}));
