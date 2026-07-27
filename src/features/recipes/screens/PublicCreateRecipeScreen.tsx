import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

import { useCreateLocalFolder, useLocalFoldersList } from '@/features/folders/hooks/useLocalFolders'
import RecipeDocumentForm, {
  type RecipeDocumentFormHandle,
  type RecipeDocumentFormValues,
} from '@/features/recipes/components/RecipeDocumentForm'
import RecipeForm, {
  createEmptyRecipeFormValues,
  type RecipeFormHandle,
  type RecipeFormSubmitValues,
} from '@/features/recipes/components/RecipeForm'
import { useCreateLocalRecipe } from '@/features/recipes/hooks/useLocalRecipes'
import { useAddRecipeDocument } from '@/features/recipes/hooks/useRecipeDocuments'
import type { CreateRecipeEntry } from '@/features/recipes/screens/CreateRecipeScreen'
import {
  DUPLICATE_RECIPE_DOCUMENT_CODE,
  findDuplicateRecipeDocumentByFile,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { optimizeImageUri } from '@/features/recipes/utils/optimizeImageAsset'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import PlanLimitReachedModal, { type PlanLimitReachedType } from '@/features/subscription/components/PlanLimitReachedModal'
import {
  IMPORT_IMAGE_COMPRESS_QUALITY,
  IMPORT_IMAGE_MAX_DIMENSION_PX,
  IMPORT_IMAGE_MAX_FILE_BYTES,
  IMPORT_IMAGE_TOO_LARGE_MESSAGE,
} from '@/features/subscription/constants/limits'
import { getPlanLimitTypeFromError } from '@/features/subscription/utils/limitErrors'
import { useTranslation } from '@/localization'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'

const PENDING_LIMIT_RETRY_PREFIX = 'recipes:create:pending-retry:'
const FOOTER_HEIGHT = 72
const FOOTER_EXTRA_BOTTOM_PADDING = 16
const EMBEDDED_FOOTER_EXTRA_BOTTOM_PADDING = 8
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



type PublicCreateRecipeScreenProps = {
  onSaved?: (recipeId: string) => void
  onBack?: () => void
  entry?: CreateRecipeEntry
}

function formatDuplicateImportMessage(
  input: { title: string | null; createdAt: string },
  locale: string,
  template: (params: { title: string; date: string }) => string,
  fallbackTitle: string,
) {
  const title = input.title?.trim() || fallbackTitle
  const date = new Date(input.createdAt).toLocaleDateString(locale)
  return template({ title, date })
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

function normalizeRequestedFolder(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null
  const normalized = raw.trim().replace(/\s+/g, ' ')
  return normalized.length ? normalized : null
}

export default function PublicCreateRecipeScreen({
  onSaved,
  onBack,
  entry,
}: PublicCreateRecipeScreenProps) {
  const { locale, t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { retryAfterUpgrade, folder } = useLocalSearchParams<{
    retryAfterUpgrade?: string
    folder?: string | string[]
  }>()
  const { isPremium } = useStorageStrategy()
  const [entryMode, setEntryMode] = useState<'scratch' | 'pdf' | null>(entry ?? null)
  const [limitModalType, setLimitModalType] = useState<PlanLimitReachedType | null>(null)
  const [pendingRetry, setPendingRetry] = useState<PendingLimitRetry | null>(null)
  const hasTriedAutoRetryRef = useRef(false)
  const createMutation = useCreateLocalRecipe()
  const documentMutation = useAddRecipeDocument()
  const foldersQuery = useLocalFoldersList()
  const createFolderMutation = useCreateLocalFolder()
  const recipeFormRef = useRef<RecipeFormHandle>(null)
  const documentFormRef = useRef<RecipeDocumentFormHandle>(null)

  const screenTitle = t('recipes.create.createRecipe')
  const submitLabel = entryMode === 'pdf' ? t('recipes.create.saveButton') : t('recipes.create.addRecipe')
  const pendingRetryKey = `${PENDING_LIMIT_RETRY_PREFIX}public:guest`
  const createPath = '/(public)/recipes/create'
  const homePath = '/(public)/(tabs)'
  const manageRecipesPath = '/(public)/recipes/manage'
  const manageImportsPath = '/(public)/imports/manage'
  const requestedFolder = useMemo(() => normalizeRequestedFolder(folder), [folder])
  const folderContextMessage = useMemo(
    () =>
      requestedFolder
        ? t('recipes.create.folderContext', { folder: requestedFolder })
        : null,
    [requestedFolder, t]
  )

  const isSaving = entryMode === 'pdf' ? documentMutation.isPending : createMutation.isPending
  const showInlineBackButton = !onBack
  const footerBottomPadding = showInlineBackButton
    ? Math.max(insets.bottom, 8) + FOOTER_EXTRA_BOTTOM_PADDING
    : Math.max(insets.bottom, 2) + EMBEDDED_FOOTER_EXTRA_BOTTOM_PADDING

  const handleBack = useCallback(() => {
    if (isSaving) return
    if (onBack) {
      onBack()
      return
    }
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
        pathname: '/(public)/recipes/[id]',
        params: {
          id: recipe.id,
          ...(retryAfterUpgrade === '1' ? { returnTo: homePath } : {}),
        },
      })
    },
    [clearPendingRetry, createMutation, homePath, onSaved, retryAfterUpgrade]
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
      const duplicate = await findDuplicateRecipeDocumentByFile({ uri: normalizedFile.uri })
      if (duplicate) {
        Alert.alert(
          t('recipes.create.duplicateTitle'),
          formatDuplicateImportMessage(
            duplicate,
            locale,
            ({ title, date }) => t('recipes.create.duplicateImported', { title, date }),
            t('recipes.documentForm.untitled')
          ),
          [
            { text: t('recipes.form.cancel'), style: 'cancel' },
            {
              text: t('recipes.create.duplicateManage'),
              onPress: () =>
                router.replace({
                  pathname: manageImportsPath,
                  params: { returnTo: '/(public)/(tabs)/collections?segment=recipes&recipesSegment=documents' },
                }),
            },
          ]
        )
        return
      }
      await documentMutation.mutateAsync({ title: values.title, file: normalizedFile })
      await clearPendingRetry()
      router.replace({
        pathname: '/(public)/(tabs)/collections',
        params: {
          segment: 'recipes',
          recipesSegment: 'documents',
          docSuccess: '1',
        },
      })
    },
    [clearPendingRetry, documentMutation, locale, manageImportsPath, t]
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
          const duplicate = await findDuplicateRecipeDocumentByFile({ uri: file.uri })
          Alert.alert(
            t('recipes.create.duplicateTitle'),
            duplicate
              ? formatDuplicateImportMessage(
                duplicate,
                locale,
                ({ title, date }) => t('recipes.create.duplicateImported', { title, date }),
                t('recipes.documentForm.untitled')
              )
              : t('recipes.create.duplicateBody'),
            [
              { text: t('recipes.form.cancel'), style: 'cancel' },
              {
                text: t('recipes.create.duplicateManage'),
                onPress: () =>
                  router.replace({
                    pathname: manageImportsPath,
                    params: { returnTo: '/(public)/(tabs)/collections?segment=recipes&recipesSegment=documents' },
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
      }
    },
    [locale, manageImportsPath, pendingRetryKey, saveDocument, t]
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
      }
    }
    void runAutoRetry()
  }, [isPremium, isSaving, pendingRetry, retryAfterUpgrade, saveDocument, saveRecipe, t, triggerSave])

  const initialValues = useMemo(() => {
    const nextValues = createEmptyRecipeFormValues()
    if (requestedFolder) {
      nextValues.folders = [requestedFolder]
    }
    return nextValues
  }, [requestedFolder])
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {showInlineBackButton ? (
          <View style={styles.topBar}>
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
        ) : null}

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <ScrollView
            style={styles.flex1}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + FOOTER_HEIGHT + FOOTER_EXTRA_BOTTOM_PADDING + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
          >
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
                    imageUploadMode="local"
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
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: footerBottomPadding },
              entryMode ? null : styles.footerCompact,
            ]}
          >
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
              pathname: '/(public)/premium',
              params: {
                returnTo: `${createPath}?entry=${entryMode ?? 'scratch'}&retryAfterUpgrade=1${requestedFolder ? `&folder=${encodeURIComponent(requestedFolder)}` : ''}`,
              },
            })
          }}
          onSecondary={() => {
            setLimitModalType(null)
            if (limitModalType === 'recipes') {
              router.replace({
                pathname: manageRecipesPath,
                params: { returnTo: '/(public)/(tabs)/collections?segment=recipes' },
              })
              return
            }
            router.replace({
              pathname: manageImportsPath,
              params: { returnTo: '/(public)/(tabs)/collections?segment=recipes&recipesSegment=documents' },
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
    paddingBottom: theme.spacing.md,
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
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  footerCompact: {
    paddingTop: theme.spacing.md,
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
