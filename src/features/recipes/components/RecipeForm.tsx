// src/features/recipes/components/RecipeForm.tsx
import { File } from '@/lib/fileSystem'
import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import TagChip from '@/components/TagChip'
import { useTranslation } from '@/localization'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { uploadRecipeImage } from '@/features/recipes/api/recipesRepo'
import MealTimeChip from '@/features/recipes/components/MealTimeChip'
import {
  getActiveImportBytesByUri,
  getImportsUsageSummary,
  isManagedLocalImportImageUri,
  type ImportPlan,
} from '@/features/recipes/storage/importsStorage'
import { RECIPE_MEAL_TIMES, type RecipeMealTime } from '@/features/recipes/types/mealTimes'
import {
  optimizePickerImageAsset,
  type OptimizedImageAsset,
} from '@/features/recipes/utils/optimizeImageAsset'
import {
  exceedsImportStorageLimit,
  isImportFileTooLarge,
  isRecipeImageUploadTooLarge,
} from '@/features/recipes/utils/recipeValidation'
import {
  IMPORT_FILE_TOO_LARGE_MESSAGE,
  RECIPE_IMAGE_MASTER_COMPRESS_QUALITY,
  RECIPE_IMAGE_MASTER_MAX_DIMENSION_PX,
  RECIPE_IMAGE_MASTER_MAX_FILE_BYTES,
  RECIPE_IMAGE_MASTER_TOO_LARGE_MESSAGE,
  RECIPE_IMAGE_UPLOAD_TOO_LARGE_MESSAGE,
} from '@/features/subscription/constants/limits'
import { createThemedStyles } from '@/styles/createStyles'

export type RecipeFormValues = {
  title: string
  subtitle: string
  description: string
  emoji: string
  imageUrl: string
  prepTimeMinutes: string
  cookTimeMinutes: string
  servings: string
  ingredientsText: string
  steps: string[]
  folders: string[]
  mealTimes: RecipeMealTime[]
}

export type RecipeFormSubmitValues = {
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  imageUrl: string | null
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null
  ingredients: string[] | null
  steps: string[] | null
  folders: string[] | null
  mealTimes: RecipeMealTime[] | null
}

export type RecipeFormHandle = {
  submit: () => void
}

function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  const i = Math.trunc(n)
  return i >= 0 ? i : null
}

function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function normalizeFolderName(value?: unknown): string {
  if (value === null || value === undefined) return ''
  const text = typeof value === 'string' ? value : String(value)
  return text.trim().replace(/\s+/g, ' ')
}

function isPrefilledValue(currentValue: string, initialValue?: string) {
  if (!currentValue.trim()) return false
  return currentValue === (initialValue ?? '')
}

export function buildRecipeFormSubmitValues(
  values: RecipeFormValues
): RecipeFormSubmitValues | null {
  const title = values.title.trim()
  if (!title) return null

  const normalizedIngredients = values.ingredientsText
    .split(/\r?\n/)
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
  const normalizedSteps = values.steps.map((step) => step.trim()).filter(Boolean)
  const normalizedFolders = values.folders.map((folder) => folder.trim()).filter(Boolean)
  const emoji = normalizeOptionalText(values.emoji)
  const imageUrl = normalizeOptionalText(values.imageUrl)

  return {
    title,
    subtitle: normalizeOptionalText(values.subtitle),
    description: normalizeOptionalText(values.description),
    emoji,
    imageUrl: emoji ? null : imageUrl,
    prepTimeMinutes: parseOptionalInt(values.prepTimeMinutes),
    cookTimeMinutes: parseOptionalInt(values.cookTimeMinutes),
    servings: parseOptionalInt(values.servings),
    ingredients: normalizedIngredients.length ? normalizedIngredients : null,
    steps: normalizedSteps.length ? normalizedSteps : null,
    folders: normalizedFolders.length ? normalizedFolders : null,
    mealTimes: values.mealTimes.length ? values.mealTimes : null,
  }
}

export function createEmptyRecipeFormValues(): RecipeFormValues {
  return {
    title: '',
    subtitle: '',
    description: '',
    emoji: '',
    imageUrl: '',
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    servings: '',
    ingredientsText: '',
    steps: [''],
    folders: [],
    mealTimes: [],
  }
}

type FolderSuggestion = { label: string; emoji?: string | null }

type Props = {
  mode?: 'create' | 'edit'
  initialValues?: RecipeFormValues
  submitLabel: string
  isSubmitting?: boolean
  onSubmit: (values: RecipeFormSubmitValues) => Promise<void> | void
  onCreateFolder: (input: { name: string; emoji?: string | null }) => Promise<void>
  onCancel?: () => void
  showActions?: boolean
  suggestedFolders?: FolderSuggestion[]
  folderContextMessage?: string | null
  imageUploadMode?: 'cloud' | 'local'
  plan?: ImportPlan
}

