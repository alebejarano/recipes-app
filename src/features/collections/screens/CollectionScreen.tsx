// app/(dev)/(tabs)/collections.tsx (or wherever CollectionsScreen lives)

import { Feather } from '@expo/vector-icons'
import React, { useMemo, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'

import Screen from '@/components/Screen'
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

import CollectionTile from '@/features/collections/components/CollectionTile'
import NewCollectionTile from '@/features/collections/components/NewCollectionTile'
import SegmentedTabs from '@/features/collections/components/SegmentedTabs'

// NEW: segment pages
import NotesSegment from '@/features/collections/components/NotesSegment'
import ShoppingSegment from '@/features/collections/components/ShoppingSegment'

import type { CollectionItem, Recipe, SegmentKey } from '@/features/collections/types'
import {
  buildCollectionsForSegment,
  getCollectionsHelperText,
  pickVariant,
} from '@/features/collections/utils/collections'

const MOCK_RECIPES: Recipe[] = [
  { id: '1', title: 'Pasta', tags: ['Dinner'] },
  { id: '2', title: 'Granola Bowl', tags: ['Breakfast'] },
  { id: '3', title: 'Salad', tags: ['Lunch', 'Vegan'] },
  { id: '4', title: 'Brownies', tags: ['Dessert'] },
  { id: '5', title: 'Rice', tags: ['Quick Meals'] },
  { id: '6', title: 'Soup', tags: ['Quick Meals'] },
  { id: '7', title: 'Oats', tags: ['Breakfast'] },
  { id: '8', title: 'Buddha bowl', tags: ['Vegan'] },
]

export default function CollectionsScreen() {
  const [segment, setSegment] = useState<SegmentKey>('recipes')
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)

  const collections = useMemo<CollectionItem[]>(
    () => buildCollectionsForSegment(segment, MOCK_RECIPES),
    [segment]
  )

  const onPressFab = () => {
    // TODO: open create collection / add recipe flow
  }

  return (
    <Screen scroll={false} contentStyle={styles.screenContent}>
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

      {/* Segment content */}
      {segment === 'recipes' ? (
        <>
          <Text style={styles.helperText}>{getCollectionsHelperText(segment)}</Text>

          <FlatList
            data={collections}
            keyExtractor={(item) => item.key}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={[styles.grid, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              if (item.kind === 'new') return <NewCollectionTile onPress={() => {}} />

              return (
                <CollectionTile
                  label={item.label}
                  count={item.count}
                  variant={pickVariant(item.label, index)}
                  onPress={() => {
                    // TODO: router.push(`/(tabs)/collections/${encodeURIComponent(item.key)}`)
                  }}
                />
              )
            }}
          />
        </>
      ) : segment === 'notes' ? (
        <NotesSegment bottomPadding={bottomPadding} />
      ) : (
        <ShoppingSegment bottomPadding={bottomPadding} />
      )}
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  screenContent: { flex: 1 },

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
    ...theme.shadows.soft,
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
    paddingTop: 0,
  },

  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
}))
