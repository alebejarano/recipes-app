// src/features/recipes/screens/CreateRecipeScreen.tsx

import { Feather } from '@expo/vector-icons'
import { router, useSegments } from 'expo-router'
import React, { useCallback, useMemo, useRef, useState } from 'react'
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

import { useStrategyCreateFolder, useStrategyFoldersList } from '@/features/folders/hooks/useStrategyFolders'
import { uploadPremiumImport } from '@/features/recipes/api/importsRepo'
import RecipeDocumentForm, {
  type RecipeDocumentFormHandle,
  type RecipeDocumentFormValues,
} from '@/features/recipes/components/RecipeDocumentForm'
import RecipeForm, {
  createEmptyRecipeFormValues,
  type RecipeFormHandle,
  type RecipeFormSubmitValues,
} from '@/features/recipes/components/RecipeForm'
import { useAddRecipeDocument } from '@/features/recipes/hooks/useRecipeDocuments'
import { useStrategyCreateRecipe } from '@/features/recipes/hooks/useStrategyRecipes'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode'

export type CreateRecipeVariant = 'onboarding' | 'app'
export type CreateRecipeEntry = 'scratch' | 'pdf'

interface CreateRecipeScreenProps {
  variant?: CreateRecipeVariant
  entry?: CreateRecipeEntry
  onSaved?: (recipeId: string) => void
  onBack?: () => void
}

const FOOTER_HEIGHT = 72

