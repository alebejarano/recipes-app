import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import CollectionTile from '@/features/collections/components/CollectionTile';
import NewCollectionTile from '@/features/collections/components/NewCollectionTile';
import SegmentedTabs from '@/features/collections/components/SegmentedTabs';

import type { CollectionItem, Recipe, SegmentKey } from '@/features/collections/types';
import {
    buildCollectionsForSegment,
    getCollectionsHelperText,
    pickVariant,
} from '@/features/collections/utils/collections';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';

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
    const insets = useSafeAreaInsets();

    const bottomPadding = useTabBarBottomPadding(theme.spacing.xl);
    const [segment, setSegment] = useState<SegmentKey>('recipes');

    const collections = useMemo<CollectionItem[]>(
        () => buildCollectionsForSegment(segment, MOCK_RECIPES),
        [segment]
    );

    const onPressFab = () => {
        // top-right + action
        // later: router.push('/(tabs)/add-recipe') or open modal
    };

    return (
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
            <View style={styles.headerText}>
            <Text style={styles.title}>Collections</Text>
            <Text style={styles.subtitle}>Everything organized in one place</Text>
            </View>

            <Pressable onPress={onPressFab} style={styles.fab} accessibilityRole="button">
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
                    // later: router.push(`/(tabs)/collections/${encodeURIComponent(item.key)}`)
                }}
                />
            );
            }}
        />
        </View>
    );
}

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing['2xl'],
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
    paddingBottom: theme.spacing.xl,
  },

  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
}));
