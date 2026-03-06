// src/features/recipes/screens/RecipeDetailScreen.tsx

import { Feather, Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams, useSegments } from 'expo-router'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { createThemedStyles } from '@/styles/createStyles'

import { useStrategyCreateFolder, useStrategyFoldersList } from '@/features/folders/hooks/useStrategyFolders'
import { useAuth } from '@/features/auth/context/AuthContext'
import IngredientImportSheet from '@/features/recipes/components/IngredientImportSheet'
import KitchenAlmostFullCard from '@/features/recipes/components/KitchenAlmostFullCard'
import type { RecipeFormSubmitValues } from '@/features/recipes/components/RecipeForm'
import {
  useStrategyDeleteRecipe,
  useStrategyRecipe,
  useStrategyRecipesList,
  useStrategyUpdateRecipe,
} from '@/features/recipes/hooks/useStrategyRecipes'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'
import { KITCHEN_ALMOST_FULL_RECIPE_DISMISS_UNTIL_PREFIX } from '@/features/subscription/constants/reminderKeys'
import {
  hasShownKitchenCapacityReminderInSession,
  markKitchenCapacityReminderShownInSession,
} from '@/features/subscription/dev/reminderSession'
import { useLimitQaOverrides } from '@/features/subscription/dev/limitQaOverrides'
import { buildFreePlanUsageSnapshot } from '@/features/subscription/utils/planUsage'
import { buildRecipeShareText, shareRecipeAsTextFile } from '@/features/recipes/utils/shareRecipe'
import { useShoppingListStore } from '@/features/shopping-list/store/useShoppingListStore'
import { getSafeReturnTo } from '@/lib/navigation'

const FALLBACK_FOLDERS: string[] = []
const FAVORITES_FOLDER_NAME = 'Favorites'

type RecipeDetailScreenProps = {
  recipeId: string
}

type FavoriteToggleRecipe = {
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  imageUrl: string | null
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null
  ingredients: { name: string }[]
  steps: string[]
  folders: { name: string }[]
}

function isFavoritesFolder(name: string) {
  return name.trim().toLowerCase() === FAVORITES_FOLDER_NAME.toLowerCase()
}

function buildFavoriteTogglePayload(
  recipe: FavoriteToggleRecipe,
  nextFolderNames: string[]
): RecipeFormSubmitValues {
  return {
    title: recipe.title,
    subtitle: recipe.subtitle ?? null,
    description: recipe.description ?? null,
    emoji: recipe.emoji ?? null,
    imageUrl: recipe.imageUrl ?? null,
    prepTimeMinutes: recipe.prepTimeMinutes ?? null,
    cookTimeMinutes: recipe.cookTimeMinutes ?? null,
    servings: recipe.servings ?? null,
    ingredients: recipe.ingredients.map((item) => item.name).filter(Boolean),
    steps: recipe.steps.filter(Boolean),
    folders: nextFolderNames.length ? nextFolderNames : null,
  }
}

function buildIngredientLines(ingredients: { name: string }[] | undefined): string[] {
  if (!ingredients || ingredients.length === 0) return []
  return ingredients.map((item) => item.name).filter(Boolean)
}


