import { Feather } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { File } from '@/lib/fileSystem'
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'

import Button from '@/components/Button'
import { useTranslation } from '@/localization'
import { getCloudRecipeDocumentUsageSummary } from '@/features/recipes/api/recipeDocumentsCloudRepo'
import { createThemedStyles } from '@/styles/createStyles'
import { useStorageStrategy } from '@/features/storage/context/StorageStrategyContext'
import { stagePickedImportFile } from '@/features/recipes/utils/stagePickedImportFile'

import {
  type PendingRecipeDocument,
  type RecipeDocumentUsageSummary,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { getRecipeDocumentUsageSummary } from '@/features/recipes/storage/recipeDocumentStorage'
import type { ImportPlan } from '@/features/recipes/storage/importsStorage'
import {
  FREE_PLAN_MAX_IMPORT_FILE_BYTES,
  IMPORT_FILE_TOO_LARGE_MESSAGE,
  IMPORT_ALLOWED_MIME_TYPES,
} from '@/features/subscription/constants/limits'

export type RecipeDocumentFormValues = {
  title: string
}

export type RecipeDocumentFormHandle = {
  submit: () => void
}

type Props = {
  isSubmitting?: boolean
  autoPickPdf?: boolean
  plan?: ImportPlan
  onSubmit: (values: RecipeDocumentFormValues, file: PendingRecipeDocument) => Promise<void> | void
}

function titleFromFilename(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return ''
  const withoutExt = trimmed.replace(/\.[^.]+$/, '')
  return withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeTitleCandidate(value: string) {
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim()
  return cleaned.replace(/\s+/g, ' ')
}

function isSaneTitle(value: string) {
  const cleaned = normalizeTitleCandidate(value)
  if (!cleaned) return false
  if (cleaned.length < 3) return false
  const lowered = cleaned.toLowerCase()
  const generic = [
    'document',
    'untitled',
    'untitled document',
    'microsoft word',
    'new document',
    'pdf',
  ]
  if (generic.some((word) => lowered === word)) return false
  return true
}

function isPdfFile(name: string, mimeType?: string | null) {
  if (mimeType === 'application/pdf') return true
  return name.trim().toLowerCase().endsWith('.pdf')
}

function inferFallbackName(mimeType?: string | null) {
  if (mimeType === 'image/png') return 'recipe.png'
  if (mimeType === 'image/jpeg') return 'recipe.jpg'
  return 'recipe.pdf'
}

async function buildBestTitle(
  input: { uri: string; name: string; size: number; isPdf: boolean },
  t: (scope: string) => string
) {
  const filenameTitle = titleFromFilename(input.name)
  if (isSaneTitle(filenameTitle)) return filenameTitle

  return t('recipes.documentForm.untitled')
}

function getPickFailureMessage(error: unknown, t: (scope: string) => string) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
        ? error.message.toLowerCase()
        : ''

  if (
    message.includes('file not found') ||
    message.includes('filenotfound') ||
    message.includes('no such file')
  ) {
    return t('recipes.documentForm.unavailableCloud')
  }

  return t('recipes.documentForm.unavailableGeneric')
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
}

function getAvailabilityNote(plan: ImportPlan) {
  if (plan === 'premium') {
    return 'premium'
  }

  return 'free'
}

const RecipeDocumentForm = forwardRef<RecipeDocumentFormHandle, Props>(function RecipeDocumentForm(
  { isSubmitting, autoPickPdf = false, plan = 'free', onSubmit },
  ref
) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<PendingRecipeDocument | null>(null)
  const [usage, setUsage] = useState<RecipeDocumentUsageSummary>({ totalBytes: 0, totalCount: 0 })
  const [isPicking, setIsPicking] = useState(false)
  const autoPickAttempted = useRef(false)
  const { cloudSyncEnabled } = useStorageStrategy()

  const canSubmit = Boolean(file) && !isSubmitting && !isPicking

  const refreshUsage = useCallback(async () => {
    try {
      const summary =
        plan === 'premium' && cloudSyncEnabled
          ? await getCloudRecipeDocumentUsageSummary()
          : await getRecipeDocumentUsageSummary()
      setUsage(summary)
    } catch {
      // ignore
    }
  }, [cloudSyncEnabled, plan])

  const pickFile = useCallback(async () => {
    if (isPicking) return
    setIsPicking(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [...IMPORT_ALLOWED_MIME_TYPES],
        copyToCacheDirectory: false,
        multiple: false,
      })
      if (result.canceled) return
      const asset = result.assets?.[0]
      if (!asset) return

      const name = asset.name ?? inferFallbackName(asset.mimeType)
      let stagedUri = asset.uri

      try {
        stagedUri = await stagePickedImportFile({
          uri: asset.uri,
          name,
        })
      } catch (error) {
        Alert.alert(
          t('recipes.documentForm.fileUnavailableTitle'),
          getPickFailureMessage(error, t)
        )
        return
      }

      let size = asset.size ?? 0
      if (!size) {
        try {
          const info = await new File(stagedUri).info()
          size =
            info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0
        } catch {
          size = 0
        }
      }

      if (size > FREE_PLAN_MAX_IMPORT_FILE_BYTES) {
        Alert.alert(t('recipes.documentForm.fileTooLargeTitle'), IMPORT_FILE_TOO_LARGE_MESSAGE)
        return
      }

      const isPdf = isPdfFile(name, asset.mimeType)
      setFile({ uri: stagedUri, name, size })
      const suggestedTitle = await buildBestTitle({ uri: stagedUri, name, size, isPdf }, t)
      setTitle((prev) => (prev.trim() ? prev : suggestedTitle))
    } catch (error) {
      Alert.alert(t('recipes.documentForm.fileUnavailableTitle'), getPickFailureMessage(error, t))
    } finally {
      setIsPicking(false)
    }
  }, [isPicking, t])

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        if (!file) {
          Alert.alert(t('recipes.documentForm.addFileTitle'), t('recipes.documentForm.addFileBody'))
          return
        }
        onSubmit({ title }, file)
      },
    }),
    [file, onSubmit, t, title]
  )

  const helperText = useMemo(() => {
    const used = formatBytes(usage.totalBytes)
    if (plan === 'premium') {
      return t('recipes.documentForm.helperPremium', { used })
    }
    return t('recipes.documentForm.helperFree', { used })
  }, [plan, t, usage.totalBytes])

  React.useEffect(() => {
    void refreshUsage()
  }, [refreshUsage])

  React.useEffect(() => {
    if (!autoPickPdf || autoPickAttempted.current) return
    autoPickAttempted.current = true
    void pickFile()
  }, [autoPickPdf, pickFile])

  return (
    <View style={styles.form}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recipes.documentForm.importFile')}</Text>
        <Text style={styles.helperText}>{helperText}</Text>
        <Text style={styles.availabilityNote}>
          {getAvailabilityNote(plan) === 'premium'
            ? t('recipes.documentForm.premiumNote')
            : t('recipes.documentForm.freeNote')}
        </Text>

        <View style={styles.fileCard}>
          <View style={styles.fileIconWrap}>
            <Feather name="file-text" size={18} color={styles.fileIcon.color} />
          </View>
          <View style={styles.fileText}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file?.name ?? t('recipes.documentForm.noFile')}
            </Text>
            <Text style={styles.fileMeta}>
              {file ? formatBytes(file.size) : t('recipes.documentForm.fileTypes')}
            </Text>
          </View>
        </View>

        <Button
          variant="secondary"
          size="md"
          onPress={pickFile}
          disabled={isSubmitting || isPicking}
          style={styles.pickButton}
          icon={
            isPicking ? (
              <ActivityIndicator size="small" color={styles.pickIcon.color} />
            ) : (
              <Feather name="upload" size={16} color={styles.pickIcon.color} />
            )
          }
        >
          {isPicking ? t('recipes.documentForm.choosing') : t('recipes.documentForm.chooseFile')}
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('recipes.documentForm.details')}</Text>
        <View style={styles.field}>
          <Text style={styles.label}>{t('recipes.documentForm.titleLabel')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('recipes.documentForm.titlePlaceholder')}
            placeholderTextColor={styles.placeholder.color}
            style={styles.input}
            editable={!isSubmitting}
          />
        </View>
      </View>

      {file ? (
        <Pressable
          onPress={pickFile}
          accessibilityRole="button"
          accessibilityLabel={t('recipes.documentForm.replaceA11y')}
          style={({ pressed }) => [styles.replaceRow, pressed && styles.replaceRowPressed]}
        >
          <Feather name="refresh-ccw" size={14} color={styles.replaceIcon.color} />
          <Text style={styles.replaceText}>{t('recipes.documentForm.replace')}</Text>
        </Pressable>
      ) : null}

      {!canSubmit && !file ? (
        <Text style={styles.validationHint}>{t('recipes.documentForm.selectToContinue')}</Text>
      ) : null}
    </View>
  )
})

export default RecipeDocumentForm

const styles = createThemedStyles((theme) => ({
  form: { gap: theme.spacing.xl },

  section: { gap: theme.spacing.md },
  sectionTitle: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  helperText: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  availabilityNote: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  fileIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIcon: {
    color: theme.colors.mutedForeground,
  },
  fileText: { flex: 1 },
  fileName: {
    ...theme.textVariants.emphasis,
    color: theme.colors.foreground,
  },
  fileMeta: {
    marginTop: theme.spacing.xs,
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },

  pickButton: { alignSelf: 'flex-start' },
  pickIcon: { color: theme.colors.mutedForeground },

  field: { gap: theme.spacing.xs },
  label: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.textVariants.body,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },

  replaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  replaceRowPressed: {
    opacity: 0.7,
  },
  replaceIcon: {
    color: theme.colors.mutedForeground,
  },
  replaceText: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.mutedForeground,
  },

  validationHint: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
}))
