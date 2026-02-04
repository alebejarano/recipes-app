// src/features/recipes/screens/CreateRecipeScreen.tsx

import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useMemo, useRef } from 'react'
import {
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
  createEmptyRecipeFormValues,
  type RecipeFormHandle,
  type RecipeFormSubmitValues,
} from '@/features/recipes/components/RecipeForm'
import { useCreateRecipe } from '@/features/recipes/hooks/useCreateRecipe'
import { useFoldersList } from '@/features/folders/hooks/useFoldersList'
import { addRecipePdfAttachment, type PendingPdfAttachment } from '@/features/recipes/storage/recipePdfStorage'

export type CreateRecipeVariant = 'onboarding' | 'app'

interface CreateRecipeScreenProps {
  variant?: CreateRecipeVariant
  onSaved?: (recipeId: string) => void
  onBack?: () => void
}

const FOOTER_HEIGHT = 72

export default function CreateRecipeScreen({
  variant = 'app',
  onSaved,
  onBack,
}: CreateRecipeScreenProps) {
  const insets = useSafeAreaInsets()

  const isOnboarding = variant === 'onboarding'
  const createMutation = useCreateRecipe()
  const foldersQuery = useFoldersList()
  const folderSuggestions = useMemo(
    () =>
      (foldersQuery.data ?? []).map((folder) => ({
        label: folder.name,
        emoji: folder.emoji,
      })),
    [foldersQuery.data]
  )
  const formRef = useRef<RecipeFormHandle>(null)

  const screenTitle = useMemo(
    () => (isOnboarding ? 'Create your first recipe' : 'Create your recipe'),
    [isOnboarding]
  )

  const submitLabel = useMemo(
    () => (isOnboarding ? 'Save and continue' : 'Add Recipe'),
    [isOnboarding]
  )

  const handleBack = useCallback(() => {
    if (createMutation.isPending) return
    if (onBack) return onBack()
    router.back()
  }, [createMutation.isPending, onBack])

  const handleSubmit = useCallback(
    async (values: RecipeFormSubmitValues, pendingPdfs: PendingPdfAttachment[]) => {
      try {
        const recipe = await createMutation.mutateAsync(values)
        if (pendingPdfs.length) {
          try {
            for (const pdf of pendingPdfs) {
              await addRecipePdfAttachment({
                recipeId: recipe.id,
                uri: pdf.uri,
                name: pdf.name,
                size: pdf.size,
              })
            }
          } catch {
            Alert.alert('PDF upload failed', 'Your recipe saved, but PDFs could not be added.')
          }
        }

        if (onSaved) {
          onSaved(recipe.id)
          return
        }

        router.replace({
          pathname: '/(auth)/recipes/[id]',
          params: { id: recipe.id },
        })
      } catch (e: any) {
        Alert.alert('Save failed', e?.message ?? 'Please try again.')
      }
    },
    [createMutation, onSaved]
  )

  const triggerSave = useCallback(() => {
    if (createMutation.isPending) return
    formRef.current?.submit()
  }, [createMutation.isPending])

  const keyboardVerticalOffset = Platform.select({
    ios: insets.top + 44,
    android: 0,
  })


  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header / Back */}
        <View style={styles.topBar}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleBack}
            style={styles.backButton}
            textStyle={styles.backText}
            icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
            disabled={createMutation.isPending}
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
              <Text style={styles.title}>{screenTitle}</Text>
              <Text style={styles.subtitle}>Add the basics—you can always edit later.</Text>
            </View>

            <RecipeForm
              ref={formRef}
              initialValues={createEmptyRecipeFormValues()}
              submitLabel={submitLabel}
              isSubmitting={createMutation.isPending}
              onSubmit={handleSubmit}
              showActions={false}
              suggestedFolders={folderSuggestions}
            />

            {createMutation.isError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>
                  Unable to save right now. Please try again.
                </Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Sticky footer */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
            <Button
              variant="secondary"
              size="md"
              onPress={handleBack}
              disabled={createMutation.isPending}
              style={styles.footerButton}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onPress={triggerSave}
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
              style={styles.footerButton}
            >
              {submitLabel}
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
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
}))
