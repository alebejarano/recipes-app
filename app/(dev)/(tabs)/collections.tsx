import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo } from 'react'
import { FlatList, Text, View } from 'react-native'

import Button from '@/components/Button'
import CollectionCard from '@/features/collections/components/CollectionCard'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type Recipe = {
  id: string
  title: string
  tags?: string[]
}

// Mock data (replace later)
const MOCK_RECIPES: Recipe[] = [
  { id: '1', title: 'Pasta', tags: ['Dinner'] },
  { id: '2', title: 'Granola Bowl', tags: ['Breakfast'] },
  { id: '3', title: 'Salad', tags: ['Lunch', 'Vegan'] },
  { id: '4', title: 'Brownies', tags: ['Dessert'] },
  { id: '5', title: 'Rice', tags: [] },
  { id: '6', title: 'Soup' },
]

type CollectionItem = {
  key: string
  label: string
  count: number
  kind: 'tag' | 'uncategorized'
}

export default function CollectionsScreen() {
  const collections = useMemo<CollectionItem[]>(() => {
    const map = new Map<string, number>()
    let uncategorized = 0

    for (const recipe of MOCK_RECIPES) {
      const tags = recipe.tags?.filter(Boolean) ?? []

      if (tags.length === 0) {
        uncategorized++
        continue
      }

      for (const tag of tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1)
      }
    }

    const items: CollectionItem[] = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, count]) => ({
        key: label,
        label,
        count,
        kind: 'tag',
      }))

    if (uncategorized > 0) {
      items.push({
        key: 'uncategorized',
        label: 'Uncategorized',
        count: uncategorized,
        kind: 'uncategorized',
      })
    }

    return items
  }, [])

  const hasRecipes = MOCK_RECIPES.length > 0

  if (!hasRecipes) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather
              name="folder"
              size={24}
              color={theme.colors.mutedForeground}
            />
          </View>

          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>
            Add tags to your recipes to organize them automatically.
          </Text>

          <View style={styles.emptyCta}>
            <Button
              size="lg"
              onPress={() => router.push('/(dev)/(tabs)/add-recipe')}
            >
              Add your first recipe
            </Button>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Collections</Text>
        <Text style={styles.subtitle}>
          Recipes are grouped automatically based on tags
        </Text>
      </View>

      <FlatList
        data={collections}
        keyExtractor={item => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <CollectionCard
            label={item.label}
            count={item.count}
            kind={item.kind}
            onPress={() =>
              router.push(`/(dev)/collections/${encodeURIComponent(item.key)}`)
            }
          />
        )}
      />
    </View>
  )
}

const styles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },

  header: {
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },

  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    color: theme.colors.foreground,
  },

  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  grid: {
    paddingBottom: theme.spacing.xl,
  },

  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },

  emptyCta: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
}))
