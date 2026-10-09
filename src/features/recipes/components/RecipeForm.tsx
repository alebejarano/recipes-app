// src/features/recipes/components/RecipeForm.tsx
import { File } from '@/lib/fileSystem'
import { Feather } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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

import Button from '@/components/Button'
import TagChip from '@/components/TagChip'
import { useTranslation } from '@/localization'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { uploadRecipeImage } from '@/features/recipes/api/recipesRepo'
import MealTimeChip from '@/features/recipes/components/MealTimeChip'
import type { ImportPlan } from '@/features/recipes/storage/importsStorage'
import { RECIPE_MEAL_TIMES, type RecipeMealTime } from '@/features/recipes/types/mealTimes'
import {
  optimizePickerImageAsset,
  type OptimizedImageAsset,
} from '@/features/recipes/utils/optimizeImageAsset'
import { isRecipeImageUploadTooLarge } from '@/features/recipes/utils/recipeValidation'
import {
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
  ingredients: RecipeFormIngredient[]
  steps: string[]
  folders: string[]
  mealTimes: RecipeMealTime[]
}

export type RecipeFormIngredient = {
  quantity: string
  unit: string
  name: string
  notes: string
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
  ingredients: RecipeFormIngredient[] | null
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

  const normalizedIngredients = values.ingredients
    .map((ingredient) => ({
      quantity: ingredient.quantity.trim(),
      unit: ingredient.unit.trim(),
      name: ingredient.name.trim(),
      notes: ingredient.notes.trim(),
    }))
    .filter((ingredient) => ingredient.name)
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
    ingredients: [{ quantity: '', unit: '', name: '', notes: '' }],
    steps: [''],
    folders: [],
    mealTimes: [],
  }
}

type FolderSuggestion = { label: string; emoji?: string | null }

type UnitOption = {
  value: string
  group: 'weight' | 'volume' | 'other'
  label?: 'unitPiece' | 'unitPinch' | 'unitClove' | 'unitCan' | 'noUnit'
}

const UNIT_OPTIONS: UnitOption[] = [
  { value: 'g', group: 'weight' },
  { value: 'kg', group: 'weight' },
  { value: 'oz', group: 'weight' },
  { value: 'lb', group: 'weight' },
  { value: 'ml', group: 'volume' },
  { value: 'l', group: 'volume' },
  { value: 'tsp', group: 'volume' },
  { value: 'tbsp', group: 'volume' },
  { value: 'fl oz', group: 'volume' },
  { value: 'cup', group: 'volume' },
  { value: 'piece', label: 'unitPiece', group: 'other' },
  { value: 'pinch', label: 'unitPinch', group: 'other' },
  { value: 'clove', label: 'unitClove', group: 'other' },
  { value: 'can', label: 'unitCan', group: 'other' },
  { value: '', label: 'noUnit', group: 'other' },
]

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
  onUnitPickerVisibilityChange?: (isVisible: boolean) => void
}

