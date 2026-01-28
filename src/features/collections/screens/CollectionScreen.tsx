// app/(dev)/(tabs)/collections.tsx (or wherever CollectionsScreen lives)

import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'

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

import type { CollectionItem, SegmentKey } from '@/features/collections/types'
import {
  buildCollectionsForSegment,
  getCollectionsHelperText,
  pickVariant,
} from '@/features/collections/utils/collections'
import { useRecipesList } from '@/features/recipes/hooks/useRecipesList'
import { getSafeReturnTo } from '@/lib/navigation'

export default function CollectionsScreen() {
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: SegmentKey }>()
  const [segment, setSegment] = useState<SegmentKey>('recipes')
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)
  const recipesQuery = useRecipesList({ limit: 200 })
  const returnTo = getSafeReturnTo('/(auth)/(tabs)/collections?segment=recipes')
  const returnToParam = typeof returnTo === 'string' ? returnTo : undefined

  useEffect(() => {
    if (segmentParam === 'notes' || segmentParam === 'recipes' || segmentParam === 'shopping') {
      setSegment(segmentParam)
    }
  }, [segmentParam])

  const collections = useMemo<CollectionItem[]>(
    () => buildCollectionsForSegment(segment, recipesQuery.data ?? []),
    [segment, recipesQuery.data]
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

          {recipesQuery.isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={styles.loadingText.color} />
              <Text style={styles.loadingText}>Loading recipes…</Text>
            </View>
          ) : (recipesQuery.data ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="folder" size={22} color={theme.colors.mutedForeground} />
              </View>
              <Text style={styles.emptyTitle}>No recipes yet</Text>
              <Text style={styles.emptyBody}>
                Add a recipe to start building collections by tag.
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/(tabs)/add-recipe')}
                style={styles.emptyCta}
                accessibilityRole="button"
                accessibilityLabel="Create your first recipe"
              >
                <Feather name="plus" size={18} color={theme.colors.primaryForeground} />
                <Text style={styles.emptyCtaText}>Create your first recipe</Text>
              </Pressable>
            </View>
          ) : (
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
                      if (item.label === 'Uncategorized') {
                        router.push({
                          pathname: '/(auth)/collections/[key]',
                          params: {
                            key: 'uncategorized',
                            returnTo: returnToParam,
                          },
                        })
                        return
                      }

                      router.push({
                        pathname: '/(auth)/collections/[key]',
                        params: {
                          key: encodeURIComponent(item.label),
                          returnTo: returnToParam,
                        },
                      })
                    }}
                  />
                )
              }}
            />
          )}
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  emptyState: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  emptyBody: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCta: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.sage,
  },
  emptyCtaText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.primaryForeground,
  },

  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
}))
