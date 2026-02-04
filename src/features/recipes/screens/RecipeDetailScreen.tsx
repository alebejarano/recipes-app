// src/features/recipes/screens/RecipeDetailScreen.tsx

import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams, useSegments } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { createThemedStyles } from '@/styles/createStyles'

import { useDeleteRecipe } from '@/features/recipes/hooks/useDeleteRecipe'
import { useRecipe } from '@/features/recipes/hooks/useRecipe'
import { useRecipePdfAttachments } from '@/features/recipes/hooks/useRecipePdfAttachments'
import { getSafeReturnTo } from '@/lib/navigation'

const FALLBACK_FOLDERS: string[] = []

type RecipeDetailScreenProps = {
  recipeId: string
}

function buildIngredientLines(ingredients: { name: string }[] | undefined): string[] {
  if (!ingredients || ingredients.length === 0) return []
  return ingredients.map((item) => item.name).filter(Boolean)
}


export default function RecipeDetailScreen({ recipeId }: RecipeDetailScreenProps) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const returnToParam = typeof safeReturnTo === 'string' ? safeReturnTo : undefined
  const segments = useSegments()
  const deleteMutation = useDeleteRecipe()
  const { data: recipe, isLoading, isError, error } = useRecipe(recipeId)
  const pdfAttachmentsQuery = useRecipePdfAttachments(recipeId)

  const ingredientLines = useMemo(
    () => buildIngredientLines(recipe?.ingredients),
    [recipe?.ingredients]
  )

  const folders = useMemo(
    () => recipe?.folders?.map((folder) => folder.name) ?? FALLBACK_FOLDERS,
    [recipe?.folders]
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

  const openPdf = useCallback(async (uri: string) => {
    try {
      await Linking.openURL(uri)
    } catch {
      Alert.alert('Unable to open PDF', 'Please try again.')
    }
  }, [])

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
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel="Save recipe"
              style={styles.iconButton}
            >
              <Feather name="heart" size={18} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {}}
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
                  resizeMode="cover"
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PDFs</Text>
          <View style={styles.card}>
            {pdfAttachmentsQuery.data?.length ? (
              pdfAttachmentsQuery.data.map((attachment) => (
                <TouchableOpacity
                  key={attachment.id}
                  style={styles.attachmentRow}
                  onPress={() => openPdf(attachment.fileUri)}
                >
                  <View style={styles.attachmentInfo}>
                    <Feather name="file-text" size={16} style={styles.attachmentIcon} />
                    <View style={styles.attachmentTextWrap}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {attachment.fileName}
                      </Text>
                      <Text style={styles.attachmentMeta}>
                        {(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </Text>
                    </View>
                  </View>
                  <Feather name="external-link" size={16} style={styles.attachmentIcon} />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No PDFs attached.</Text>
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
  sectionTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  attachmentIcon: {
    color: theme.colors.mutedForeground,
  },
  attachmentTextWrap: {
    flex: 1,
  },
  attachmentName: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  attachmentMeta: {
    marginTop: 2,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  noteText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}))
