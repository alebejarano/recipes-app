// src/features/recipes/components/RecipeForm.tsx
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'

import Button from '@/components/Button'
import TagChip from '@/components/TagChip'
import { useCreateFolder } from '@/features/folders/hooks/useCreateFolder'
import { uploadRecipeImage } from '@/features/recipes/api/recipesRepo'
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
  ingredients: string[]
  steps: string[]
  folders: string[]
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
    ingredients: [''],
    steps: [''],
    folders: [],
  }
}

type FolderSuggestion = { label: string; emoji?: string | null }

type Props = {
  initialValues?: RecipeFormValues
  submitLabel: string
  isSubmitting?: boolean
  onSubmit: (values: RecipeFormSubmitValues) => Promise<void> | void
  onCancel?: () => void
  showActions?: boolean
  suggestedFolders?: FolderSuggestion[]
  imageUploadMode?: 'cloud' | 'local'
  allowFolderCreation?: boolean
  onCreateFolder?: (input: { name: string; emoji?: string | null }) => Promise<void>
}

const RecipeForm = forwardRef<RecipeFormHandle, Props>(function RecipeForm(
  {
    initialValues,
    submitLabel,
    isSubmitting,
    onSubmit,
    onCancel,
    showActions = true,
    suggestedFolders = [],
    imageUploadMode = 'cloud',
    allowFolderCreation = true,
    onCreateFolder,
  },
  ref
) {
  const [values, setValues] = useState<RecipeFormValues>(
    initialValues ?? createEmptyRecipeFormValues()
  )
  const [folderInput, setFolderInput] = useState('')
  const [folderEmojiInput, setFolderEmojiInput] = useState('')
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false)
  const [emojiDraft, setEmojiDraft] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const createFolderMutation = useCreateFolder()
  const normalizedSuggestedFolders = useMemo(() => {
    if (!suggestedFolders.length) return []
    const selected = new Set(values.folders.map((folder) => folder.toLowerCase()))
    const query = folderInput.trim().toLowerCase()
    const filtered = suggestedFolders
      .map((folder) => ({ label: folder.label.trim(), emoji: folder.emoji }))
      .filter((folder) => folder.label)
      .filter((folder) => !selected.has(folder.label.toLowerCase()))
      .filter((folder) => (query ? folder.label.toLowerCase().includes(query) : true))
    return filtered.slice(0, 8)
  }, [suggestedFolders, folderInput, values.folders])

  const ingredientInputRefs = useRef<Array<TextInput | null>>([])
  const stepInputRefs = useRef<Array<TextInput | null>>([])

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

  const updateIngredient = useCallback((index: number, next: string) => {
    setValues((prev) => {
      const ingredients = [...prev.ingredients]
      ingredients[index] = next
      return { ...prev, ingredients }
    })
  }, [])

  const addIngredient = useCallback(() => {
    setValues((prev) => {
      const nextIngredients = [...prev.ingredients, '']
      return { ...prev, ingredients: nextIngredients }
    })
  }, [])

  const removeIngredient = useCallback((index: number) => {
    setValues((prev) => {
      const ingredients = prev.ingredients.filter((_, i) => i !== index)
      return { ...prev, ingredients: ingredients.length ? ingredients : [''] }
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

  const normalizeFolder = useCallback((value?: unknown) => {
    if (value === null || value === undefined) return ''
    const text = typeof value === 'string' ? value : String(value)
    return text.trim().replace(/\s+/g, ' ')
  }, [])

  const addFolder = useCallback(
    (nextValue?: unknown) => {
      const candidate = typeof nextValue === 'string' ? nextValue : undefined
      const nextFolder = normalizeFolder(candidate ?? folderInput)
      if (!nextFolder) return
      const lower = nextFolder.toLowerCase()
      const exists = suggestedFolders.some(
        (folder) => folder.label.trim().toLowerCase() === lower
      )
      setValues((prev) => {
        if (prev.folders.some((folder) => folder.toLowerCase() === lower)) return prev
        return { ...prev, folders: [...prev.folders, nextFolder] }
      })
      if (exists) {
        if (folderEmojiInput.trim()) {
          Alert.alert(
            'Folder already exists',
            "We’ll use the existing folder. Its emoji will not be changed here."
          )
        }
      } else if (allowFolderCreation && !createFolderMutation.isPending) {
        const createFolder = onCreateFolder
          ? onCreateFolder({
              name: nextFolder,
              emoji: folderEmojiInput.trim() || null,
            })
          : createFolderMutation.mutateAsync({
              name: nextFolder,
              emoji: folderEmojiInput.trim() || null,
            })

        void createFolder.catch((error: any) => {
          const code = error?.code ?? error?.cause?.code
          if (code === '23505') {
            Alert.alert(
              'Folder already exists',
              'We used the existing folder instead.'
            )
          } else {
            Alert.alert('Unable to create folder', 'Please try again.')
          }
        })
      }
      setFolderInput('')
      setFolderEmojiInput('')
    },
    [
      allowFolderCreation,
      normalizeFolder,
      folderInput,
      folderEmojiInput,
      createFolderMutation,
      suggestedFolders,
      onCreateFolder,
    ]
  )

  const removeFolder = useCallback((folderToRemove: string) => {
    setValues((prev) => ({
      ...prev,
      folders: prev.folders.filter((folder) => folder !== folderToRemove),
    }))
  }, [])

  const buildPayload = useCallback((): RecipeFormSubmitValues | null => {
    const title = values.title.trim()
    if (!title) {
      Alert.alert('Missing title', 'Please enter a recipe title.')
      return null
    }

    const normalizedIngredients = values.ingredients
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
    }
  }, [values])

  const handleSubmit = useCallback(async () => {
    if (isUploadingImage) {
      Alert.alert('Upload in progress', 'Please wait for the image to finish uploading.')
      return
    }
    const payload = buildPayload()
    if (!payload) return
    await onSubmit(payload)
  }, [buildPayload, isUploadingImage, onSubmit])

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
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continue', onPress: () => resolve(true) },
      ])
    })
  }, [])

  const ensureLibraryPermission = useCallback(async () => {
    const existing = await ImagePicker.getMediaLibraryPermissionsAsync()
    if (existing.status === 'granted') return true

    const shouldContinue = await confirmPermissionPrompt(
      'Allow photo access?',
      'We use your photo library to add a cover image for your recipe.'
    )
    if (!shouldContinue) return false
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to upload images.')
      return false
    }
    return true
  }, [confirmPermissionPrompt])

  const ensureCameraPermission = useCallback(async () => {
    const existing = await ImagePicker.getCameraPermissionsAsync()
    if (existing.status === 'granted') return true

    const shouldContinue = await confirmPermissionPrompt(
      'Allow camera access?',
      'We use your camera to take a photo for your recipe cover.'
    )
    if (!shouldContinue) return false
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your camera to take a photo.')
      return false
    }
    return true
  }, [confirmPermissionPrompt])

  const uploadImageAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      try {
        setIsUploadingImage(true)
        const url =
          imageUploadMode === 'local'
            ? asset.uri
            : await uploadRecipeImage({
                uri: asset.uri,
                fileName: asset.fileName ?? null,
                mimeType: asset.mimeType ?? null,
              })
        update('imageUrl', url)
        update('emoji', '')
      } catch (error: any) {
        Alert.alert('Upload failed', error?.message ?? 'Please try again.')
      } finally {
        setIsUploadingImage(false)
      }
    },
    [imageUploadMode, update]
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
    const options: Array<{
      text: string
      onPress?: () => void
      style?: 'default' | 'cancel' | 'destructive'
    }> = [
      { text: 'Pick emoji', onPress: openEmojiModal },
      { text: 'Upload photo', onPress: handlePickImage },
      { text: 'Take photo', onPress: handleTakePhoto },
    ]
    if (values.emoji || values.imageUrl) {
      options.push({ text: 'Remove', style: 'destructive', onPress: clearCover })
    }
    options.push({ text: 'Cancel', style: 'cancel' })

    Alert.alert('Add cover', 'Choose an emoji or a photo.', options)
  }, [clearCover, handlePickImage, handleTakePhoto, openEmojiModal, values])

  return (
    <View style={styles.form}>
      {/* Basics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basics</Text>

        <Pressable
          onPress={openCoverOptions}
          style={({ pressed }) => [
            styles.coverCard,
            pressed && styles.coverCardPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add emoji or photo"
        >
          {values.imageUrl ? (
            <Image source={{ uri: values.imageUrl }} style={styles.coverImage} />
          ) : values.emoji ? (
            <Text style={styles.coverEmoji}>{values.emoji}</Text>
          ) : (
            <View style={styles.coverPlaceholder}>
              <View style={styles.coverIconWrap}>
                <Feather name="camera" size={20} color={styles.coverHint.color} />
              </View>
              <Text style={styles.coverHint}>Add emoji or photo</Text>
            </View>
          )}

          {isUploadingImage ? (
            <View style={styles.coverOverlay}>
              <ActivityIndicator size="small" color={styles.coverHint.color} />
              <Text style={styles.coverHint}>Uploading…</Text>
            </View>
          ) : null}
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={values.title}
            onChangeText={(t) => update('title', t)}
            placeholder="e.g. Lemon Chicken"
            placeholderTextColor={styles.placeholder.color}
            style={styles.input}
            editable={!isSubmitting}
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Subtitle</Text>
          <TextInput
            value={values.subtitle}
            onChangeText={(t) => update('subtitle', t)}
            placeholder="Optional"
            placeholderTextColor={styles.placeholder.color}
            style={styles.input}
            editable={!isSubmitting}
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={values.description}
            onChangeText={(t) => update('description', t)}
            placeholder="Optional notes, context, serving ideas…"
            placeholderTextColor={styles.placeholder.color}
            multiline
            style={[styles.input, styles.textarea]}
            editable={!isSubmitting}
            autoCapitalize="sentences"
          />
        </View>
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>

        <View style={styles.row}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Prep (min)</Text>
            <TextInput
              value={values.prepTimeMinutes}
              onChangeText={(t) => update('prepTimeMinutes', t)}
              placeholder="e.g. 10"
              placeholderTextColor={styles.placeholder.color}
              keyboardType="number-pad"
              style={styles.input}
              editable={!isSubmitting}
            />
          </View>

          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Cook (min)</Text>
            <TextInput
              value={values.cookTimeMinutes}
              onChangeText={(t) => update('cookTimeMinutes', t)}
              placeholder="e.g. 25"
              placeholderTextColor={styles.placeholder.color}
              keyboardType="number-pad"
              style={styles.input}
              editable={!isSubmitting}
            />
          </View>

          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Servings</Text>
            <TextInput
              value={values.servings}
              onChangeText={(t) => update('servings', t)}
              placeholder="e.g. 2"
              placeholderTextColor={styles.placeholder.color}
              keyboardType="number-pad"
              style={styles.input}
              editable={!isSubmitting}
            />
          </View>
        </View>
      </View>

      {/* Ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>

        <View style={styles.field}>
          <Text style={styles.label}>List</Text>

          <View style={styles.stepsStack}>
            {values.ingredients.map((ingredient, index) => {
              const n = index + 1
              return (
                <View
                  key={`ingredient-${index}`}
                  style={styles.ingredientRow}
                >
                  <TextInput
                    value={ingredient}
                    onChangeText={(t) => updateIngredient(index, t)}
                    placeholder={`Ingredient ${n}`}
                    placeholderTextColor={styles.placeholder.color}
                    style={[styles.input, styles.stepInput]}
                    editable={!isSubmitting}
                    autoCapitalize="sentences"
                    ref={(node) => {
                      ingredientInputRefs.current[index] = node
                    }}
                  />

                  {values.ingredients.length > 1 ? (
                    <Text
                      style={styles.removeStep}
                      onPress={() => removeIngredient(index)}
                      accessibilityRole="button"
                    >
                      Remove
                    </Text>
                  ) : null}
                </View>
              )
            })}
          </View>

          <Button
            variant="ghost"
            size="md"
            onPress={addIngredient}
            disabled={isSubmitting}
            style={styles.addStepButton}
            textStyle={styles.addStepText}
          >
            Add ingredient
          </Button>
        </View>
      </View>

      {/* Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Steps</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Instructions</Text>

          <View style={styles.stepsStack}>
            {values.steps.map((step, index) => {
              const n = index + 1
              return (
                <View
                  key={`step-${index}`}
                  style={styles.stepRow}
                >
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{n}</Text>
                  </View>

                  <TextInput
                    value={step}
                    onChangeText={(t) => updateStep(index, t)}
                    placeholder={`Step ${n}`}
                    placeholderTextColor={styles.placeholder.color}
                    style={[styles.input, styles.stepInput]}
                    editable={!isSubmitting}
                    autoCapitalize="sentences"
                    ref={(node) => {
                      stepInputRefs.current[index] = node
                    }}
                  />

                  {values.steps.length > 1 ? (
                    <Text
                      style={styles.removeStep}
                      onPress={() => removeStep(index)}
                      accessibilityRole="button"
                    >
                      Remove
                    </Text>
                  ) : null}
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
          >
            Add step
          </Button>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add to a folder (optional)</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Folders</Text>

          <View style={styles.tagInputRow}>
            <TextInput
              value={folderEmojiInput}
              onChangeText={setFolderEmojiInput}
              placeholder="📁"
              placeholderTextColor={styles.placeholder.color}
              style={[styles.input, styles.folderEmojiInput]}
              editable={!isSubmitting}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={() => addFolder()}
            />
            <TextInput
              value={folderInput}
              onChangeText={setFolderInput}
              placeholder="e.g. Healthy"
              placeholderTextColor={styles.placeholder.color}
              style={[styles.input, styles.tagInput]}
              editable={!isSubmitting}
              autoCapitalize="words"
              returnKeyType="done"
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
              Add
            </Button>
          </View>

          {values.folders.length > 0 ? (
            <View style={styles.tagsRow}>
              {values.folders.map((folder) => (
                <TagChip
                  key={folder}
                  label={folder}
                  selected
                  onPress={() => removeFolder(folder)}
                />
              ))}
            </View>
          ) : null}

          {normalizedSuggestedFolders.length > 0 ? (
            <View style={styles.suggestedTags}>
              {normalizedSuggestedFolders.map((folder) => (
                <TagChip
                  key={folder.label}
                  label={`${folder.emoji ?? '📁'} ${folder.label}`}
                  onPress={() => addFolder(folder.label)}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {/* Actions (optional) */}
      {showActions ? (
        <View style={styles.actions}>
          {onCancel ? (
            <Button variant="ghost" size="md" onPress={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : (
            <View />
          )}

          <Button variant="primary" size="md" onPress={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </View>
      ) : null}

      <Modal
        visible={isEmojiModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEmojiModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pick an emoji</Text>
            <Text style={styles.modalSubtitle}>
              Choose a single emoji to represent this recipe.
            </Text>
            <TextInput
              value={emojiDraft}
              onChangeText={setEmojiDraft}
              placeholder="e.g. 🍋"
              placeholderTextColor={styles.placeholder.color}
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Button
                variant="secondary"
                size="md"
                onPress={() => setIsEmojiModalOpen(false)}
                style={styles.modalActionButton}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onPress={saveEmoji}
                style={styles.modalActionButton}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
})

export default RecipeForm

const styles = createThemedStyles((theme) => ({
  form: { gap: theme.spacing.lg },
  section: { gap: theme.spacing.sm },
  sectionTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  field: { gap: theme.spacing.xs },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
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
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  placeholder: { color: theme.colors.mutedForeground },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  coverCard: {
    height: 160,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverCardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  coverPlaceholder: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  coverIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
  },
  coverHint: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  coverEmoji: {
    fontSize: 48,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  modalTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.foreground,
  },
  modalSubtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
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
  ingredientRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.creamDark,
  },
  stepBadgeText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  stepInput: { flex: 1, paddingVertical: theme.spacing.xs },
  removeStep: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  addStepButton: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  addStepText: { fontSize: theme.fontSize.sm },
  tagInputRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  folderEmojiInput: {
    width: 56,
    textAlign: 'center',
  },
  tagInput: { flex: 1 },
  tagAddButton: {
    width: 'auto',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
  },
  tagAddText: { fontSize: theme.fontSize.sm },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  suggestedTags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
}))
