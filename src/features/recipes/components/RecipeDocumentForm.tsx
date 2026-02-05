import { Feather } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import { File } from 'expo-file-system'
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
import { createThemedStyles } from '@/styles/createStyles'

import {
  type PendingRecipeDocument,
  type RecipeDocumentUsageSummary,
} from '@/features/recipes/storage/recipeDocumentStorage'
import { getRecipeDocumentUsageSummary } from '@/features/recipes/storage/recipeDocumentStorage'

export type RecipeDocumentFormValues = {
  title: string
}

export type RecipeDocumentFormHandle = {
  submit: () => void
}

type Props = {
  isSubmitting?: boolean
  autoPickPdf?: boolean
  onSubmit: (values: RecipeDocumentFormValues, file: PendingRecipeDocument) => Promise<void> | void
}

const MAX_COUNT = 5
const MAX_TOTAL_BYTES = 50 * 1024 * 1024
const MAX_FILE_BYTES = 20 * 1024 * 1024
const METADATA_READ_LIMIT = 2 * 1024 * 1024

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

async function tryExtractPdfTitle(uri: string, size: number) {
  if (size <= 0 || size > METADATA_READ_LIMIT) return null
  try {
    const content = await new File(uri).text()
    if (!content) return null

    const infoMatch = content.match(/\/Title\s*\(([^)]+)\)/i)
    if (infoMatch?.[1] && isSaneTitle(infoMatch[1])) {
      return normalizeTitleCandidate(infoMatch[1])
    }

    const xmpMatch = content.match(/<dc:title>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>/i)
    if (xmpMatch?.[1] && isSaneTitle(xmpMatch[1])) {
      return normalizeTitleCandidate(xmpMatch[1])
    }
  } catch {
    return null
  }
  return null
}

async function buildBestTitle(input: { uri: string; name: string; size: number }) {
  const metadataTitle = await tryExtractPdfTitle(input.uri, input.size)
  if (metadataTitle) return metadataTitle

  const filenameTitle = titleFromFilename(input.name)
  if (isSaneTitle(filenameTitle)) return filenameTitle

  return 'Untitled recipe'
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
}

const RecipeDocumentForm = forwardRef<RecipeDocumentFormHandle, Props>(function RecipeDocumentForm(
  { isSubmitting, autoPickPdf = false, onSubmit },
  ref
) {
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<PendingRecipeDocument | null>(null)
  const [usage, setUsage] = useState<RecipeDocumentUsageSummary>({ totalBytes: 0, totalCount: 0 })
  const [isPicking, setIsPicking] = useState(false)
  const autoPickAttempted = useRef(false)

  const canSubmit = Boolean(file) && !isSubmitting && !isPicking

  const refreshUsage = useCallback(async () => {
    try {
      const summary = await getRecipeDocumentUsageSummary()
      setUsage(summary)
    } catch {
      // ignore
    }
  }, [])

  const pickPdf = useCallback(async () => {
    if (isPicking) return
    setIsPicking(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (result.canceled) return
      const asset = result.assets?.[0]
      if (!asset) return

      let size = asset.size ?? 0
      if (!size) {
        try {
          const info = await new File(asset.uri).info()
          size =
            info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0
        } catch {
          size = 0
        }
      }

      const totalCount = usage.totalCount
      const totalBytes = usage.totalBytes

      if (size > MAX_FILE_BYTES) {
        Alert.alert('File too large', 'Each PDF must be 20 MB or smaller.')
        return
      }
      if (totalCount >= MAX_COUNT) {
        Alert.alert('PDF limit reached', 'Free accounts can save up to 5 PDFs.')
        return
      }
      if (totalBytes + size > MAX_TOTAL_BYTES) {
        Alert.alert('Storage limit reached', 'Free accounts can save up to 50 MB of PDFs.')
        return
      }

      const name = asset.name ?? 'recipe.pdf'
      setFile({ uri: asset.uri, name, size })
      const suggestedTitle = await buildBestTitle({ uri: asset.uri, name, size })
      setTitle((prev) => (prev.trim() ? prev : suggestedTitle))
    } finally {
      setIsPicking(false)
    }
  }, [isPicking, usage.totalBytes, usage.totalCount])

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        if (!file) {
          Alert.alert('Add a PDF', 'Choose a PDF file to upload first.')
          return
        }
        onSubmit({ title }, file)
      },
    }),
    [file, onSubmit, title]
  )

  const helperText = useMemo(() => {
    return `Free plan: ${MAX_COUNT} PDFs, 50 MB total. ${formatBytes(usage.totalBytes)} used.`
  }, [usage.totalBytes])

  React.useEffect(() => {
    void refreshUsage()
  }, [refreshUsage])

  React.useEffect(() => {
    if (!autoPickPdf || autoPickAttempted.current) return
    autoPickAttempted.current = true
    void pickPdf()
  }, [autoPickPdf, pickPdf])

  return (
    <View style={styles.form}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Import PDF</Text>
        <Text style={styles.helperText}>{helperText}</Text>

        <View style={styles.fileCard}>
          <View style={styles.fileIconWrap}>
            <Feather name="file-text" size={18} color={styles.fileIcon.color} />
          </View>
          <View style={styles.fileText}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file?.name ?? 'No file selected'}
            </Text>
            <Text style={styles.fileMeta}>
              {file ? formatBytes(file.size) : 'PDF only'}
            </Text>
          </View>
        </View>

        <Button
          variant="secondary"
          size="md"
          onPress={pickPdf}
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
          {isPicking ? 'Choosing…' : 'Choose PDF'}
        </Button>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Title (optional)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Auto-filled from filename"
            placeholderTextColor={styles.placeholder.color}
            style={styles.input}
            editable={!isSubmitting}
          />
        </View>
      </View>

      {file ? (
        <Pressable
          onPress={pickPdf}
          accessibilityRole="button"
          accessibilityLabel="Replace PDF"
          style={({ pressed }) => [styles.replaceRow, pressed && styles.replaceRowPressed]}
        >
          <Feather name="refresh-ccw" size={14} color={styles.replaceIcon.color} />
          <Text style={styles.replaceText}>Replace PDF</Text>
        </Pressable>
      ) : null}

      {!canSubmit && !file ? (
        <Text style={styles.validationHint}>Select a PDF to continue.</Text>
      ) : null}
    </View>
  )
})

export default RecipeDocumentForm

const styles = createThemedStyles((theme) => ({
  form: { gap: theme.spacing.xl },

  section: { gap: theme.spacing.md },
  sectionTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  helperText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  fileMeta: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  pickButton: { alignSelf: 'flex-start' },
  pickIcon: { color: theme.colors.mutedForeground },

  field: { gap: theme.spacing.xs },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
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
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  validationHint: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
}))
