// src/features/recipes/screens/CreateRecipeScreen.tsx

import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router, useLocalSearchParams, useSegments } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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

import { useAuth } from '@/features/auth/context/AuthContext'
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
import {
  DUPLICATE_RECIPE_DOCUMENT_CODE,
  findDuplicateRecipeDocumentByFile,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { optimizeImageUri } from '@/features/recipes/utils/optimizeImageAsset'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode'
import PlanLimitReachedModal, { type PlanLimitReachedType } from '@/features/subscription/components/PlanLimitReachedModal'
import {
  IMPORT_IMAGE_COMPRESS_QUALITY,
  IMPORT_IMAGE_MAX_DIMENSION_PX,
  IMPORT_IMAGE_MAX_FILE_BYTES,
  IMPORT_IMAGE_TOO_LARGE_MESSAGE,
} from '@/features/subscription/constants/limits'
import { useLimitQaOverrides } from '@/features/subscription/dev/limitQaOverrides'
import { getPlanLimitTypeFromError } from '@/features/subscription/utils/limitErrors'

export type CreateRecipeVariant = 'onboarding' | 'app'
export type CreateRecipeEntry = 'scratch' | 'pdf'

interface CreateRecipeScreenProps {
  variant?: CreateRecipeVariant
  entry?: CreateRecipeEntry
  onSaved?: (recipeId: string) => void
  onBack?: () => void
}

const FOOTER_HEIGHT = 72
const PENDING_LIMIT_RETRY_PREFIX = 'recipes:create:pending-retry:'
const IMPORT_IMAGE_QUALITY_STEPS = [
  IMPORT_IMAGE_COMPRESS_QUALITY,
  0.74,
  0.68,
]

type PendingLimitRetry =
  | {
      kind: 'recipe'
      values: RecipeFormSubmitValues
    }
  | {
      kind: 'document'
      values: RecipeDocumentFormValues
      file: { uri: string; name: string; size: number }
    }

function inferImportMimeType(fileName: string) {
  const lower = fileName.trim().toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'application/octet-stream'
}

function isOptimizableImportImage(fileName: string) {
  const mimeType = inferImportMimeType(fileName)
  return mimeType === 'image/jpeg' || mimeType === 'image/png'
}

function formatDuplicateImportMessage(input: { title: string | null; createdAt: string }) {
  const title = input.title?.trim() || 'Untitled recipe'
  const date = new Date(input.createdAt).toLocaleDateString()
  return `Already imported as "${title}" on ${date}.`
}

function normalizeRequestedFolder(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null
  const normalized = raw.trim().replace(/\s+/g, ' ')
  return normalized.length ? normalized : null
}

export default function CreateRecipeScreen({
  variant = 'app',
  entry,
  onSaved,
  onBack,
}: CreateRecipeScreenProps) {
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const posthog = usePostHog()
  const { user } = useAuth()
  const { retryAfterUpgrade, folder } = useLocalSearchParams<{
    retryAfterUpgrade?: string
    folder?: string | string[]
  }>()
  const segments = useSegments()
  const routeMode = segments[0] === '(dev)' ? 'dev' : segments[0] === '(public)' ? 'public' : 'auth'
  const isDevMode = routeMode === 'dev'
  const { shouldUseLocalData } = useStorageDataMode(routeMode)
  const { isPremium } = useStorageStrategy()
  const { overrides } = useLimitQaOverrides()
  const importPlan = isPremium ? 'premium' : 'free'

  const isOnboarding = variant === 'onboarding'
  const [entryMode, setEntryMode] = useState<CreateRecipeEntry | null>(
    isOnboarding ? 'scratch' : entry ?? null
  )
  const [isUploadingPremiumImport, setIsUploadingPremiumImport] = useState(false)
  const [limitModalType, setLimitModalType] = useState<PlanLimitReachedType | null>(null)
  const [pendingRetry, setPendingRetry] = useState<PendingLimitRetry | null>(null)
  const hasTriedAutoRetryRef = useRef(false)
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

  const premiumPath =
    routeMode === 'dev' ? '/(dev)/premium' : routeMode === 'public' ? '/(public)/premium' : '/(auth)/premium'
  const recipeDetailPath =
    routeMode === 'dev' ? '/(dev)/recipes/[id]' : routeMode === 'public' ? '/(public)/recipes/[id]' : '/(auth)/recipes/[id]'
  const homePath =
    routeMode === 'dev' ? '/(dev)/(tabs)' : routeMode === 'public' ? '/(public)/(tabs)' : '/(auth)/(tabs)'
  const collectionsPath =
    routeMode === 'dev'
      ? '/(dev)/(tabs)/collections'
      : routeMode === 'public'
        ? '/(public)/(tabs)/collections'
        : '/(auth)/(tabs)/collections'
  const manageRecipesPath =
    routeMode === 'dev' ? '/(dev)/recipes/manage' : routeMode === 'public' ? '/(public)/recipes/manage' : '/(auth)/recipes/manage'
  const manageImportsPath =
    routeMode === 'dev' ? '/(dev)/imports/manage' : routeMode === 'public' ? '/(public)/imports/manage' : '/(auth)/imports/manage'
  const createPath =
    routeMode === 'dev' ? '/(dev)/recipes/create' : routeMode === 'public' ? '/(public)/recipes/create' : '/(auth)/recipes/create'
  const pendingRetryKey = `${PENDING_LIMIT_RETRY_PREFIX}${routeMode}:${user?.id ?? 'guest'}`
  const requestedFolder = useMemo(() => normalizeRequestedFolder(folder), [folder])
  const folderContextMessage = useMemo(
    () =>
      requestedFolder
        ? `Saving in ${requestedFolder}. You can add this recipe to other folders too.`
        : null,
    [requestedFolder]
  )
  const initialValues = useMemo(() => {
    const nextValues = createEmptyRecipeFormValues()
    if (requestedFolder) {
      nextValues.folders = [requestedFolder]
    }
    return nextValues
  }, [requestedFolder])

  const handleBack = useCallback(() => {
    if (isSaving) return
    if (onBack) return onBack()
    router.back()
  }, [isSaving, onBack])

  const clearPendingRetry = useCallback(async () => {
    setPendingRetry(null)
    try {
      await AsyncStorage.removeItem(pendingRetryKey)
    } catch {
      // no-op
    }
  }, [pendingRetryKey])

  const saveRecipe = useCallback(
    async (values: RecipeFormSubmitValues) => {
      const recipe = await createMutation.mutateAsync(values)

      await clearPendingRetry()
      if (onSaved) {
        onSaved(recipe.id)
        return
      }

      router.replace({
        pathname: recipeDetailPath as any,
        params: {
          id: recipe.id,
          ...(retryAfterUpgrade === '1' ? { returnTo: homePath } : {}),
        },
      })
    },
    [clearPendingRetry, createMutation, homePath, onSaved, recipeDetailPath, retryAfterUpgrade]
  )

  const saveDocument = useCallback(
    async (values: RecipeDocumentFormValues, file: { uri: string; name: string; size: number }) => {
      const optimizedFile = isOptimizableImportImage(file.name)
        ? await optimizeImageUri(
            {
              uri: file.uri,
              fileName: file.name,
            },
            {
              maxDimensionPx: IMPORT_IMAGE_MAX_DIMENSION_PX,
              maxFileBytes: IMPORT_IMAGE_MAX_FILE_BYTES,
              qualities: IMPORT_IMAGE_QUALITY_STEPS,
              fallbackBaseName: 'recipe-import',
              tooLargeMessage: IMPORT_IMAGE_TOO_LARGE_MESSAGE,
            }
          )
        : null
      const normalizedFile = optimizedFile
        ? {
            uri: optimizedFile.uri,
            name: optimizedFile.fileName,
            size: optimizedFile.fileSize,
          }
        : file
      const duplicate = shouldUseLocalData
        ? await findDuplicateRecipeDocumentByFile({ uri: normalizedFile.uri })
        : null
      if (duplicate) {
        posthog?.capture('import_duplicate_blocked', {
          source: 'document',
          route_mode: routeMode,
          file_name: normalizedFile.name,
          file_size: normalizedFile.size,
          existing_title: duplicate.title ?? null,
          existing_created_at: duplicate.createdAt,
        })
        Alert.alert(
          'File already imported',
          formatDuplicateImportMessage(duplicate),
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Manage imports',
              onPress: () =>
                router.replace({
                  pathname: manageImportsPath as any,
                  params: {
                    returnTo: `${collectionsPath}?segment=recipes&recipesSegment=documents`,
                  },
                }),
            },
          ]
        )
        return
      }

      if (!shouldUseLocalData) {
        setIsUploadingPremiumImport(true)
        await uploadPremiumImport({
          uri: normalizedFile.uri,
          fileName: normalizedFile.name,
          mimeType: inferImportMimeType(normalizedFile.name),
          title: values.title,
        })
        await queryClient.invalidateQueries({ queryKey: ['recipes', 'documents'] })
        await clearPendingRetry()
        router.replace({
          pathname: collectionsPath as any,
          params: {
            segment: 'recipes',
            recipesSegment: 'documents',
            docSuccess: '1',
          },
        })
        return
      }
      await documentMutation.mutateAsync({
        title: values.title,
        file: normalizedFile,
        plan: importPlan,
      })
      await clearPendingRetry()
      router.replace({
        pathname: collectionsPath as any,
        params: {
          segment: 'recipes',
          recipesSegment: 'documents',
          docSuccess: '1',
        },
      })
    },
    [clearPendingRetry, collectionsPath, documentMutation, importPlan, manageImportsPath, posthog, queryClient, routeMode, shouldUseLocalData]
  )

  const handleSubmit = useCallback(
    async (values: RecipeFormSubmitValues) => {
      try {
        if (isDevMode && (overrides.forceRecipeLimitErrorOnSave || overrides.recipeUsageBandOverride === 'atLimit')) {
          const nextPending: PendingLimitRetry = { kind: 'recipe', values }
          setPendingRetry(nextPending)
          void AsyncStorage.setItem(pendingRetryKey, JSON.stringify(nextPending))
          setLimitModalType('recipes')
          return
        }
        await saveRecipe(values)
      } catch (e: any) {
        const limitType = getPlanLimitTypeFromError(e)
        if (limitType === 'recipes') {
          const nextPending: PendingLimitRetry = { kind: 'recipe', values }
          setPendingRetry(nextPending)
          void AsyncStorage.setItem(pendingRetryKey, JSON.stringify(nextPending))
          setLimitModalType('recipes')
          return
        }
        Alert.alert('Save failed', e?.message ?? 'Please try again.')
      }
    },
    [isDevMode, overrides.forceRecipeLimitErrorOnSave, overrides.recipeUsageBandOverride, pendingRetryKey, saveRecipe]
  )

  const handleDocumentSubmit = useCallback(
    async (values: RecipeDocumentFormValues, file: { uri: string; name: string; size: number }) => {
      try {
        if (isDevMode && (overrides.forceStorageLimitErrorOnImport || overrides.storageUsageBandOverride === 'atLimit')) {
          const nextPending: PendingLimitRetry = { kind: 'document', values, file }
          setPendingRetry(nextPending)
          void AsyncStorage.setItem(pendingRetryKey, JSON.stringify(nextPending))
          setLimitModalType('storage')
          return
        }
        await saveDocument(values, file)
      } catch (error: any) {
        if (error?.code === DUPLICATE_RECIPE_DOCUMENT_CODE) {
          const duplicate =
            error?.duplicate ??
            (shouldUseLocalData
              ? await findDuplicateRecipeDocumentByFile({ uri: file.uri })
              : null)
          posthog?.capture('import_duplicate_blocked', {
            source: 'document',
            route_mode: routeMode,
            file_name: file.name,
            file_size: file.size,
            existing_title: duplicate?.title ?? null,
            existing_created_at: duplicate?.createdAt ?? null,
          })
          Alert.alert(
            'File already imported',
            duplicate
              ? formatDuplicateImportMessage(duplicate)
              : 'This file already exists in your imports.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Manage imports',
                onPress: () =>
                  router.replace({
                    pathname: manageImportsPath as any,
                    params: {
                      returnTo: `${collectionsPath}?segment=recipes&recipesSegment=documents`,
                    },
                  }),
              },
            ]
          )
          return
        }
        const limitType = getPlanLimitTypeFromError(error)
        if (limitType === 'storage') {
          const nextPending: PendingLimitRetry = { kind: 'document', values, file }
          setPendingRetry(nextPending)
          void AsyncStorage.setItem(pendingRetryKey, JSON.stringify(nextPending))
          setLimitModalType('storage')
          return
        }
        Alert.alert('Save failed', error?.message ?? 'Please try again.')
      } finally {
        setIsUploadingPremiumImport(false)
      }
    },
    [collectionsPath, isDevMode, manageImportsPath, overrides.forceStorageLimitErrorOnImport, overrides.storageUsageBandOverride, pendingRetryKey, posthog, routeMode, saveDocument, shouldUseLocalData]
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

  useEffect(() => {
    if (retryAfterUpgrade !== '1') return
    let isCancelled = false
    async function hydratePendingRetry() {
      try {
        const raw = await AsyncStorage.getItem(pendingRetryKey)
        if (isCancelled || !raw) return
        const parsed = JSON.parse(raw) as PendingLimitRetry
        if (!parsed || (parsed.kind !== 'recipe' && parsed.kind !== 'document')) return
        setPendingRetry(parsed)
      } catch {
        // no-op
      }
    }
    void hydratePendingRetry()
    return () => {
      isCancelled = true
    }
  }, [pendingRetryKey, retryAfterUpgrade])

  useEffect(() => {
    if (retryAfterUpgrade !== '1' || !isPremium || !pendingRetry) return
    if (isSaving || hasTriedAutoRetryRef.current) return
    hasTriedAutoRetryRef.current = true
    const retry = pendingRetry

    async function runAutoRetry() {
      try {
        if (retry.kind === 'recipe') {
          await saveRecipe(retry.values)
          return
        }
        await saveDocument(retry.values, retry.file)
      } catch {
        Alert.alert(
          'Could not save automatically',
          'Your draft is still here. Save when you are ready.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Save now', onPress: triggerSave },
          ]
        )
      } finally {
        setIsUploadingPremiumImport(false)
      }
    }
    void runAutoRetry()
  }, [isPremium, isSaving, pendingRetry, retryAfterUpgrade, saveDocument, saveRecipe, triggerSave])


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header / Back */}
        <View style={styles.topBar}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleBack}
            style={styles.backButton}
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
                      : folderContextMessage ?? 'Start simple — you can always refine it later.'}
                  </Text>
                </View>

                {entryMode === 'pdf' ? (
                  <RecipeDocumentForm
                    ref={documentFormRef}
                    isSubmitting={documentMutation.isPending}
                    plan={importPlan}
                    onSubmit={handleDocumentSubmit}
                    autoPickPdf
                  />
                ) : (
                  <RecipeForm
                    ref={recipeFormRef}
                    initialValues={initialValues}
                    submitLabel={submitLabel}
                    isSubmitting={createMutation.isPending}
                    onSubmit={handleSubmit}
                    showActions={false}
                    suggestedFolders={folderSuggestions}
                    folderContextMessage={folderContextMessage}
                    onCreateFolder={handleCreateFolder}
                    imageUploadMode={shouldUseLocalData ? 'local' : 'cloud'}
                    plan={importPlan}
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
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
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

      {limitModalType ? (
        <PlanLimitReachedModal
          visible
          type={limitModalType}
          onClose={() => setLimitModalType(null)}
          onPrimary={() => {
            setLimitModalType(null)
            hasTriedAutoRetryRef.current = false
            router.push({
              pathname: premiumPath as any,
              params: {
                returnTo: `${createPath}?entry=${entryMode ?? 'scratch'}&retryAfterUpgrade=1${requestedFolder ? `&folder=${encodeURIComponent(requestedFolder)}` : ''}`,
              },
            })
          }}
          onSecondary={() => {
            setLimitModalType(null)
            if (limitModalType === 'recipes') {
              router.replace({
                pathname: manageRecipesPath as any,
                params: { returnTo: `${collectionsPath}?segment=recipes` },
              })
              return
            }
            router.replace({
              pathname: manageImportsPath as any,
              params: {
                returnTo: `${collectionsPath}?segment=recipes&recipesSegment=documents`,
              },
            })
          }}
        />
      ) : null}
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