function inferImportMimeType(fileName: string) {
  const lower = fileName.trim().toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

export default function CreateRecipeScreen({
  variant = 'app',
  entry,
  onSaved,
  onBack,
}: CreateRecipeScreenProps) {
  const insets = useSafeAreaInsets()
  const segments = useSegments()
  const routeMode = segments[0] === '(dev)' ? 'dev' : segments[0] === '(public)' ? 'public' : 'auth'
  const { shouldUseLocalData: baseLocalMode } = useStorageDataMode(routeMode)
  const { cloudSyncEnabled } = useStorageStrategy()
  const shouldUseLocalData = baseLocalMode || (routeMode === 'auth' && cloudSyncEnabled)

  const isOnboarding = variant === 'onboarding'
  const [entryMode, setEntryMode] = useState<CreateRecipeEntry | null>(
    isOnboarding ? 'scratch' : entry ?? null
  )
  const [isUploadingPremiumImport, setIsUploadingPremiumImport] = useState(false)
  const createMutation = useStrategyCreateRecipe(routeMode)
  const documentMutation = useAddRecipeDocument()
  const foldersQuery = useStrategyFoldersList(routeMode)
  const createFolderMutation = useStrategyCreateFolder(routeMode)
  const folderSuggestions = useMemo(
    () => {
      const source = foldersQuery.data ?? []
      return source.map((folder) => ({
        label: folder.name,
        emoji: folder.emoji,
      }))
    },
    [foldersQuery.data]
  )
  const recipeFormRef = useRef<RecipeFormHandle>(null)
  const documentFormRef = useRef<RecipeDocumentFormHandle>(null)

  const screenTitle = useMemo(
    () => (isOnboarding ? 'Create your first recipe' : 'Create your recipe'),
    [isOnboarding]
  )

  const submitLabel = useMemo(
    () =>
      entryMode === 'pdf'
        ? 'Save'
        : isOnboarding
          ? 'Save and continue'
          : 'Add Recipe',
    [entryMode, isOnboarding]
  )

  const isSaving = entryMode === 'pdf'
    ? documentMutation.isPending || isUploadingPremiumImport
    : createMutation.isPending

  const handleBack = useCallback(() => {
    if (isSaving) return
    if (onBack) return onBack()
    router.back()
  }, [isSaving, onBack])

  const handleSubmit = useCallback(
    async (values: RecipeFormSubmitValues) => {
      try {
        const recipe = await createMutation.mutateAsync(values)

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

  const handleDocumentSubmit = useCallback(
    async (values: RecipeDocumentFormValues, file: { uri: string; name: string; size: number }) => {
      try {
        if (!shouldUseLocalData) {
          setIsUploadingPremiumImport(true)
          await uploadPremiumImport({
            uri: file.uri,
            fileName: file.name,
            mimeType: inferImportMimeType(file.name),
          })
        }
        await documentMutation.mutateAsync({
          title: values.title,
          file,
          plan: shouldUseLocalData ? 'free' : 'premium',
        })
        router.replace({
          pathname: '/(auth)/(tabs)/collections',
          params: {
            segment: 'recipes',
            recipesSegment: 'documents',
            docSuccess: '1',
          },
        })
      } catch (error: any) {
        Alert.alert('Save failed', error?.message ?? 'Please try again.')
      } finally {
        setIsUploadingPremiumImport(false)
      }
    },
    [documentMutation, shouldUseLocalData]
  )

  const handleCreateFolder = useCallback(
    async (input: { name: string; emoji?: string | null }) => {
      await createFolderMutation.mutateAsync(input)
    },
    [createFolderMutation]
  )

  const triggerSave = useCallback(() => {
    if (isSaving) return
    if (entryMode === 'pdf') {
      documentFormRef.current?.submit()
      return
    }
    recipeFormRef.current?.submit()
  }, [entryMode, isSaving])

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
            disabled={isSaving}
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
            {entryMode ? (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>{screenTitle}</Text>
                  <Text style={styles.subtitle}>
                    {entryMode === 'pdf'
                      ? 'Upload a recipe file (PDF, JPG, or PNG) and add a title.'
                      : 'Add the basics—you can always edit later.'}
                  </Text>
                </View>

                {entryMode === 'pdf' ? (
                  <RecipeDocumentForm
                    ref={documentFormRef}
                    isSubmitting={documentMutation.isPending}
                    onSubmit={handleDocumentSubmit}
                    autoPickPdf
                  />
                ) : (
                  <RecipeForm
                    ref={recipeFormRef}
                    initialValues={createEmptyRecipeFormValues()}
                    submitLabel={submitLabel}
                    isSubmitting={createMutation.isPending}
                    onSubmit={handleSubmit}
                    showActions={false}
                    suggestedFolders={folderSuggestions}
                    onCreateFolder={handleCreateFolder}
                    imageUploadMode={shouldUseLocalData ? 'local' : 'cloud'}
                  />
                )}
              </>
            ) : (
              <View style={styles.choiceCard}>
                <Text style={styles.choiceTitle}>How would you like to add this recipe?</Text>
                <Text style={styles.choiceSubtitle}>
                  Create it manually or import it from a file.
                </Text>

                <View style={styles.choiceButtons}>
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={() => setEntryMode('scratch')}
                    icon={<Feather name="edit-3" size={18} style={styles.choiceIconPrimary} />}
                  >
                    Create from scratch
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onPress={() => setEntryMode('pdf')}
                    icon={<Feather name="file-text" size={18} style={styles.choiceIconSecondary} />}
                  >
                    Import from file
                  </Button>
                  <Text style={styles.choiceHelperText}>
                    Supports PDF and image files (PNG, JPG){'\n'}Max 10MB per file
                  </Text>
                </View>
              </View>
            )}

            {createMutation.isError || documentMutation.isError ? (
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
              disabled={isSaving}
              style={styles.footerButton}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onPress={triggerSave}
              loading={isSaving}
              disabled={isSaving || !entryMode}
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
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
  },
  backIcon: { color: theme.colors.mutedForeground, fontSize: theme.fontSize.lg, },

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

  choiceCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  choiceTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  choiceSubtitle: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  choiceButtons: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  choiceHelperText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  choiceIconPrimary: { color: theme.colors.background },
  choiceIconSecondary: { color: theme.colors.foreground },

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
