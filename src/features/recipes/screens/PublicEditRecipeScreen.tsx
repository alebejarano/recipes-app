import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useMemo, useRef } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import { createThemedStyles } from '@/styles/createStyles'

import { useCreateLocalFolder, useLocalFoldersList } from '@/features/folders/hooks/useLocalFolders'
import RecipeForm, {
  type RecipeFormHandle,
  type RecipeFormSubmitValues,
  type RecipeFormValues,
} from '@/features/recipes/components/RecipeForm'
import { useLocalRecipe, useUpdateLocalRecipe } from '@/features/recipes/hooks/useLocalRecipes'
import { useTranslation } from '@/localization'
import type { RecipeMealTime } from '@/features/recipes/types/mealTimes'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'

const FOOTER_HEIGHT = 72

function buildInitialValues(recipe: {
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
  mealTimes?: RecipeMealTime[]
}): RecipeFormValues {
  return {
    title: recipe.title ?? '',
    subtitle: recipe.subtitle ?? '',
    description: recipe.description ?? '',
    emoji: recipe.emoji ?? '',
    imageUrl: recipe.imageUrl ?? '',
    prepTimeMinutes:
      recipe.prepTimeMinutes !== null && recipe.prepTimeMinutes !== undefined
        ? String(recipe.prepTimeMinutes)
        : '',
    cookTimeMinutes:
      recipe.cookTimeMinutes !== null && recipe.cookTimeMinutes !== undefined
        ? String(recipe.cookTimeMinutes)
        : '',
    servings:
      recipe.servings !== null && recipe.servings !== undefined
        ? String(recipe.servings)
        : '',
    ingredientsText: recipe.ingredients?.map((item) => item.name).filter(Boolean).join('\n') ?? '',
    steps: recipe.steps?.length ? recipe.steps : [''],
    folders: recipe.folders?.map((folder) => folder.name) ?? [],
    mealTimes: recipe.mealTimes ?? [],
  }
}

export default function PublicEditRecipeScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id?: string; returnTo?: string }>()
  const recipeId = id ?? ''
  const insets = useSafeAreaInsets()
  const showSnackbar = useTransientSnackbarStore((state) => state.show)

  const { data: recipe, isLoading, isError } = useLocalRecipe(recipeId)
  const updateMutation = useUpdateLocalRecipe(recipeId)
  const foldersQuery = useLocalFoldersList()
  const createFolderMutation = useCreateLocalFolder()
  const formRef = useRef<RecipeFormHandle>(null)

  const handleBack = useCallback(() => {
    if (updateMutation.isPending) return
    router.back()
  }, [updateMutation.isPending])

  const handleSubmit = useCallback(
    async (values: RecipeFormSubmitValues) => {
      try {
        await updateMutation.mutateAsync(values)
        showSnackbar(t('recipes.manage.saved'))
        router.back()
      } catch (e: any) {
        Alert.alert(t('recipes.manage.saveFailed'), getUserFacingErrorMessage(e))
      }
    },
    [showSnackbar, t, updateMutation]
  )

  const triggerSave = useCallback(() => {
    if (updateMutation.isPending) return
    formRef.current?.submit()
  }, [updateMutation.isPending])

  const keyboardVerticalOffset = Platform.select({
    ios: insets.top + 44,
    android: 0,
  })

  const initialValues = useMemo(
    () => (recipe ? buildInitialValues(recipe) : null),
    [recipe]
  )
  const folderSuggestions = useMemo(
    () =>
      (foldersQuery.data ?? []).map((folder) => ({
        label: folder.name,
        emoji: folder.emoji,
      })),
    [foldersQuery.data]
  )
  const handleCreateFolder = useCallback(
    async (input: { name: string; emoji?: string | null }) => {
      const folderCount = foldersQuery.data?.length ?? 0
      await createFolderMutation.mutateAsync(input)
      if (folderCount >= 2) {
        Alert.alert(
          t('collections.folderPrompt.title'),
          t('collections.folderPrompt.body'),
          [
            { text: t('collections.folderPrompt.notNow'), style: 'cancel' },
            { text: t('collections.folderPrompt.createAccount'), onPress: () => router.push('/(public)/get-started') },
          ]
        )
      }
    },
    [createFolderMutation, foldersQuery.data, t]
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>{t('recipes.detail.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !recipe || !initialValues) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>{t('recipes.detail.loadFailed')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleBack}
            style={styles.backButton}
            icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
            disabled={updateMutation.isPending}
          >
            {t('recipes.manage.back')}
          </Button>
        </View>

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <ScrollView
            style={styles.flex1}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + FOOTER_HEIGHT + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
          >
            <View style={styles.header}>
              <Text style={styles.title}>{t('recipes.manage.editTitle')}</Text>
              <Text style={styles.subtitle}>{t('recipes.manage.editSubtitle')}</Text>
            </View>

            <RecipeForm
              ref={formRef}
              mode="edit"
              initialValues={initialValues}
              submitLabel={t('recipes.manage.saveChanges')}
              isSubmitting={updateMutation.isPending}
              onSubmit={handleSubmit}
              showActions={false}
              suggestedFolders={folderSuggestions}
              onCreateFolder={handleCreateFolder}
              imageUploadMode="local"
            />

            {updateMutation.isError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>
                  {getUserFacingErrorMessage(updateMutation.error, t('recipes.manage.saveFailed'))}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <Button
              variant="secondary"
              size="md"
              onPress={handleBack}
              disabled={updateMutation.isPending}
              style={styles.footerButton}
            >
              {t('recipes.manage.cancel')}
            </Button>

            <Button
              variant="primary"
              size="md"
              onPress={triggerSave}
              loading={updateMutation.isPending}
              disabled={updateMutation.isPending}
              style={styles.footerButton}
            >
              {t('recipes.manage.saveChanges')}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex1: { flex: 1 },

  topBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },

  backButton: {
    minHeight: 44,
    paddingHorizontal: theme.spacing.sm,
    alignSelf: 'flex-start',
    marginLeft: -theme.spacing.sm,
  },
  backIcon: { color: theme.colors.mutedForeground, fontSize: theme.fontSize.lg, },

  scrollContent: { paddingHorizontal: theme.spacing.lg },

  header: { marginBottom: theme.spacing.lg },
  title: {
    ...theme.textVariants.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },

  footer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  footerButton: { flex: 1 },

  errorBanner: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  errorText: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.mutedForeground,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
  },
}))
