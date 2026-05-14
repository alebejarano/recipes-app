import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams, useSegments } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Screen from '@/components/Screen'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

import MealTimeChip from '@/features/recipes/components/MealTimeChip'
import { useStrategyDeleteRecipe, useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes'
import { RECIPE_MEAL_TIMES, type RecipeMealTime } from '@/features/recipes/types/mealTimes'
import { getSafeReturnTo } from '@/lib/navigation'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'

type ManageRecipesScreenProps = {
  mode?: 'auth' | 'public' | 'dev'
}

type SortMode = 'oldest' | 'largest'

export default function ManageRecipesScreen({ mode }: ManageRecipesScreenProps) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const segments = useSegments()
  const resolvedMode =
    mode ??
    (segments[0] === '(dev)' ? 'dev' : segments[0] === '(public)' ? 'public' : 'auth')
  const safeReturnTo = getSafeReturnTo(returnTo)
  const fallbackReturnTo =
    resolvedMode === 'dev'
      ? '/(dev)/(tabs)/collections?segment=recipes'
      : resolvedMode === 'public'
        ? '/(public)/(tabs)/collections?segment=recipes'
        : '/(auth)/(tabs)/collections?segment=recipes'
  const managePath =
    resolvedMode === 'dev'
      ? '/(dev)/recipes/manage'
      : resolvedMode === 'public'
        ? '/(public)/recipes/manage'
        : '/(auth)/recipes/manage'

  const insets = useSafeAreaInsets()
  const bottomPadding = insets.bottom + theme.spacing.lg
  const recipesQuery = useStrategyRecipesList({ limit: 200 }, resolvedMode)
  const deleteRecipeMutation = useStrategyDeleteRecipe(resolvedMode)

  const [sortMode, setSortMode] = useState<SortMode>('oldest')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMealTime, setActiveMealTime] = useState<RecipeMealTime | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteSuccessMessage, setBulkDeleteSuccessMessage] = useState<string | null>(null)

  const recipeData = useMemo(() => recipesQuery.data ?? [], [recipesQuery.data])

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return recipeData.filter((recipe) => {
      if (activeMealTime && !(recipe.mealTimes ?? []).includes(activeMealTime)) {
        return false
      }

      if (!normalizedSearch) return true

      const searchableText = [
        recipe.title,
        recipe.subtitle ?? '',
        recipe.description ?? '',
        ...(recipe.folders ?? []).map((folder) => folder.name),
        ...(recipe.mealTimes ?? []),
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedSearch)
    })
  }, [activeMealTime, recipeData, searchQuery])

  const sortedRecipes = useMemo(() => {
    const list = [...filteredRecipes]
    if (sortMode === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      return list
    }
    list.sort((a, b) => {
      const scoreA =
        (a.ingredients?.length ?? 0) * 50 +
        (a.steps?.length ?? 0) * 70 +
        (a.description?.length ?? 0) +
        a.title.length
      const scoreB =
        (b.ingredients?.length ?? 0) * 50 +
        (b.steps?.length ?? 0) * 70 +
        (b.description?.length ?? 0) +
        b.title.length
      return scoreB - scoreA
    })
    return list
  }, [filteredRecipes, sortMode])

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedRecipeIds([])
      return
    }
    const existingIds = new Set(sortedRecipes.map((recipe) => recipe.id))
    setSelectedRecipeIds((current) => current.filter((id) => existingIds.has(id)))
  }, [isSelectionMode, sortedRecipes])

  useEffect(() => {
    if (!bulkDeleteSuccessMessage) return
    const timeout = setTimeout(() => setBulkDeleteSuccessMessage(null), 2600)
    return () => clearTimeout(timeout)
  }, [bulkDeleteSuccessMessage])

  const selectedCount = selectedRecipeIds.length

  const handleBack = () => {
    router.replace((safeReturnTo ?? fallbackReturnTo) as any)
  }

  const openRecipe = (id: string) => {
    if (isBulkDeleting) return
    router.push({
      pathname:
        resolvedMode === 'dev'
          ? '/(dev)/recipes/[id]'
          : resolvedMode === 'public'
            ? '/(public)/recipes/[id]'
            : '/(auth)/recipes/[id]',
      params: { id, returnTo: managePath },
    })
  }

  const toggleSelect = (id: string) => {
    if (isBulkDeleting) return
    setSelectedRecipeIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    )
  }

  const handleSelectAll = () => {
    if (isBulkDeleting) return
    if (selectedCount === sortedRecipes.length) {
      setSelectedRecipeIds([])
      return
    }
    setSelectedRecipeIds(sortedRecipes.map((recipe) => recipe.id))
  }

  const handleCancelSelection = () => {
    if (isBulkDeleting) return
    setSelectedRecipeIds([])
  }

  const handleExitSelectionMode = () => {
    if (isBulkDeleting) return
    setIsSelectionMode(false)
    setSelectedRecipeIds([])
  }

  const handleDelete = () => {
    if (selectedCount === 0 || isBulkDeleting) return
    Alert.alert(
      selectedCount === 1 ? 'Delete recipe?' : `Delete ${selectedCount} recipes?`,
      selectedCount === 1
        ? 'This will permanently remove this recipe from your collection.'
        : `This will permanently remove ${selectedCount} recipes from your collection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: selectedCount === 1 ? 'Delete recipe' : `Delete ${selectedCount} recipes`,
          style: 'destructive',
          onPress: async () => {
            const idsToDelete = [...selectedRecipeIds]
            setIsBulkDeleting(true)
            try {
              const results = await Promise.allSettled(
                idsToDelete.map((id) => deleteRecipeMutation.mutateAsync(id))
              )
              const failedIds = results
                .map((result, index) => ({ result, id: idsToDelete[index] }))
                .filter((entry) => entry.result.status === 'rejected')
                .map((entry) => entry.id)
              const deletedCount = idsToDelete.length - failedIds.length

              if (failedIds.length > 0) {
                setSelectedRecipeIds(failedIds)
                Alert.alert(
                  'Some recipes could not be deleted',
                  `${deletedCount} deleted, ${failedIds.length} failed.`
                )
                return
              }

              setSelectedRecipeIds([])
              if (deletedCount === sortedRecipes.length) {
                setIsSelectionMode(false)
              }
              setBulkDeleteSuccessMessage(
                `${deletedCount} recipe${deletedCount === 1 ? '' : 's'} deleted`
              )
            } finally {
              setIsBulkDeleting(false)
            }
          },
        },
      ]
    )
  }

  return (
    <Screen scroll={false} contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>
            {isSelectionMode
              ? `${selectedCount} recipe${selectedCount === 1 ? '' : 's'} selected`
              : 'Manage recipes'}
          </Text>
        </View>
        <Pressable
          onPress={isSelectionMode ? handleExitSelectionMode : () => setIsSelectionMode(true)}
          style={styles.selectButton}
          accessibilityRole="button"
          accessibilityLabel={isSelectionMode ? 'Exit selection mode' : 'Select recipes'}
          disabled={isBulkDeleting}
        >
          <Text style={styles.selectButtonText}>{isSelectionMode ? 'Done' : 'Select'}</Text>
        </Pressable>
      </View>

      {!isSelectionMode ? (
        <View style={styles.controlsBlock}>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color={styles.searchIcon.color} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search titles, folders, meal times..."
              placeholderTextColor={styles.searchPlaceholder.color}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery ? (
              <Pressable
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={styles.clearSearchButton}
              >
                <Feather name="x" size={14} color={styles.clearSearchIcon.color} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Meal time</Text>
            <View style={styles.filterChipsRow}>
              {RECIPE_MEAL_TIMES.map((mealTime) => (
                <MealTimeChip
                  key={mealTime}
                  mealTime={mealTime}
                  selected={activeMealTime === mealTime}
                  onPress={() =>
                    setActiveMealTime((current) => (current === mealTime ? null : mealTime))
                  }
                />
              ))}
            </View>
          </View>

          <View style={styles.sortRow}>
            <Pressable
              onPress={() => setSortMode('oldest')}
              style={[styles.sortPill, sortMode === 'oldest' && styles.sortPillActive]}
              accessibilityRole="button"
              accessibilityLabel="Sort recipes by oldest"
            >
              <Text style={[styles.sortText, sortMode === 'oldest' && styles.sortTextActive]}>
                Oldest
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSortMode('largest')}
              style={[styles.sortPill, sortMode === 'largest' && styles.sortPillActive]}
              accessibilityRole="button"
              accessibilityLabel="Sort recipes by largest"
            >
              <Text style={[styles.sortText, sortMode === 'largest' && styles.sortTextActive]}>
                Largest
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.listWrap}>
        {recipesQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={styles.loadingText.color} />
            <Text style={styles.loadingText}>Loading recipes…</Text>
          </View>
        ) : recipesQuery.isError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Unable to load recipes</Text>
            <Text style={styles.emptyBody}>
              {getUserFacingErrorMessage(recipesQuery.error)}
            </Text>
          </View>
        ) : sortedRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No recipes to manage</Text>
            <Text style={styles.emptyBody}>Save recipes first, then return here to organize them.</Text>
          </View>
        ) : (
          <FlatList
            data={sortedRecipes}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: bottomPadding },
            ]}
            ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
            renderItem={({ item }) => {
              const isSelected = selectedRecipeIds.includes(item.id)
              const rowMeta =
                sortMode === 'largest'
                  ? `${item.ingredients?.length ?? 0} ingredients · ${item.steps?.length ?? 0} steps`
                  : `Saved ${new Date(item.createdAt).toLocaleDateString()}`

              return (
                <View style={[styles.rowCard, isSelected && styles.rowCardSelected]}>
                  <Pressable
                    onPress={() => (isSelectionMode ? toggleSelect(item.id) : openRecipe(item.id))}
                    style={styles.rowPress}
                    accessibilityRole={isSelectionMode ? 'checkbox' : 'button'}
                    accessibilityState={isSelectionMode ? { checked: isSelected } : undefined}
                    accessibilityLabel={
                      isSelectionMode
                        ? `${isSelected ? 'Deselect' : 'Select'} ${item.title}`
                        : `Open ${item.title}`
                    }
                  >
                    {isSelectionMode ? (
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected ? (
                          <Feather name="check" size={12} color={theme.colors.primaryForeground} />
                        ) : null}
                      </View>
                    ) : null}
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.rowMeta}>{rowMeta}</Text>
                    </View>
                  </Pressable>

                  {!isSelectionMode ? (
                    <Pressable
                      onPress={() => openRecipe(item.id)}
                      style={styles.openButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${item.title}`}
                    >
                      <Text style={styles.openButtonText}>Open</Text>
                    </Pressable>
                  ) : null}
                </View>
              )
            }}
          />
        )}

        {isSelectionMode && selectedCount > 0 ? (
          <View style={styles.bulkBar}>
            <Pressable
              onPress={handleSelectAll}
              style={styles.bulkButton}
              accessibilityRole="button"
              accessibilityLabel={selectedCount === sortedRecipes.length ? 'Deselect all recipes' : 'Select all recipes'}
              disabled={isBulkDeleting}
            >
              <Text style={styles.bulkButtonText}>
                {selectedCount === sortedRecipes.length ? 'Deselect all' : 'Select all'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleCancelSelection}
              style={styles.bulkButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel selection"
              disabled={isBulkDeleting}
            >
              <Text style={styles.bulkButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[styles.bulkButton, styles.bulkDeleteButton]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${selectedCount} selected recipes`}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
              ) : (
                <Text style={styles.bulkDeleteButtonText}>Delete ({selectedCount})</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {bulkDeleteSuccessMessage ? (
          <View
            style={[
              styles.snackbar,
              {
                bottom: insets.bottom + (isSelectionMode && selectedCount > 0 ? theme.spacing['2xl'] : theme.spacing.xs),
              },
            ]}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Feather name="check-circle" size={16} color={styles.snackbarIcon.color} />
            <Text style={styles.snackbarText}>{bulkDeleteSuccessMessage}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  screenContent: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  selectButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
  },
  selectButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.primary,
  },
  sortRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  controlsBlock: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  searchWrap: {
    minHeight: 44,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchIcon: {
    color: theme.colors.mutedForeground,
  },
  searchPlaceholder: {
    color: theme.colors.mutedForeground,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
    paddingVertical: theme.spacing.sm,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
  },
  clearSearchIcon: {
    color: theme.colors.mutedForeground,
  },
  filterSection: {
    gap: theme.spacing.xs,
  },
  filterLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  sortPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
  },
  sortPillActive: {
    backgroundColor: theme.colors.primary,
  },
  sortText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.secondaryForeground,
  },
  sortTextActive: {
    color: theme.colors.primaryForeground,
  },
  listWrap: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  listContent: {
    paddingBottom: theme.spacing.lg,
  },
  rowCard: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.secondary,
  },
  rowPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  checkboxSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  rowMeta: {
    marginTop: theme.spacing.xxs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  openButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  openButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.xs,
    color: theme.colors.secondaryForeground,
  },
  bulkBar: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bulkButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  bulkButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
  bulkDeleteButton: {
    backgroundColor: theme.colors.destructive,
  },
  bulkDeleteButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.primaryForeground,
  },
  snackbar: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  snackbarIcon: {
    color: theme.colors.primary,
  },
  snackbarText: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  emptyBody: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}))
