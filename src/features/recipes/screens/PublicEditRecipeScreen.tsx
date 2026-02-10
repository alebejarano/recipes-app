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
import { createThemedStyles } from '@/styles/createStyles'

import RecipeForm, {
  type RecipeFormHandle,
  type RecipeFormSubmitValues,
  type RecipeFormValues,
} from '@/features/recipes/components/RecipeForm'
import { useCreateLocalFolder, useLocalFoldersList } from '@/features/folders/hooks/useLocalFolders'
import { useLocalRecipe, useUpdateLocalRecipe } from '@/features/recipes/hooks/useLocalRecipes'
import { getSafeReturnTo } from '@/lib/navigation'

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
    ingredients:
      recipe.ingredients?.length
        ? recipe.ingredients.map((item) => item.name).filter(Boolean)
        : [''],
    steps: recipe.steps?.length ? recipe.steps : [''],
    folders: recipe.folders?.map((folder) => folder.name) ?? [],
  }
}

export default function PublicEditRecipeScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>()
  const recipeId = id ?? ''
  const safeReturnTo = getSafeReturnTo(returnTo)
  const insets = useSafeAreaInsets()

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
        if (safeReturnTo) {
          router.replace(safeReturnTo)
        } else {
          router.replace({
            pathname: '/(public)/recipes/[id]',
            params: { id: recipeId },
          })
        }
      } catch (e: any) {
        Alert.alert('Save failed', e?.message ?? 'Please try again.')
      }
    },
    [recipeId, safeReturnTo, updateMutation]
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
          'Keep your folders safe',
          'Create an account to sync and back up your folders.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Create account', onPress: () => router.push('/(public)/get-started') },
          ]
        )
      }
    },
    [createFolderMutation, foldersQuery.data]
  )

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

  if (isError || !recipe || !initialValues) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Unable to load this recipe.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleBack}
            style={styles.backButton}
            textStyle={styles.backText}
            icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
            disabled={updateMutation.isPending}
          >
            Back
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
              <Text style={styles.title}>Edit recipe</Text>
              <Text style={styles.subtitle}>Update any details and save your changes.</Text>
            </View>

            <RecipeForm
              ref={formRef}
              initialValues={initialValues}
              submitLabel="Save changes"
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
                  Unable to save right now. Please try again.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Button
              variant="secondary"
              size="md"
              onPress={handleBack}
              disabled={updateMutation.isPending}
              style={styles.footerButton}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onPress={triggerSave}
              loading={updateMutation.isPending}
              disabled={updateMutation.isPending}
              style={styles.footerButton}
            >
              Save changes
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

  backButton: { paddingHorizontal: 0, alignSelf: 'flex-start' },
  backText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  backIcon: { color: theme.colors.mutedForeground },

  scrollContent: { paddingHorizontal: theme.spacing.lg },

  header: { marginBottom: theme.spacing.lg },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
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
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
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
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
}))