const IMAGE_QUALITY_STEPS = [
  RECIPE_IMAGE_MASTER_COMPRESS_QUALITY,
  0.72,
  0.66,
  0.58,
  0.5,
]
const INGREDIENTS_MIN_HEIGHT = 148

async function getPickedImageSizeBytes(asset: ImagePicker.ImagePickerAsset): Promise<number> {
  const fileSize = (asset as { fileSize?: number | null }).fileSize
  if (Number.isFinite(fileSize) && Number(fileSize) > 0) return Number(fileSize)

  try {
    const info = await new File(asset.uri).info()
    return info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0
  } catch {
    return 0
  }
}

async function optimizeRecipeImageAsset(
  asset: ImagePicker.ImagePickerAsset
): Promise<OptimizedImageAsset> {
  return optimizePickerImageAsset(asset, {
    maxDimensionPx: RECIPE_IMAGE_MASTER_MAX_DIMENSION_PX,
    maxFileBytes: RECIPE_IMAGE_MASTER_MAX_FILE_BYTES,
    qualities: IMAGE_QUALITY_STEPS,
    fallbackBaseName: 'recipe',
    tooLargeMessage: RECIPE_IMAGE_MASTER_TOO_LARGE_MESSAGE,
  })
}

const RecipeForm = forwardRef<RecipeFormHandle, Props>(function RecipeForm(
  {
    mode = 'create',
    initialValues,
    submitLabel,
    isSubmitting,
    onSubmit,
    onCreateFolder,
    onCancel,
    showActions = true,
    suggestedFolders = [],
    folderContextMessage,
    imageUploadMode = 'cloud',
    plan = 'free',
  },
  ref
) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [values, setValues] = useState<RecipeFormValues>(
    initialValues ?? createEmptyRecipeFormValues()
  )
  const [folderInput, setFolderInput] = useState('')
  const [isFolderInputFocused, setIsFolderInputFocused] = useState(false)
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false)
  const [emojiDraft, setEmojiDraft] = useState('')
  const [emojiKeyboardInset, setEmojiKeyboardInset] = useState(0)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [ingredientsInputHeight, setIngredientsInputHeight] = useState(INGREDIENTS_MIN_HEIGHT)
  const [focusedStepIndex, setFocusedStepIndex] = useState<number | null>(null)
  const [isMoreDetailsExpanded, setIsMoreDetailsExpanded] = useState(() => {
    const source = initialValues ?? createEmptyRecipeFormValues()
    return Boolean(
      source.description.trim() ||
      source.subtitle.trim() ||
      source.emoji.trim() ||
      source.imageUrl.trim() ||
      source.prepTimeMinutes.trim() ||
      source.cookTimeMinutes.trim() ||
      source.servings.trim() ||
      source.mealTimes.length
    )
  })
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(() => {
    const source = initialValues ?? createEmptyRecipeFormValues()
    return source.folders.length > 0
  })
  const initialFormValues = initialValues ?? createEmptyRecipeFormValues()
  const shouldTintPrefilledValues = mode === 'create'
  const normalizedSuggestedFolders = useMemo(() => {
    if (!suggestedFolders.length) return []
    const selected = new Set(
      values.folders.map((folder) => normalizeFolderName(folder).toLowerCase())
    )
    const query = folderInput.trim().toLowerCase()
    const seen = new Set<string>()
    const filtered = suggestedFolders
      .map((folder) => ({ label: normalizeFolderName(folder.label), emoji: folder.emoji }))
      .filter((folder) => folder.label)
      .filter((folder) => !selected.has(folder.label.toLowerCase()))
      .filter((folder) => (query ? folder.label.toLowerCase().includes(query) : true))
      .filter((folder) => {
        const key = folder.label.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    return filtered.slice(0, 8)
  }, [suggestedFolders, folderInput, values.folders])

  const stepInputRefs = useRef<(TextInput | null)[]>([])

  useEffect(() => {
    if (Platform.OS !== 'android' || !isEmojiModalOpen) {
      setEmojiKeyboardInset(0)
      return
    }

    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setEmojiKeyboardInset(event.endCoordinates.height)
    })
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setEmojiKeyboardInset(0)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
      setEmojiKeyboardInset(0)
    }
  }, [isEmojiModalOpen])

  const canSubmit = useMemo(() => {
    return values.title.trim().length > 0 && !isSubmitting && !isUploadingImage
  }, [values.title, isSubmitting, isUploadingImage])

  const update = useCallback(
    <K extends keyof RecipeFormValues>(key: K, next: RecipeFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: next }))
    },
    []
  )

  const updateStep = useCallback((index: number, next: string) => {
    setValues((prev) => {
      const steps = [...prev.steps]
      steps[index] = next
      return { ...prev, steps }
    })
  }, [])

  const addStep = useCallback(() => {
    setValues((prev) => {
      const nextSteps = [...prev.steps, '']
      return { ...prev, steps: nextSteps }
    })
    requestAnimationFrame(() => {
      const nextIndex = values.steps.length
      stepInputRefs.current[nextIndex]?.focus()
    })
  }, [values.steps.length])

  const removeStep = useCallback((index: number) => {
    setValues((prev) => {
      const steps = prev.steps.filter((_, i) => i !== index)
      return { ...prev, steps: steps.length ? steps : [''] }
    })
  }, [])

  const addFolder = useCallback(
    (nextValue?: unknown, options?: { silentIfExisting?: boolean }) => {
      const candidate = typeof nextValue === 'string' ? nextValue : undefined
      const nextFolder = normalizeFolderName(candidate ?? folderInput)
      if (!nextFolder) return
      const lower = nextFolder.toLowerCase()
      const exists = suggestedFolders.some(
        (folder) => normalizeFolderName(folder.label).toLowerCase() === lower
      )
      const silentIfExisting = options?.silentIfExisting ?? false
      setValues((prev) => {
        if (prev.folders.some((folder) => normalizeFolderName(folder).toLowerCase() === lower)) {
          return prev
        }
        return { ...prev, folders: [...prev.folders, nextFolder] }
      })
      if (exists) {
        if (silentIfExisting) {
          setFolderInput('')
          return
        }
        Alert.alert(
          t('recipes.form.folderExistsTitle'),
          t('recipes.form.folderExistsBody')
        )
      } else {
        void onCreateFolder({
          name: nextFolder,
          emoji: null,
        }).catch((error: any) => {
          const code = error?.code ?? error?.cause?.code
          if (code === '23505') {
            Alert.alert(
              t('recipes.form.folderExistsTitle'),
              t('recipes.form.folderExistsBody')
            )
          } else {
            Alert.alert(t('recipes.form.createFolderErrorTitle'), t('recipes.form.createFolderErrorBody'))
          }
        })
      }
      setFolderInput('')
    },
    [
      folderInput,
      suggestedFolders,
      onCreateFolder,
      t,
    ]
  )

  const removeFolder = useCallback((folderToRemove: string) => {
    setValues((prev) => ({
      ...prev,
      folders: prev.folders.filter((folder) => folder !== folderToRemove),
    }))
  }, [])

  const toggleMealTime = useCallback((mealTime: RecipeMealTime) => {
    setValues((prev) => {
      const hasMealTime = prev.mealTimes.includes(mealTime)
      return {
        ...prev,
        mealTimes: hasMealTime
          ? prev.mealTimes.filter((value) => value !== mealTime)
          : [...prev.mealTimes, mealTime],
      }
    })
  }, [])

  const buildPayload = useCallback((): RecipeFormSubmitValues | null => {
    const payload = buildRecipeFormSubmitValues(values)
    if (!payload) {
      Alert.alert(t('recipes.form.missingTitleTitle'), t('recipes.form.missingTitleBody'))
      return null
    }
    return payload
  }, [t, values])

  const handleSubmit = useCallback(async () => {
    if (isUploadingImage) {
      Alert.alert(t('recipes.form.uploadInProgressTitle'), t('recipes.form.uploadInProgressBody'))
      return
    }
    const payload = buildPayload()
    if (!payload) return
    await onSubmit(payload)
  }, [buildPayload, isUploadingImage, onSubmit, t])

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        void handleSubmit()
      },
    }),
    [handleSubmit]
  )

  const openEmojiModal = useCallback(() => {
    setEmojiDraft(values.emoji)
    setIsEmojiModalOpen(true)
  }, [values.emoji])

  const saveEmoji = useCallback(() => {
    const trimmed = emojiDraft.trim()
    update('emoji', trimmed)
    if (trimmed.length > 0) update('imageUrl', '')
    setIsEmojiModalOpen(false)
  }, [emojiDraft, update])

  const clearCover = useCallback(() => {
    update('emoji', '')
    update('imageUrl', '')
  }, [update])

  const confirmPermissionPrompt = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(title, message, [
        { text: t('recipes.form.permissionNotNow'), style: 'cancel', onPress: () => resolve(false) },
        { text: t('recipes.form.permissionContinue'), onPress: () => resolve(true) },
      ])
    })
  }, [t])

  const ensureLibraryPermission = useCallback(async () => {
    const existing = await ImagePicker.getMediaLibraryPermissionsAsync()
    if (existing.status === 'granted') return true

    const shouldContinue = await confirmPermissionPrompt(
      t('recipes.form.allowPhotoTitle'),
      t('recipes.form.allowPhotoBody')
    )
    if (!shouldContinue) return false
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(t('recipes.form.permissionNeededTitle'), t('recipes.form.permissionPhotoBody'))
      return false
    }
    return true
  }, [confirmPermissionPrompt, t])

  const ensureCameraPermission = useCallback(async () => {
    const existing = await ImagePicker.getCameraPermissionsAsync()
    if (existing.status === 'granted') return true

    const shouldContinue = await confirmPermissionPrompt(
      t('recipes.form.allowCameraTitle'),
      t('recipes.form.allowCameraBody')
    )
    if (!shouldContinue) return false
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(t('recipes.form.permissionNeededTitle'), t('recipes.form.permissionCameraBody'))
      return false
    }
    return true
  }, [confirmPermissionPrompt, t])

  const uploadImageAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      try {
        setIsUploadingImage(true)
        const originalSize = await getPickedImageSizeBytes(asset)
        if (isRecipeImageUploadTooLarge(originalSize)) {
          Alert.alert(t('recipes.form.photoTooLargeTitle'), RECIPE_IMAGE_UPLOAD_TOO_LARGE_MESSAGE)
          return
        }

        const optimized = await optimizeRecipeImageAsset(asset)
        let url = optimized.uri
        if (imageUploadMode === 'local') {
          let size = optimized.fileSize
          if (!size) {
            try {
              const info = await new File(optimized.uri).info()
              size = info.exists && 'size' in info && typeof info.size === 'number' ? info.size : 0
            } catch {
              size = 0
            }
          }

          if (isImportFileTooLarge(size)) {
            Alert.alert(t('recipes.form.fileTooLargeTitle'), IMPORT_FILE_TOO_LARGE_MESSAGE)
            return
          }

          const usage = await getImportsUsageSummary()
          const replacingBytes = isManagedLocalImportImageUri(values.imageUrl)
            ? await getActiveImportBytesByUri(values.imageUrl ?? '')
            : 0
          if (exceedsImportStorageLimit({
            currentBytes: usage.totalBytes,
            replacingBytes,
            nextBytes: size,
            plan,
          })) {
            Alert.alert(
              t('recipes.form.storageLimitTitle'),
              plan === 'premium'
                ? t('recipes.form.storageLimitPremium')
                : t('recipes.form.storageLimitFree')
            )
            return
          }
        } else {
          url = await uploadRecipeImage({
            uri: optimized.uri,
            fileName: optimized.fileName,
            mimeType: optimized.mimeType,
          })
        }

        update('imageUrl', url)
        update('emoji', '')
      } catch (error: any) {
        Alert.alert(t('recipes.form.uploadFailedTitle'), getUserFacingErrorMessage(error))
      } finally {
        setIsUploadingImage(false)
      }
    },
    [imageUploadMode, plan, t, update, values.imageUrl]
  )

  const handlePickImage = useCallback(async () => {
    const ok = await ensureLibraryPermission()
    if (!ok) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    })

    if (result.canceled) return
    const asset = result.assets?.[0]
    if (!asset) return
    await uploadImageAsset(asset)
  }, [ensureLibraryPermission, uploadImageAsset])

  const handleTakePhoto = useCallback(async () => {
    const ok = await ensureCameraPermission()
    if (!ok) return

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    })

    if (result.canceled) return
    const asset = result.assets?.[0]
    if (!asset) return
    await uploadImageAsset(asset)
  }, [ensureCameraPermission, uploadImageAsset])

  const openCoverOptions = useCallback(() => {
    const options: {
      text: string
      onPress?: () => void
      style?: 'default' | 'cancel' | 'destructive'
    }[] = [
      { text: t('recipes.form.coverPickEmoji'), onPress: openEmojiModal },
      { text: t('recipes.form.coverUploadPhoto'), onPress: handlePickImage },
      { text: t('recipes.form.coverTakePhoto'), onPress: handleTakePhoto },
    ]
    if (values.emoji || values.imageUrl) {
      options.push({ text: t('recipes.form.coverRemove'), style: 'destructive', onPress: clearCover })
    }
    options.push({ text: t('recipes.form.coverCancel'), style: 'cancel' })

    Alert.alert(t('recipes.form.coverOptionsTitle'), t('recipes.form.coverOptionsBody'), options)
  }, [clearCover, handlePickImage, handleTakePhoto, openEmojiModal, t, values])

  const moreDetailsSummary = useMemo(() => {
    const filledCount = [
      values.imageUrl || values.emoji,
      values.description,
      values.prepTimeMinutes,
      values.cookTimeMinutes,
      values.servings,
      values.mealTimes.length > 0,
    ].filter(Boolean).length

    if (!filledCount) return t('recipes.form.summaryOptional')
    return t('recipes.form.summaryAdded', { count: filledCount })
  }, [
    values.cookTimeMinutes,
    values.description,
    values.emoji,
    values.imageUrl,
    values.mealTimes.length,
    values.prepTimeMinutes,
    values.servings,
    t,
  ])

  const folderSummary = useMemo(() => {
    if (!values.folders.length) return t('recipes.form.summaryOptional')
    return values.folders.length === 1
      ? t('recipes.form.folderSummaryOne')
      : t('recipes.form.folderSummaryMany', { count: values.folders.length })
  }, [t, values.folders.length])

  const coverPreview = values.imageUrl ? (
    <Image
      source={{ uri: values.imageUrl }}
      style={styles.coverPreviewImage}
      contentFit="cover"
      cachePolicy="memory-disk"
    />
  ) : values.emoji ? (
    <Text style={styles.coverPreviewEmoji}>{values.emoji}</Text>
  ) : (
    <Feather name="image" size={28} color={styles.coverPreviewIcon.color} />
  )

  return (
    <View style={styles.form}>
      <View style={styles.primarySection}>
        <View style={styles.fieldCompact}>
          <Text style={styles.primarySectionLabel}>{t('recipes.form.title')}</Text>
          <TextInput
            value={values.title}
            onChangeText={(t) => update('title', t)}
            placeholder={t('recipes.form.titlePlaceholder')}
            placeholderTextColor={styles.placeholder.color}
            style={[
              styles.titleInput,
              shouldTintPrefilledValues &&
                isPrefilledValue(values.title, initialFormValues.title) &&
                styles.prefilledValue,
            ]}
            editable={!isSubmitting}
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldCompact}>
          <Text style={styles.primarySectionLabel}>{t('recipes.form.ingredients')}</Text>
          <TextInput
            value={values.ingredientsText}
            onChangeText={(t) => update('ingredientsText', t)}
            placeholder={t('recipes.form.ingredientsPlaceholder')}
            placeholderTextColor={styles.placeholder.color}
            style={[
              styles.textareaInput,
              styles.ingredientsInput,
              { height: ingredientsInputHeight },
              shouldTintPrefilledValues &&
                isPrefilledValue(values.ingredientsText, initialFormValues.ingredientsText) &&
                styles.prefilledValue,
            ]}
            editable={!isSubmitting}
            multiline
            scrollEnabled={false}
            onContentSizeChange={({ nativeEvent }) => {
              const nextHeight = Math.max(
                INGREDIENTS_MIN_HEIGHT,
                Math.ceil(nativeEvent.contentSize.height)
              )
              setIngredientsInputHeight((currentHeight) =>
                currentHeight === nextHeight ? currentHeight : nextHeight
              )
            }}
            autoCapitalize="sentences"
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldCompact}>
          <Text style={styles.primarySectionLabel}>{t('recipes.form.steps')}</Text>
          <View style={styles.stepsStack}>
            {values.steps.map((step, index) => {
              const n = index + 1
              const showStepClear = focusedStepIndex === index || step.trim().length > 0

              return (
                <View
                  key={`step-${index}`}
                  style={styles.stepRow}
                >
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{n}</Text>
                  </View>

                  <View style={styles.stepInputWrap}>
                    <TextInput
                      value={step}
                      onChangeText={(t) => updateStep(index, t)}
                      onFocus={() => setFocusedStepIndex(index)}
                      onBlur={() => {
                        setFocusedStepIndex((current) => (current === index ? null : current))
                      }}
                      placeholder={
                        n === 1
                          ? t('recipes.form.firstStepPlaceholder')
                          : t('recipes.form.stepPlaceholder', { step: n })
                      }
                      placeholderTextColor={styles.placeholder.color}
                      style={[
                        styles.stepInput,
                        showStepClear && styles.stepInputWithClear,
                        shouldTintPrefilledValues &&
                          isPrefilledValue(step, initialFormValues.steps[index]) &&
                          styles.prefilledValue,
                      ]}
                      editable={!isSubmitting}
                      autoCapitalize="sentences"
                      ref={(node) => {
                        stepInputRefs.current[index] = node
                      }}
                    />

                    {showStepClear ? (
                      <Pressable
                        onPress={() => removeStep(index)}
                        hitSlop={8}
                        style={styles.stepClearButton}
                        accessibilityRole="button"
                        accessibilityLabel={t('recipes.form.removeStepA11y', { step: n })}
                      >
                        <Feather name="x" size={16} color={styles.stepClearIcon.color} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              )
            })}
          </View>

          <Button
            variant="ghost"
            size="md"
            onPress={addStep}
            disabled={isSubmitting}
            style={styles.addStepButton}
            textStyle={styles.addStepText}
            icon={<Feather name="plus" size={18} color={styles.addStepIcon.color} />}
          >
            {t('recipes.form.addStep')}
          </Button>
        </View>
      </View>

      <View style={styles.collapsibleSection}>
        <Pressable
          onPress={() => setIsMoreDetailsExpanded((current) => !current)}
          style={styles.collapsibleHeader}
          accessibilityRole="button"
          accessibilityLabel={t('recipes.form.moreDetailsA11y')}
        >
          <View style={styles.collapsibleHeaderText}>
            <Text style={styles.collapsibleTitle}>{t('recipes.form.moreDetails')}</Text>
            <Text style={styles.collapsibleMeta}>· {moreDetailsSummary}</Text>
          </View>
          <Feather
            name={isMoreDetailsExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={styles.collapsibleChevron.color}
          />
        </Pressable>

        {isMoreDetailsExpanded ? (
          <View style={styles.collapsibleBody}>
            <View style={styles.fieldCompact}>
              <Text style={styles.label}>{t('recipes.form.cover')}</Text>
              <View style={styles.coverRow}>
                <Pressable
                  onPress={openCoverOptions}
                  style={({ pressed }) => [
                    styles.coverPreview,
                    pressed && styles.coverPreviewPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('recipes.form.editCoverA11y')}
                >
                  {coverPreview}
                  {isUploadingImage ? (
                    <View style={styles.coverUploadingOverlay}>
                      <ActivityIndicator size="small" color={styles.coverPreviewIcon.color} />
                    </View>
                  ) : null}
                </Pressable>

                <View style={styles.coverActions}>
                  <Button
                    variant="secondary"
                    size="md"
                    onPress={handlePickImage}
                    disabled={isSubmitting || isUploadingImage}
                    style={styles.coverActionButton}
                    icon={<Feather name="camera" size={18} color={styles.coverActionIcon.color} />}
                  >
                    {t('recipes.form.photo')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onPress={openEmojiModal}
                    disabled={isSubmitting || isUploadingImage}
                    style={styles.coverActionButton}
                    icon={<Feather name="smile" size={18} color={styles.coverActionIcon.color} />}
                  >
                    {t('recipes.form.emoji')}
                  </Button>
                </View>
              </View>
            </View>

            <View style={styles.fieldCompact}>
              <Text style={styles.label}>{t('recipes.form.notes')}</Text>
              <TextInput
                value={values.description}
                onChangeText={(t) => update('description', t)}
                placeholder={t('recipes.form.notesPlaceholder')}
                placeholderTextColor={styles.placeholder.color}
                multiline
                style={[
                  styles.textareaInput,
                  styles.notesInput,
                  shouldTintPrefilledValues &&
                    isPrefilledValue(values.description, initialFormValues.description) &&
                    styles.prefilledValue,
                ]}
                editable={!isSubmitting}
                autoCapitalize="sentences"
              />
            </View>

            {mode === 'edit' ? (
              <View style={styles.fieldCompact}>
                <Text style={styles.label}>{t('recipes.form.subtitle')}</Text>
                <TextInput
                  value={values.subtitle}
                  onChangeText={(t) => update('subtitle', t)}
                  placeholder={t('recipes.form.optionalPlaceholder')}
                  placeholderTextColor={styles.placeholder.color}
                  style={[
                    styles.detailInput,
                    shouldTintPrefilledValues &&
                      isPrefilledValue(values.subtitle, initialFormValues.subtitle) &&
                      styles.prefilledValue,
                  ]}
                  editable={!isSubmitting}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                />
              </View>
            ) : null}

            <View style={styles.detailsGrid}>
              <View style={styles.detailField}>
                <Text style={[styles.label, styles.detailFieldLabel]}>
                  {t('recipes.form.prepTime')}
                </Text>
                <TextInput
                  value={values.prepTimeMinutes}
                  onChangeText={(t) => update('prepTimeMinutes', t)}
                  placeholder={t('recipes.form.prepTimePlaceholder')}
                  placeholderTextColor={styles.placeholder.color}
                  keyboardType="number-pad"
                  style={[
                    styles.detailInput,
                    shouldTintPrefilledValues &&
                      isPrefilledValue(values.prepTimeMinutes, initialFormValues.prepTimeMinutes) &&
                      styles.prefilledValue,
                  ]}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.detailField}>
                <Text style={[styles.label, styles.detailFieldLabel]}>
                  {t('recipes.form.cookTime')}
                </Text>
                <TextInput
                  value={values.cookTimeMinutes}
                  onChangeText={(t) => update('cookTimeMinutes', t)}
                  placeholder={t('recipes.form.cookTimePlaceholder')}
                  placeholderTextColor={styles.placeholder.color}
                  keyboardType="number-pad"
                  style={[
                    styles.detailInput,
                    shouldTintPrefilledValues &&
                      isPrefilledValue(values.cookTimeMinutes, initialFormValues.cookTimeMinutes) &&
                      styles.prefilledValue,
                  ]}
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.detailField}>
                <Text style={[styles.label, styles.detailFieldLabel]}>
                  {t('recipes.form.servings')}
                </Text>
                <TextInput
                  value={values.servings}
                  onChangeText={(t) => update('servings', t)}
                  placeholder={t('recipes.form.servingsPlaceholder')}
                  placeholderTextColor={styles.placeholder.color}
                  keyboardType="number-pad"
                  style={[
                    styles.detailInput,
                    shouldTintPrefilledValues &&
                      isPrefilledValue(values.servings, initialFormValues.servings) &&
                      styles.prefilledValue,
                  ]}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View style={styles.fieldCompact}>
              <Text style={styles.label}>{t('recipes.form.bestFor')}</Text>
              <View style={styles.tagsRow}>
                {RECIPE_MEAL_TIMES.map((mealTime) => (
                  <MealTimeChip
                    key={mealTime}
                    mealTime={mealTime}
                    selected={values.mealTimes.includes(mealTime)}
                    onPress={() => toggleMealTime(mealTime)}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.sectionDivider} />

      <View style={styles.collapsibleSection}>
        <Pressable
          onPress={() => setIsFoldersExpanded((current) => !current)}
          style={styles.collapsibleHeader}
          accessibilityRole="button"
          accessibilityLabel={t('recipes.form.foldersA11y')}
        >
          <View style={styles.collapsibleHeaderText}>
            <Text style={styles.collapsibleTitle}>{t('recipes.form.addToFolder')}</Text>
            <Text style={styles.collapsibleMeta}>· {folderSummary}</Text>
          </View>
          <Feather
            name={isFoldersExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={styles.collapsibleChevron.color}
          />
        </Pressable>

        {isFoldersExpanded ? (
          <View style={styles.collapsibleBody}>
            {folderContextMessage ? (
              <Text style={styles.helperText}>{folderContextMessage}</Text>
            ) : (
              <Text style={styles.helperText}>
                {t('recipes.form.helper')}
              </Text>
            )}

            {isFolderInputFocused && normalizedSuggestedFolders.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestedFoldersScroll}
                keyboardShouldPersistTaps="handled"
              >
                {normalizedSuggestedFolders.map((folder) => (
                  <TagChip
                    key={`focused-${folder.label}`}
                    label={`${folder.emoji ?? '📁'} ${folder.label}`}
                    onPress={() => addFolder(folder.label, { silentIfExisting: true })}
                  />
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.folderInputRow}>
              <TextInput
                value={folderInput}
                onChangeText={setFolderInput}
                placeholder={t('recipes.form.folderPlaceholder')}
                placeholderTextColor={styles.placeholder.color}
                style={[styles.detailInput, styles.folderInput]}
                editable={!isSubmitting}
                autoCapitalize="words"
                returnKeyType="done"
                onFocus={() => {
                  setIsFolderInputFocused(true)
                }}
                onBlur={() => setIsFolderInputFocused(false)}
                onSubmitEditing={() => addFolder()}
              />
              <Button
                variant="soft"
                size="md"
                onPress={addFolder}
                disabled={isSubmitting}
                style={styles.tagAddButton}
                textStyle={styles.tagAddText}
              >
                {t('recipes.form.add')}
              </Button>
            </View>

            {values.folders.length > 0 ? (
              <View style={styles.tagsRow}>
                {values.folders.map((folder, index) => (
                  <TagChip
                    key={`${normalizeFolderName(folder).toLowerCase()}-${index}`}
                    label={folder}
                    selected
                    onPress={() => removeFolder(folder)}
                  />
                ))}
              </View>
            ) : null}

            {!isFolderInputFocused && normalizedSuggestedFolders.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestedFoldersScroll}
              >
                {normalizedSuggestedFolders.map((folder) => (
                  <TagChip
                    key={folder.label}
                    label={`${folder.emoji ?? '📁'} ${folder.label}`}
                    onPress={() => addFolder(folder.label, { silentIfExisting: true })}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Actions (optional) */}
      {showActions ? (
        <View style={styles.actions}>
          {onCancel ? (
            <Button variant="ghost" size="md" onPress={onCancel} disabled={isSubmitting}>
              {t('recipes.form.cancel')}
            </Button>
          ) : (
            <View />
          )}

          <Button variant="primary" size="md" onPress={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? t('recipes.form.saving') : submitLabel}
          </Button>
        </View>
      ) : null}

      <Modal
        visible={isEmojiModalOpen}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsEmojiModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.modalCard,
              {
                paddingBottom: Math.max(insets.bottom, 24) + 16,
                marginBottom: Platform.OS === 'android' ? emojiKeyboardInset : 0,
              },
            ]}
          >
            <Text style={styles.modalTitle}>{t('recipes.form.pickEmojiTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('recipes.form.pickEmojiBody')}</Text>
            <TextInput
              value={emojiDraft}
              onChangeText={setEmojiDraft}
              placeholder={t('recipes.form.pickEmojiPlaceholder')}
              placeholderTextColor={styles.placeholder.color}
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Button
                variant="secondary"
                size="md"
                onPress={() => setIsEmojiModalOpen(false)}
                style={styles.modalActionButton}
              >
                {t('recipes.form.cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onPress={saveEmoji}
                style={styles.modalActionButton}
              >
                {t('recipes.form.save')}
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
})

export default RecipeForm

const styles = createThemedStyles((theme) => ({
  form: { gap: theme.spacing.lg },
  primarySection: { gap: theme.spacing.xl },
  collapsibleSection: { gap: theme.spacing.md },
  sectionTitle: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  field: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  fieldCompact: {
    gap: theme.spacing.sm,
  },
  primarySectionLabel: {
    ...theme.textVariants.emphasis,
    color: theme.colors.foreground,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  helperText: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  titleInput: {
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  textareaInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.textVariants.body,
    color: theme.colors.foreground,
    textAlignVertical: 'top',
  },
  ingredientsInput: {
    minHeight: INGREDIENTS_MIN_HEIGHT,
  },
  notesInput: {
    minHeight: 112,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  placeholder: { color: theme.colors.mutedForeground },
  prefilledValue: { color: theme.colors.warmGray },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  modalSubtitle: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    color: theme.colors.foreground,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  modalActionButton: {
    flex: 1,
    width: 'auto',
  },
  stepsStack: { gap: theme.spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.creamDark,
  },
  stepBadgeText: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.foreground,
  },
  stepInputWrap: {
    flex: 1,
    position: 'relative',
  },
  stepInput: {
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.full,
    minHeight: 46,
    paddingLeft: theme.spacing.md,
    paddingRight: theme.spacing.md,
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  stepInputWithClear: {
    paddingRight: 40,
  },
  stepClearButton: {
    position: 'absolute',
    right: theme.spacing.md,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepClearIcon: {
    color: theme.colors.mutedForeground,
  },
  addStepButton: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  addStepText: { fontSize: theme.fontSize.base, color: theme.colors.primary },
  addStepIcon: { color: theme.colors.primary },
  tagInputRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  folderInputRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  folderInput: { flex: 1 },
  tagAddButton: {
    width: 'auto',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  tagAddText: { fontSize: theme.fontSize.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  suggestedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  suggestedFoldersScroll: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  collapsibleHeaderText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    flex: 1,
  },
  collapsibleTitle: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  collapsibleMeta: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  collapsibleChevron: {
    color: theme.colors.foreground,
  },
  collapsibleBody: {
    gap: theme.spacing.lg,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  coverPreview: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverPreviewPressed: {
    opacity: 0.96,
  },
  coverPreviewImage: {
    width: '100%',
    height: '100%',
  },
  coverPreviewEmoji: {
    fontSize: 36,
  },
  coverPreviewIcon: {
    color: theme.colors.warmGray,
  },
  coverUploadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.frostedSurface,
  },
  coverActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  coverActionButton: {
    width: 'auto',
    minWidth: 138,
    borderRadius: theme.radii.full,
  },
  coverActionIcon: {
    color: theme.colors.warmGray,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  detailField: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  detailFieldLabel: {
    minHeight: theme.lineHeight.sm * 2,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    minHeight: 46,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
}))