const IMAGE_QUALITY_STEPS = [
  RECIPE_IMAGE_MASTER_COMPRESS_QUALITY,
  0.72,
  0.66,
  0.58,
  0.5,
]

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
    plan: _plan = 'free',
    onUnitPickerVisibilityChange,
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
  const [isCoverOptionsModalOpen, setIsCoverOptionsModalOpen] = useState(false)
  const [isPhotoOptionsModalOpen, setIsPhotoOptionsModalOpen] = useState(false)
  const [unitPickerIndex, setUnitPickerIndex] = useState<number | null>(null)
  const [unitSearch, setUnitSearch] = useState('')
  const [unitPickerHeight, setUnitPickerHeight] = useState<number | null>(null)
  const [emojiDraft, setEmojiDraft] = useState('')
  const [emojiKeyboardInset, setEmojiKeyboardInset] = useState(0)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [focusedStepIndex, setFocusedStepIndex] = useState<number | null>(null)
  const [focusedIngredientIndex, setFocusedIngredientIndex] = useState<number | null>(null)
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

  const unitPickerRefs = useRef<(React.ElementRef<typeof Pressable> | null)[]>([])

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

  const updateIngredient = useCallback((index: number, key: keyof RecipeFormIngredient, next: string) => {
    setValues((prev) => {
      const ingredients = [...prev.ingredients]
      ingredients[index] = { ...ingredients[index], [key]: next }
      return { ...prev, ingredients }
    })
  }, [])

  const openUnitPicker = useCallback((index: number) => {
    Keyboard.dismiss()
    setUnitSearch('')
    setUnitPickerHeight(null)
    setFocusedIngredientIndex(index)
    setUnitPickerIndex(index)
  }, [])

  const selectUnit = useCallback((unit: string) => {
    if (unitPickerIndex === null) return
    const selectedIndex = unitPickerIndex
    updateIngredient(selectedIndex, 'unit', unit)
    setUnitPickerIndex(null)

    requestAnimationFrame(() => {
      unitPickerRefs.current[selectedIndex]?.focus()
    })
  }, [unitPickerIndex, updateIngredient])

  const closeUnitPicker = useCallback(() => {
    setUnitPickerIndex(null)
    setUnitPickerHeight(null)
    setFocusedIngredientIndex(null)
  }, [])

  useEffect(() => {
    onUnitPickerVisibilityChange?.(unitPickerIndex !== null)
    return () => onUnitPickerVisibilityChange?.(false)
  }, [onUnitPickerVisibilityChange, unitPickerIndex])

  const handleUnitPickerLayout = useCallback((height: number) => {
    if (!unitSearch.trim()) setUnitPickerHeight(height)
  }, [unitSearch])

  const getUnitOptionLabel = useCallback((option: UnitOption) => {
    if (option.label === 'unitPiece') return t('recipes.form.unitPiece')
    if (option.label === 'unitPinch') return t('recipes.form.unitPinch')
    if (option.label === 'unitClove') return t('recipes.form.unitClove')
    if (option.label === 'unitCan') return t('recipes.form.unitCan')
    if (option.label === 'noUnit') return t('recipes.form.noUnit')
    return option.value
  }, [t])

  const filteredUnits = useMemo(() => {
    const query = unitSearch.trim().toLowerCase()
    return UNIT_OPTIONS.filter((option) => !query || getUnitOptionLabel(option).toLowerCase().includes(query))
  }, [getUnitOptionLabel, unitSearch])

  const addIngredient = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { quantity: '', unit: '', name: '', notes: '' }],
    }))
  }, [])

  const removeIngredient = useCallback((index: number) => {
    setValues((prev) => {
      const ingredients = prev.ingredients.filter((_, itemIndex) => itemIndex !== index)
      return { ...prev, ingredients: ingredients.length ? ingredients : [{ quantity: '', unit: '', name: '', notes: '' }] }
    })
  }, [])

  const addStep = useCallback(() => {
    setValues((prev) => {
      const nextSteps = [...prev.steps, '']
      return { ...prev, steps: nextSteps }
    })
  }, [])

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
          // Local cover photos are recipe assets, not imported recipe files.
          // They are copied when the recipe is saved and must not consume the
          // import quota or appear in import management.
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
    [imageUploadMode, t, update]
  )

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    })

    if (result.canceled) return
    const asset = result.assets?.[0]
    if (!asset) return
    await uploadImageAsset(asset)
  }, [uploadImageAsset])

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
    setIsCoverOptionsModalOpen(true)
  }, [])

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
          <View style={styles.ingredientsStack}>
            {values.ingredients.map((ingredient, index) => (
              <View key={`ingredient-${index}`} style={[styles.ingredientEditor, focusedIngredientIndex === index && styles.ingredientEditorActive]}>
                <View style={styles.ingredientRow}>
                  <View style={styles.ingredientFieldGroup}>
                    <TextInput value={ingredient.quantity} onChangeText={(value) => updateIngredient(index, 'quantity', value)} onFocus={() => setFocusedIngredientIndex(index)} onBlur={() => setFocusedIngredientIndex((current) => current === index ? null : current)} placeholder={t('recipes.form.quantityPlaceholder')} placeholderTextColor={styles.placeholder.color} style={[styles.ingredientGroupInput, styles.ingredientQuantity]} keyboardType="decimal-pad" editable={!isSubmitting} />
                    <Pressable ref={(node) => { unitPickerRefs.current[index] = node }} onPress={() => openUnitPicker(index)} disabled={isSubmitting} style={styles.ingredientUnitPicker} accessibilityRole="button" accessibilityLabel={t('recipes.form.unitPlaceholder')}>
                      <Text numberOfLines={1} style={[styles.ingredientUnitText, !ingredient.unit && styles.placeholder]}>{ingredient.unit ? getUnitOptionLabel(UNIT_OPTIONS.find((option) => option.value === ingredient.unit) ?? { value: ingredient.unit, group: 'other' }) : t('recipes.form.unitPlaceholder')}</Text>
                      <Feather name="chevron-down" size={18} color={styles.ingredientUnitText.color} />
                    </Pressable>
                    <TextInput value={ingredient.name} onChangeText={(value) => updateIngredient(index, 'name', value)} onFocus={() => setFocusedIngredientIndex(index)} onBlur={() => setFocusedIngredientIndex((current) => current === index ? null : current)} placeholder={t('recipes.form.ingredientNamePlaceholder')} placeholderTextColor={styles.placeholder.color} style={[styles.ingredientGroupInput, styles.ingredientName]} autoCapitalize="sentences" editable={!isSubmitting} />
                    <Pressable onPress={() => removeIngredient(index)} disabled={isSubmitting} hitSlop={8} style={styles.ingredientRemoveButton} accessibilityRole="button" accessibilityLabel={t('recipes.form.removeIngredientA11y', { ingredient: index + 1 })}>
                      <Feather name="x" size={16} color={styles.stepClearIcon.color} />
                    </Pressable>
                  </View>
                </View>
                <TextInput value={ingredient.notes} onChangeText={(value) => updateIngredient(index, 'notes', value)} onFocus={() => setFocusedIngredientIndex(index)} onBlur={() => setFocusedIngredientIndex((current) => current === index ? null : current)} placeholder={t('recipes.form.ingredientNotesPlaceholder')} placeholderTextColor={styles.placeholder.color} style={styles.ingredientNotesInput} autoCapitalize="sentences" editable={!isSubmitting} />
              </View>
            ))}
            <Button
              variant="ghost"
              size="md"
              onPress={addIngredient}
              disabled={isSubmitting}
              style={styles.addIngredientButton}
              textStyle={styles.addStepText}
              icon={<Feather name="plus" size={18} color={styles.addStepIcon.color} />}
            >
              {t('recipes.form.addIngredient')}
            </Button>
          </View>
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
                        focusedStepIndex === index && styles.stepInputFocused,
                        showStepClear && styles.stepInputWithClear,
                        shouldTintPrefilledValues &&
                          isPrefilledValue(step, initialFormValues.steps[index]) &&
                          styles.prefilledValue,
                      ]}
                      editable={!isSubmitting}
                      autoCapitalize="sentences"
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
                    onPress={() => setIsPhotoOptionsModalOpen(true)}
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
        visible={unitPickerIndex !== null}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeUnitPicker}
      >
        <KeyboardAvoidingView
          style={styles.unitPickerBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalDismissArea} onPress={closeUnitPicker} accessibilityRole="button" accessibilityLabel={t('recipes.form.cancel')} />
          <View
            onLayout={(event) => handleUnitPickerLayout(event.nativeEvent.layout.height)}
            style={[
              styles.unitPickerSheet,
              unitSearch.trim() && unitPickerHeight ? { height: unitPickerHeight } : undefined,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <View style={styles.unitPickerHandle} />
            <Text style={styles.unitPickerTitle}>{t('recipes.form.unitPickerTitle')}</Text>
            <Text style={styles.unitPickerSubtitle}>
              {unitPickerIndex === null ? '' : t('recipes.form.unitPickerFor', {
                quantity: values.ingredients[unitPickerIndex]?.quantity || '—',
                name: values.ingredients[unitPickerIndex]?.name || t('recipes.form.ingredientNamePlaceholder'),
              })}
            </Text>
            <View style={styles.unitSearch}>
              <Feather name="search" size={20} color={styles.unitSearchIcon.color} />
              <TextInput value={unitSearch} onChangeText={setUnitSearch} placeholder={t('recipes.form.typeUnitPlaceholder')} placeholderTextColor={styles.placeholder.color} style={styles.unitSearchInput} autoCapitalize="none" autoCorrect={false} />
            </View>
            <ScrollView
              style={unitSearch.trim() ? styles.unitGroupsScroll : undefined}
              contentContainerStyle={[styles.unitGroups, { paddingBottom: insets.bottom }]}
              keyboardShouldPersistTaps="handled"
            >
              {unitSearch.trim() && !UNIT_OPTIONS.some((option) => option.value.toLowerCase() === unitSearch.trim().toLowerCase()) ? (
                <Pressable onPress={() => selectUnit(unitSearch.trim())} style={styles.customUnitOption} accessibilityRole="button">
                  <Feather name="plus" size={18} color={styles.addStepIcon.color} />
                  <Text style={styles.customUnitOptionText}>{t('recipes.form.useCustomUnit', { unit: unitSearch.trim() })}</Text>
                </Pressable>
              ) : null}
              {(['weight', 'volume', 'other'] as const).map((group) => {
                const units = filteredUnits.filter((option) => option.group === group)
                if (!units.length) return null
                const title = group === 'weight'
                  ? t('recipes.form.unitGroupWeight')
                  : group === 'volume'
                    ? t('recipes.form.unitGroupVolume')
                    : t('recipes.form.unitGroupOther')
                return (
                  <View key={group} style={styles.unitGroup}>
                    <Text style={styles.unitGroupTitle}>{title}</Text>
                    <View style={styles.unitOptions}>
                      {units.map((option) => {
                        const isSelected = values.ingredients[unitPickerIndex ?? 0]?.unit === option.value
                        const label = getUnitOptionLabel(option)
                        return <Pressable key={option.label ?? option.value} onPress={() => selectUnit(option.value)} style={[styles.unitOption, isSelected && styles.unitOptionSelected]} accessibilityRole="button" accessibilityState={{ selected: isSelected }}>
                          <Text style={[styles.unitOptionText, isSelected && styles.unitOptionTextSelected]}>{label}</Text>
                        </Pressable>
                      })}
                    </View>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isCoverOptionsModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsCoverOptionsModalOpen(false)}
      >
        <View style={styles.centeredModalBackdrop}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setIsCoverOptionsModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('recipes.form.coverCancel')}
          />
          <View style={styles.centeredModalCard}>
            <Text style={styles.modalTitle}>{t('recipes.form.coverOptionsTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('recipes.form.coverOptionsBody')}</Text>
            <View style={styles.photoOptionsActions}>
              <Button
                variant="secondary"
                size="md"
                onPress={() => {
                  setIsCoverOptionsModalOpen(false)
                  void handleTakePhoto()
                }}
              >
                {t('recipes.form.coverTakePhoto')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onPress={() => {
                  setIsCoverOptionsModalOpen(false)
                  void handlePickImage()
                }}
              >
                {t('recipes.form.coverUploadPhoto')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onPress={() => {
                  setIsCoverOptionsModalOpen(false)
                  openEmojiModal()
                }}
              >
                {t('recipes.form.coverPickEmoji')}
              </Button>
              {values.emoji || values.imageUrl ? (
                <Button
                  variant="ghost"
                  size="md"
                  onPress={() => {
                    clearCover()
                    setIsCoverOptionsModalOpen(false)
                  }}
                  textStyle={styles.removeCoverText}
                >
                  {t('recipes.form.coverRemove')}
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="md"
                onPress={() => setIsCoverOptionsModalOpen(false)}
              >
                {t('recipes.form.coverCancel')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isPhotoOptionsModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsPhotoOptionsModalOpen(false)}
      >
        <View style={styles.centeredModalBackdrop}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setIsPhotoOptionsModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('recipes.form.coverCancel')}
          />
          <View style={styles.centeredModalCard}>
            <Text style={styles.modalTitle}>{t('recipes.form.photoOptionsTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('recipes.form.photoOptionsBody')}</Text>
            <View style={styles.photoOptionsActions}>
              <Button
                variant="secondary"
                size="md"
                onPress={() => {
                  setIsPhotoOptionsModalOpen(false)
                  void handleTakePhoto()
                }}
              >
                {t('recipes.form.coverTakePhoto')}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onPress={() => {
                  setIsPhotoOptionsModalOpen(false)
                  void handlePickImage()
                }}
              >
                {t('recipes.form.coverUploadPhoto')}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onPress={() => setIsPhotoOptionsModalOpen(false)}
              >
                {t('recipes.form.coverCancel')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEmojiModalOpen}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsEmojiModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.centeredModalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setIsEmojiModalOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('recipes.form.cancel')}
          />
          <View
            style={[
              styles.centeredModalCard,
              {
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
  ingredientsStack: { gap: theme.spacing.sm },
  ingredientEditor: { overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, backgroundColor: theme.colors.card },
  ingredientEditorActive: { borderColor: theme.colors.primary },
  ingredientRow: { flexDirection: 'row', alignItems: 'stretch' },
  ingredientFieldGroup: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'stretch' },
  ingredientGroupInput: { ...theme.textVariants.body, color: theme.colors.foreground, paddingHorizontal: theme.spacing.md },
  ingredientQuantity: { width: 64, paddingHorizontal: theme.spacing.sm, borderRightWidth: 1, borderRightColor: theme.colors.border },
  ingredientUnitPicker: { width: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.xs, paddingHorizontal: theme.spacing.md, borderRightWidth: 1, borderRightColor: theme.colors.border },
  ingredientUnitText: { ...theme.textVariants.body, flexShrink: 1, color: theme.colors.foreground },
  ingredientName: { flex: 1 },
  ingredientNotesInput: { borderTopWidth: 1, borderTopColor: theme.colors.border, ...theme.textVariants.caption, color: theme.colors.foreground, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  ingredientRemoveButton: { width: 44, alignItems: 'center', justifyContent: 'center' },
  addIngredientButton: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  notesInput: {
    minHeight: 112,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  placeholder: { color: theme.colors.mutedForeground },
  prefilledValue: { color: theme.colors.warmGray },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  centeredModalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.overlay,
  },
  modalDismissArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  unitPickerBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  unitPickerSheet: { maxHeight: '78%', flexShrink: 0, gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xl, borderTopLeftRadius: theme.radii.xxl, borderTopRightRadius: theme.radii.xxl, backgroundColor: theme.colors.background },
  unitPickerHandle: { alignSelf: 'center', width: 80, height: 5, borderRadius: 999, backgroundColor: theme.colors.border },
  unitPickerTitle: { ...theme.textVariants.title, color: theme.colors.foreground },
  unitPickerSubtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground, marginTop: -theme.spacing.sm },
  unitSearch: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, borderRadius: theme.radii.xl, backgroundColor: theme.colors.muted },
  unitSearchIcon: { color: theme.colors.mutedForeground },
  unitSearchInput: { flex: 1, ...theme.textVariants.body, color: theme.colors.foreground },
  unitGroupsScroll: { flex: 1 },
  unitGroups: { gap: theme.spacing.lg, paddingBottom: theme.spacing.md },
  unitGroup: { gap: theme.spacing.sm },
  unitGroupTitle: { ...theme.textVariants.emphasis, color: theme.colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1.1 },
  unitOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  unitOption: { minWidth: 104, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.lg, backgroundColor: theme.colors.background },
  unitOptionSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
  unitOptionText: { ...theme.textVariants.body, color: theme.colors.foreground },
  unitOptionTextSelected: { color: theme.colors.primaryForeground },
  customUnitOption: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: theme.spacing.xs, paddingVertical: theme.spacing.xs },
  customUnitOptionText: { ...theme.textVariants.body, color: theme.colors.primary },
  centeredModalCard: {
    width: '100%',
    maxWidth: 420,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.card,
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
  photoOptionsActions: {
    gap: theme.spacing.sm,
    width: '100%',
  },
  removeCoverText: {
    color: theme.colors.destructive,
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
  stepInputFocused: { borderColor: theme.colors.primary },
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