export default function RecipeDetailScreen({ recipeId }: RecipeDetailScreenProps) {
  const [isIngredientImportOpen, setIsIngredientImportOpen] = useState(false)
  const [isImportingIngredients, setIsImportingIngredients] = useState(false)
  const [shouldShowCapacityReminder, setShouldShowCapacityReminder] = useState(false)
  const { user } = useAuth()

  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const returnToParam = typeof safeReturnTo === 'string' ? safeReturnTo : undefined
  const segments = useSegments()
  const { plan } = useContext(SubscriptionContext)
  const routeMode = segments[0] === '(dev)' ? 'dev' : segments[0] === '(public)' ? 'public' : 'auth'
  const isDevMode = routeMode === 'dev'
  const { overrides } = useLimitQaOverrides()
  const deleteMutation = useStrategyDeleteRecipe(routeMode)
  const updateMutation = useStrategyUpdateRecipe(recipeId, routeMode)
  const recipesListQuery = useStrategyRecipesList({ limit: 2000 }, routeMode)
  const foldersQuery = useStrategyFoldersList(routeMode)
  const createFolderMutation = useStrategyCreateFolder(routeMode)
  const recipeQuery = useStrategyRecipe(recipeId, routeMode)
  const recipe = recipeQuery.data
  const isLoading = recipeQuery.isLoading
  const isError = recipeQuery.isError
  const error = recipeQuery.error

  const ingredientLines = useMemo(
    () => buildIngredientLines(recipe?.ingredients),
    [recipe?.ingredients]
  )
  const recipesCount = recipesListQuery.data?.length ?? 0
  const usageSnapshot = useMemo(
    () => buildFreePlanUsageSnapshot(recipesCount, 0),
    [recipesCount]
  )
  const effectiveRecipeUsageBand =
    isDevMode && overrides.recipeUsageBandOverride ? overrides.recipeUsageBandOverride : usageSnapshot.recipesUsageBand
  const shouldOfferRecipeReminder =
    plan !== 'premium' && effectiveRecipeUsageBand === 'between95and99'
  const recipesLeft = Math.max(FREE_PLAN_MAX_RECIPES - recipesCount, 0)
  const bulkAdd = useShoppingListStore((s) => s.bulkAdd)

  const folders = useMemo(
    () => recipe?.folders?.map((folder) => folder.name) ?? FALLBACK_FOLDERS,
    [recipe?.folders]
  )
  const isFavorited = useMemo(
    () => (recipe?.folders ?? []).some((folder) => isFavoritesFolder(folder.name)),
    [recipe?.folders]
  )
  const favoritesFolderExists = useMemo(
    () => (foldersQuery.data ?? []).some((folder) => isFavoritesFolder(folder.name)),
    [foldersQuery.data]
  )

  const { editPath, detailPath } = useMemo(() => {
    const root = segments[0]
    if (root === '(dev)' || root === '(auth)') {
      return {
        editPath: `/${root}/recipes/[id]/edit`,
        detailPath: `/${root}/recipes/${recipeId}`,
      }
    }
    return {
      editPath: '/(auth)/recipes/[id]/edit',
      detailPath: `/(auth)/recipes/${recipeId}`,
    }
  }, [recipeId, segments])

  const collectionsPath = useMemo(() => {
    const root = segments[0]
    if (root === '(dev)' || root === '(public)' || root === '(auth)') {
      return `/${root}/(tabs)/collections?segment=recipes`
    }
    return '/(auth)/(tabs)/collections?segment=recipes'
  }, [segments])

  const manageRecipesPath = useMemo(() => {
    const root = segments[0]
    if (root === '(dev)' || root === '(public)' || root === '(auth)') {
      return `/${root}/recipes/manage`
    }
    return '/(auth)/recipes/manage'
  }, [segments])

  const premiumPath = useMemo(() => {
    const root = segments[0]
    if (root === '(dev)' || root === '(public)' || root === '(auth)') {
      return `/${root}/premium`
    }
    return '/(auth)/premium'
  }, [segments])

  useEffect(() => {
    if (!shouldOfferRecipeReminder) return
    if (hasShownKitchenCapacityReminderInSession()) return

    let isCancelled = false
    const userKey = `${routeMode}:${user?.id ?? 'guest'}`

    async function maybeShowCard() {
      const recipeKey = `${KITCHEN_ALMOST_FULL_RECIPE_DISMISS_UNTIL_PREFIX}${userKey}`
      try {
        const rawRecipeDismissUntil = await AsyncStorage.getItem(recipeKey)
        if (isCancelled) return
        const recipeDismissUntil = Number(rawRecipeDismissUntil ?? 0)
        const now = Date.now()

        if (shouldOfferRecipeReminder) {
          const isRecipeSuppressed = Number.isFinite(recipeDismissUntil) && recipeDismissUntil > now
          if (!isRecipeSuppressed) {
            markKitchenCapacityReminderShownInSession()
            setShouldShowCapacityReminder(true)
          }
        }
      } catch {
        if (isCancelled) return
        if (shouldOfferRecipeReminder) {
          markKitchenCapacityReminderShownInSession()
          setShouldShowCapacityReminder(true)
        }
      }
    }

    void maybeShowCard()

    return () => {
      isCancelled = true
    }
  }, [routeMode, shouldOfferRecipeReminder, user?.id])

  const dismissKitchenCapacityReminder = async () => {
    setShouldShowCapacityReminder(false)
    markKitchenCapacityReminderShownInSession()

    const dismissUntil = Date.now() + 24 * 60 * 60 * 1000
    const userKey = `${routeMode}:${user?.id ?? 'guest'}`
    const recipeKey = `${KITCHEN_ALMOST_FULL_RECIPE_DISMISS_UNTIL_PREFIX}${userKey}`

    try {
      await AsyncStorage.setItem(recipeKey, String(dismissUntil))
    } catch {
      // No-op: in-memory session suppression still avoids repeated prompts.
    }
  }

  const handleEdit = () => {
    router.push({
      pathname: editPath as any,
      params: { id: recipeId, returnTo: returnToParam ?? detailPath },
    })
  }

  const handleMore = () => {
    Alert.alert('Recipe actions', undefined, [
      { text: 'Edit recipe', onPress: handleEdit },
      {
        text: 'Delete recipe',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete recipe?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteMutation.mutateAsync(recipeId)
                  if (safeReturnTo) {
                    router.replace(safeReturnTo)
                  } else {
                    router.back()
                  }
                } catch (error: any) {
                  Alert.alert('Delete failed', error?.message ?? 'Please try again.')
                }
              },
            },
          ])
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleShareAsFile = async () => {
    if (!recipe) return
    try {
      await shareRecipeAsTextFile({
        title: recipe.title,
        subtitle: recipe.subtitle,
        description: recipe.description,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        folders: recipe.folders,
      })
    } catch (shareError: any) {
      Alert.alert('Share failed', shareError?.message ?? 'Unable to share this recipe right now.')
    }
  }

  const handleShareAsText = async () => {
    if (!recipe) return
    try {
      await Share.share({
        title: recipe.title,
        message: buildRecipeShareText({
          title: recipe.title,
          subtitle: recipe.subtitle,
          description: recipe.description,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          servings: recipe.servings,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          folders: recipe.folders,
        }),
      })
    } catch (shareError: any) {
      Alert.alert('Share failed', shareError?.message ?? 'Unable to share this recipe right now.')
    }
  }

  const handleShare = () => {
    Alert.alert('Share recipe', 'Choose how you want to share.', [
      { text: 'Share as text', onPress: () => { void handleShareAsText() } },
      { text: 'Share as file', onPress: () => { void handleShareAsFile() } },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleToggleFavorite = async () => {
    if (!recipe) return
    const currentFolderNames = (recipe.folders ?? []).map((folder) => folder.name.trim()).filter(Boolean)
    const withoutFavorites = currentFolderNames.filter((name) => !isFavoritesFolder(name))
    const nextFolderNames = isFavorited
      ? withoutFavorites
      : [...withoutFavorites, FAVORITES_FOLDER_NAME]

    try {
      if (!isFavorited && !favoritesFolderExists) {
        try {
          await createFolderMutation.mutateAsync({
            name: FAVORITES_FOLDER_NAME,
            emoji: '❤️',
          })
        } catch (folderError: any) {
          const code = folderError?.code ?? folderError?.cause?.code
          if (code !== '23505') throw folderError
        }
      }
      await updateMutation.mutateAsync(
        buildFavoriteTogglePayload(recipe, nextFolderNames)
      )
    } catch (favoriteError: any) {
      Alert.alert(
        'Unable to update favorites',
        favoriteError?.message ?? 'Please try again.'
      )
    }
  }

  const importIngredients = async (names: string[]) => {
    if (names.length === 0) {
      Alert.alert('No ingredients', 'This recipe has no ingredients to add.')
      return
    }

    try {
      setIsImportingIngredients(true)
      const { added, skipped } = await bulkAdd(names)
      setIsIngredientImportOpen(false)

      if (added === 0) {
        Alert.alert('Shopping list unchanged', 'All selected ingredients are already in your list.')
        return
      }

      if (skipped > 0) {
        Alert.alert('Ingredients added', `${added} added, ${skipped} already on your list.`)
        return
      }

      Alert.alert(
        'Ingredients added',
        `${added} ingredient${added === 1 ? '' : 's'} added to your shopping list.`
      )
    } catch (importError: any) {
      Alert.alert(
        'Unable to add ingredients',
        importError?.message ?? 'Please try again.'
      )
    } finally {
      setIsImportingIngredients(false)
    }
  }


  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading recipe…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !recipe) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Unable to load this recipe.</Text>
          {error ? (
            <Text style={styles.errorText}>
              {error instanceof Error ? error.message : String(error)}
            </Text>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              if (safeReturnTo) {
                router.replace(safeReturnTo)
              } else {
                router.back()
              }
            }}
            accessibilityRole="button"
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (safeReturnTo) {
                router.replace(safeReturnTo)
              } else {
                router.back()
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={18} style={styles.icon} />
          </TouchableOpacity>

          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => { void handleToggleFavorite() }}
              accessibilityRole="button"
              accessibilityLabel={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              style={styles.iconButton}
              disabled={updateMutation.isPending || createFolderMutation.isPending}
            >
              <Ionicons
                name={isFavorited ? 'heart' : 'heart-outline'}
                size={22}
                style={[styles.icon, isFavorited ? styles.iconFavorite : undefined]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share recipe"
              style={styles.iconButton}
            >
              <Feather name="share-2" size={18} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMore}
              accessibilityRole="button"
              accessibilityLabel="More actions"
              style={styles.iconButton}
            >
              <Feather name="more-vertical" size={18} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.header}>
          {recipe.imageUrl || recipe.emoji ? (
            <View style={styles.mediaBadge}>
              {recipe.imageUrl ? (
                <Image
                  source={{ uri: recipe.imageUrl }}
                  style={styles.mediaImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  accessibilityLabel="Recipe thumbnail"
                />
              ) : (
                <Text style={styles.mediaEmoji} accessibilityLabel="Recipe emoji">
                  {recipe.emoji}
                </Text>
              )}
            </View>
          ) : null}

          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.title}</Text>
          </View>

          {recipe.subtitle ? <Text style={styles.subtitle}>{recipe.subtitle}</Text> : null}

          {folders.length > 0 ? (
            <View style={styles.tagsRow}>
              {folders.map((folder) => (
                <View key={folder} style={styles.tagPill}>
                  <Text style={styles.tagText}>{folder}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} style={styles.metaIcon} />
              <Text style={styles.metaText}>
                {recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min prep` : 'Prep time'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={14} style={styles.metaIcon} />
              <Text style={styles.metaText}>
                {recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min cook` : 'Cook time'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="users" size={14} style={styles.metaIcon} />
              <Text style={styles.metaText}>
                {recipe.servings ? `${recipe.servings} servings` : 'Servings'}
              </Text>
            </View>
          </View>
        </View>

        {shouldShowCapacityReminder ? (
          <KitchenAlmostFullCard
            title="Your kitchen is almost full"
            line1={`${recipesLeft} recipes left on Free.`}
            line2="Premium keeps everything backed up & synced."
            onSeePremium={() => router.push(premiumPath as any)}
            onManageRecipes={() =>
              router.push({
                pathname: manageRecipesPath as any,
                params: { returnTo: collectionsPath },
              })
            }
            onDismiss={() => {
              void dismissKitchenCapacityReminder()
            }}
          />
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <TouchableOpacity
              onPress={() => setIsIngredientImportOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add ingredients to shopping list"
              style={styles.sectionActionButton}
            >
              <MaterialIcons
                name="add-shopping-cart"
                size={16}
                style={styles.sectionActionIcon}
              />
              <Text style={styles.sectionActionText}>Add to shopping list</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {ingredientLines.length > 0 ? (
              ingredientLines.map((line, index) => (
                <View key={`${line}-${index}`} style={styles.ingredientRow}>
                  <Text style={styles.ingredientText}>{line}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No ingredients listed.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <View style={styles.stepsBlock}>
            {recipe.steps.length > 0 ? (
              recipe.steps.map((step, index) => {
                const stepNumber = `${index + 1}`
                return (
                  <View key={`${step}-${index}`} style={styles.stepRow}>
                    <View style={styles.stepBadge}>
                      <Text style={styles.stepBadgeText}>{stepNumber}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                )
              })
            ) : (
              <Text style={styles.emptyText}>No instructions yet.</Text>
            )}
          </View>
        </View>

        {recipe.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.noteText}>{recipe.description}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <IngredientImportSheet
        visible={isIngredientImportOpen}
        ingredients={ingredientLines}
        isSubmitting={isImportingIngredients}
        onClose={() => setIsIngredientImportOpen(false)}
        onAddAll={() => { void importIngredients(ingredientLines) }}
        onAddSelected={(selectedIngredients) => { void importIngredients(selectedIngredients) }}
      />
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  errorText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  topActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  icon: {
    color: theme.colors.mutedForeground,
  },
  iconFavorite: {
    color: theme.colors.accent,
  },
  header: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  mediaBadge: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaEmoji: {
    fontSize: 50,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  tagPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.secondary,
  },
  tagText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaIcon: {
    color: theme.colors.mutedForeground,
  },
  metaText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  section: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  sectionActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionActionIcon: {
    color: theme.colors.primaryDark,
  },
  sectionActionText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  ingredientText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  stepsBlock: {
    gap: theme.spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  stepBadgeText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primaryDark,
  },
  stepText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  emptyText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  noteText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}))
