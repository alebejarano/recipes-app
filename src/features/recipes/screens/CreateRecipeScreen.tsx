// src/features/recipes/screens/CreateRecipeScreen.tsx

import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router, useLocalSearchParams, useSegments } from 'expo-router'
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
import { useTranslation } from '@/localization'
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
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import {
  DUPLICATE_RECIPE_DOCUMENT_CODE,
  findDuplicateRecipeDocumentByFile,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { optimizeImageUri } from '@/features/recipes/utils/optimizeImageAsset'
import { useLargeScreenLayout } from '@/hooks/useLargeScreenLayout'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode'
import PlanLimitReachedModal, { type PlanLimitReachedType } from '@/features/subscription/components/PlanLimitReachedModal'
import {
  IMPORT_IMAGE_COMPRESS_QUALITY,
  IMPORT_IMAGE_MAX_DIMENSION_PX,
  IMPORT_IMAGE_MAX_FILE_BYTES,
  IMPORT_IMAGE_TOO_LARGE_MESSAGE,
} from '@/features/subscription/constants/limits'
import { getPlanLimitTypeFromError } from '@/features/subscription/utils/limitErrors'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { layout } from '@/styles/layout'
import { getErrorCategory, logOperationalEvent } from '@/lib/productionLogger'

export type CreateRecipeVariant = 'onboarding' | 'app'
export type CreateRecipeEntry = 'scratch' | 'pdf'

interface CreateRecipeScreenProps {
  variant?: CreateRecipeVariant
  entry?: CreateRecipeEntry
  onSaved?: (recipeId: string) => void
  onBack?: () => void
}

const FOOTER_HEIGHT = 72
const FOOTER_EXTRA_BOTTOM_PADDING = 16
const FOREGROUND_IMPORT_UPLOAD_TIMEOUT_MS = 12_000
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

function isConnectivityError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
        ? error.message.toLowerCase()
        : ''

  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('socket') ||
    message.includes('abort') ||
    message.includes('unknownhost') ||
    message.includes('unable to resolve host') ||
    message.includes('no address associated with hostname')
  )
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
  const { locale, t } = useTranslation()
  const insets = useSafeAreaInsets()
  const largeScreen = useLargeScreenLayout({ maxContentWidth: layout.formContentMaxWidth })
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { retryAfterUpgrade, folder } = useLocalSearchParams<{
    retryAfterUpgrade?: string
    folder?: string | string[]
  }>()
  const segments = useSegments()
  const routeMode = segments[0] === '(public)' ? 'public' : 'auth'
  const { shouldUseLocalData } = useStorageDataMode(routeMode)
  const { isPremium } = useStorageStrategy()
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
    () => (isOnboarding ? t('recipes.create.firstRecipe') : t('recipes.create.createRecipe')),
    [isOnboarding, t]
  )

  const submitLabel = useMemo(
    () =>
      entryMode === 'pdf'
        ? t('recipes.create.saveButton')
        : isOnboarding
          ? t('recipes.create.saveContinue')
          : t('recipes.create.addRecipe'),
    [entryMode, isOnboarding, t]
  )

  const isSaving = entryMode === 'pdf'
    ? documentMutation.isPending || isUploadingPremiumImport
    : createMutation.isPending

  const premiumPath = routeMode === 'public' ? '/(public)/premium' : '/(auth)/premium'
  const recipeDetailPath = routeMode === 'public' ? '/(public)/recipes/[id]' : '/(auth)/recipes/[id]'
  const homePath = routeMode === 'public' ? '/(public)/(tabs)' : '/(auth)/(tabs)'
  const collectionsPath =
    routeMode === 'public'
        ? '/(public)/(tabs)/collections'
        : '/(auth)/(tabs)/collections'
  const manageRecipesPath = routeMode === 'public' ? '/(public)/recipes/manage' : '/(auth)/recipes/manage'
  const manageImportsPath = routeMode === 'public' ? '/(public)/imports/manage' : '/(auth)/imports/manage'
  const createPath = routeMode === 'public' ? '/(public)/recipes/create' : '/(auth)/recipes/create'
  const pendingRetryKey = `${PENDING_LIMIT_RETRY_PREFIX}${routeMode}:${user?.id ?? 'guest'}`
  const requestedFolder = useMemo(() => normalizeRequestedFolder(folder), [folder])
  const folderContextMessage = useMemo(
    () =>
      requestedFolder
        ? t('recipes.create.folderContext', { folder: requestedFolder })
        : null,
    [requestedFolder, t]
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
      let queuedForUpload = false
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
        const duplicateTitle = duplicate.title?.trim() || t('recipes.documentForm.untitled')
        const duplicateDate = new Date(duplicate.createdAt).toLocaleDateString(locale)
        Alert.alert(
          t('recipes.create.duplicateTitle'),
          t('recipes.create.duplicateImported', { title: duplicateTitle, date: duplicateDate }),
          [
            { text: t('recipes.detail.cancel'), style: 'cancel' },
            {
              text: t('recipes.create.duplicateManage'),
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
        try {
          await uploadPremiumImport({
            uri: normalizedFile.uri,
            fileName: normalizedFile.name,
            mimeType: inferImportMimeType(normalizedFile.name),
            title: values.title,
            timeoutMs: FOREGROUND_IMPORT_UPLOAD_TIMEOUT_MS,
          })
        } catch (uploadError) {
          if (!isConnectivityError(uploadError)) throw uploadError
          await documentMutation.mutateAsync({
            title: values.title,
            file: normalizedFile,
            plan: importPlan,
            ownerUserId: user?.id ?? null,
          })
          logOperationalEvent('offline_fallback_saved', {
            operation: 'import_upload',
            entity: 'import',
            category: getErrorCategory(uploadError),
            count: 1,
            queued: true,
          })
          queuedForUpload = true
          void triggerRecipeSync()
        }
        await queryClient.invalidateQueries({ queryKey: ['recipes', 'documents'] })
        await queryClient.invalidateQueries({ queryKey: ['recipes', 'documents', 'usage'] })
        await queryClient.invalidateQueries({ queryKey: ['recipes', 'imports', 'managed'] })
        await clearPendingRetry()
        router.replace({
          pathname: collectionsPath as any,
          params: {
            segment: 'recipes',
            recipesSegment: 'documents',
            ...(queuedForUpload ? { docQueued: '1' } : { docSuccess: '1' }),
          },
        })
        return
      }
      await documentMutation.mutateAsync({
        title: values.title,
        file: normalizedFile,
        plan: importPlan,
        ownerUserId: user?.id ?? null,
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
    [clearPendingRetry, collectionsPath, documentMutation, importPlan, locale, manageImportsPath, queryClient, shouldUseLocalData, t, user?.id]
  )

  const handleSubmit = useCallback(
    async (values: RecipeFormSubmitValues) => {
      try {
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
        Alert.alert(t('recipes.create.saveFailedTitle'), getUserFacingErrorMessage(e))
      }
    },
    [pendingRetryKey, saveRecipe, t]
  )

  const handleDocumentSubmit = useCallback(
    async (values: RecipeDocumentFormValues, file: { uri: string; name: string; size: number }) => {
      try {
        await saveDocument(values, file)
      } catch (error: any) {
        if (error?.code === DUPLICATE_RECIPE_DOCUMENT_CODE) {
          const duplicate =
            error?.duplicate ??
            (shouldUseLocalData
              ? await findDuplicateRecipeDocumentByFile({ uri: file.uri })
              : null)
          const duplicateTitle = duplicate?.title?.trim() || t('recipes.documentForm.untitled')
          const duplicateDate = duplicate
            ? new Date(duplicate.createdAt).toLocaleDateString(locale)
            : null
          Alert.alert(
            t('recipes.create.duplicateTitle'),
            duplicate
              ? t('recipes.create.duplicateImported', { title: duplicateTitle, date: duplicateDate })
              : t('recipes.create.duplicateBody'),
            [
              { text: t('recipes.detail.cancel'), style: 'cancel' },
              {
                text: t('recipes.create.duplicateManage'),
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
        Alert.alert(t('recipes.create.saveFailedTitle'), getUserFacingErrorMessage(error))
      } finally {
        setIsUploadingPremiumImport(false)
      }
    },
    [collectionsPath, locale, manageImportsPath, pendingRetryKey, saveDocument, shouldUseLocalData, t]
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
          t('recipes.create.autoRetryTitle'),
          t('recipes.create.autoRetryBody'),
          [
            { text: t('recipes.create.later'), style: 'cancel' },
            { text: t('recipes.create.saveNow'), onPress: triggerSave },
          ]
        )
      } finally {
        setIsUploadingPremiumImport(false)
      }
    }
    void runAutoRetry()
  }, [isPremium, isSaving, pendingRetry, retryAfterUpgrade, saveDocument, saveRecipe, t, triggerSave])


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header / Back */}
        <View style={[styles.topBar, largeScreen.pagePaddingStyle]}>
          <View style={[largeScreen.contentWidthStyle, styles.topBarInner]}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleBack}
            style={styles.backButton}
            icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
            disabled={isSaving}
          >
            {t('recipes.manage.back')}
          </Button>
          </View>
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
              largeScreen.pagePaddingStyle,
              { paddingBottom: insets.bottom + FOOTER_HEIGHT + FOOTER_EXTRA_BOTTOM_PADDING + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
          >
            <View style={largeScreen.contentWidthStyle}>
            {entryMode ? (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>{screenTitle}</Text>
                  <Text style={styles.subtitle}>
                    {entryMode === 'pdf'
                      ? t('recipes.create.importSubtitle')
                      : folderContextMessage ?? t('recipes.create.scratchSubtitle')}
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
                    mode="create"
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
                <Text style={styles.choiceTitle}>{t('recipes.create.chooseTitle')}</Text>
                <Text style={styles.choiceSubtitle}>
                  {t('recipes.create.chooseSubtitle')}
                </Text>

                <View style={styles.choiceButtons}>
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={() => setEntryMode('scratch')}
                    icon={<Feather name="edit-3" size={18} style={styles.choiceIconPrimary} />}
                  >
                    {t('recipes.create.chooseScratch')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onPress={() => setEntryMode('pdf')}
                    icon={<Feather name="file-text" size={18} style={styles.choiceIconSecondary} />}
                  >
                    {t('recipes.create.chooseFile')}
                  </Button>
                  <Text style={styles.choiceHelperText}>
                    {t('recipes.create.chooseHelper')}
                  </Text>
                </View>
              </View>
            )}

            {createMutation.isError || documentMutation.isError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>
                  {getUserFacingErrorMessage(
                    createMutation.error ?? documentMutation.error,
                    t('recipes.create.saveFailedTitle')
                  )}
                </Text>
              </View>
            ) : null}
            </View>
          </ScrollView>

          {/* Sticky footer */}
          <View
            style={[
              styles.footer,
              largeScreen.pagePaddingStyle,
              { paddingBottom: Math.max(insets.bottom, 8) + FOOTER_EXTRA_BOTTOM_PADDING },
            ]}
          >
            <View style={[styles.footerInner, largeScreen.contentWidthStyle]}>
            <Button
              variant="secondary"
              size="md"
              onPress={handleBack}
              disabled={isSaving}
              style={styles.footerButton}
            >
              {t('recipes.form.cancel')}
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
  topBarInner: {
    alignItems: 'flex-start',
  },

  backButton: {
    width: 'auto',
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

  choiceCard: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  choiceTitle: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  choiceSubtitle: {
    marginTop: theme.spacing.xs,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  choiceButtons: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  choiceHelperText: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  choiceIconPrimary: { color: theme.colors.background },
  choiceIconSecondary: { color: theme.colors.foreground },

  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  footerInner: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
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
}))
