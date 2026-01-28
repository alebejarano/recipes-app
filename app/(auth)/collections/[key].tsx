//This file is the CollectionDetailScreen
import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'

import Button from '@/components/Button'
import RecipeRow from '@/features/recipes/components/RecipeRow'
import { useRecipesList } from '@/features/recipes/hooks/useRecipesList'
import { getSafeReturnTo } from '@/lib/navigation'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

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
  const params = useLocalSearchParams<{ key?: string; returnTo?: string }>()
  const rawKey = params.key ?? ''
  const key = decodeKey(Array.isArray(rawKey) ? rawKey[0] : rawKey)
  const safeReturnTo = getSafeReturnTo(params.returnTo)

  const isUncategorized = isUncategorizedKey(key)
  const title = isUncategorized ? 'Uncategorized' : key
  const recipesQuery = useRecipesList({ limit: 200 })

  const recipes = useMemo(() => {
    const list = recipesQuery.data ?? []
    if (isUncategorized) {
      return list.filter((r) => (r.tags?.length ?? 0) === 0)
    }

    return list.filter((r) =>
      (r.tags ?? []).map((tag) => tag.trim()).includes(title)
    )
  }, [isUncategorized, title, recipesQuery.data])

  const subtitle = `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          variant="ghost"
          size="md"
          onPress={() => {
            if (safeReturnTo) {
              router.replace(safeReturnTo)
            } else {
              router.back()
            }
          }}
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

      {recipesQuery.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading recipes…</Text>
        </View>
      ) : recipesQuery.isError ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Unable to load recipes.</Text>
        </View>
      ) : recipes.length === 0 ? (
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
            <Button size="lg" onPress={() => router.push('/(auth)/(tabs)/add-recipe')}>
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
                router.push({
                  pathname: '/(auth)/recipes/[id]',
                  params: {
                    id: item.id,
                    returnTo:
                      safeReturnTo ?? '/(auth)/(tabs)/collections?segment=recipes',
                  },
                })
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

  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
}))
