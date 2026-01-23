//This file is the CollectionDetailScreen
import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { FlatList, Text, View } from 'react-native'

import Button from '@/components/Button'
import RecipeRow from '@/features/recipes/components/RecipeRow'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type Recipe = {
  id: string
  title: string
  tags?: string[]
}

// Temporary mock data (replace with your store later)
const MOCK_RECIPES: Recipe[] = [
  { id: '1', title: 'Pasta', tags: ['Dinner'] },
  { id: '2', title: 'Granola Bowl', tags: ['Breakfast'] },
  { id: '3', title: 'Salad', tags: ['Lunch', 'Vegan'] },
  { id: '4', title: 'Brownies', tags: ['Dessert'] },
  { id: '5', title: 'Rice', tags: [] },
  { id: '6', title: 'Soup' },
]

function isUncategorizedKey(key: string) {
  return key === 'uncategorized'
}

function decodeKey(key: string) {
  // Router params are strings; keep it robust.
  try {
    return decodeURIComponent(key)
  } catch {
    return key
  }
}

export default function CollectionDetailScreen() {
  const params = useLocalSearchParams<{ key?: string }>()
  const rawKey = params.key ?? ''
  const key = decodeKey(Array.isArray(rawKey) ? rawKey[0] : rawKey)

  const isUncategorized = isUncategorizedKey(key)
  const title = isUncategorized ? 'Uncategorized' : key

  const recipes = useMemo(() => {
    if (isUncategorized) {
      return MOCK_RECIPES.filter(r => (r.tags?.length ?? 0) === 0)
    }

    return MOCK_RECIPES.filter(r => (r.tags ?? []).includes(title))
  }, [isUncategorized, title])

  const subtitle = `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          variant="ghost"
          size="md"
          onPress={() => router.back()}
          style={styles.backButton}
          textStyle={styles.backText}
          icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
        >
          Back
        </Button>

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather
              name={isUncategorized ? 'inbox' : 'folder'}
              size={24}
              color={theme.colors.mutedForeground}
            />
          </View>

          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptySubtitle}>
            {isUncategorized
              ? 'Recipes without tags appear here.'
              : 'Add this tag to a recipe to see it here.'}
          </Text>

          <View style={styles.emptyCta}>
            <Button size="lg" onPress={() => router.push('/(dev)/(tabs)/add-recipe')}>
              Add a recipe
            </Button>
          </View>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RecipeRow
              title={item.title}
              tags={item.tags}
              onPress={() => {
                // Later: navigate to recipe detail
                // router.push(`/recipe/${item.id}`)
              }}
            />
          )}
        />
      )}
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
  },

  backButton: {
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },

  backText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },

  backIcon: {
    color: theme.colors.mutedForeground,
  },

  titleBlock: {
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

  list: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
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

  emptyTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.foreground,
  },

  emptySubtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  emptyCta: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
}))
