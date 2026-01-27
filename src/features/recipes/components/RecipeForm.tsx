// src/features/recipes/components/RecipeForm.tsx
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Alert, Text, TextInput, View } from 'react-native'

import Button from '@/components/Button'
import TagChip from '@/components/TagChip'
import { createThemedStyles } from '@/styles/createStyles'

export type RecipeFormValues = {
  title: string
  subtitle: string
  description: string
  prepTimeMinutes: string
  cookTimeMinutes: string
  servings: string
  ingredients: string[]
  steps: string[]
  tags: string[]
}

export type RecipeFormSubmitValues = {
  title: string
  subtitle: string | null
  description: string | null
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null
  ingredients: string[] | null
  steps: string[] | null
  tags: string[] | null
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
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    servings: '',
    ingredients: [''],
    steps: [''],
    tags: [],
  }
}

type TagSuggestion = { label: string; count: number }

type Props = {
  initialValues?: RecipeFormValues
  submitLabel: string
  isSubmitting?: boolean
  onSubmit: (values: RecipeFormSubmitValues) => Promise<void> | void
  onCancel?: () => void
  showActions?: boolean
  suggestedTags?: TagSuggestion[]

  /** Called by fields when they need the parent ScrollView to scroll */
  onRequestScrollTo?: (y: number) => void
}

const RecipeForm = forwardRef<RecipeFormHandle, Props>(function RecipeForm(
  {
    initialValues,
    submitLabel,
    isSubmitting,
    onSubmit,
    onCancel,
    showActions = true,
    suggestedTags = [],
    onRequestScrollTo,
  },
  ref
) {
  const [values, setValues] = useState<RecipeFormValues>(
    initialValues ?? createEmptyRecipeFormValues()
  )
  const [tagInput, setTagInput] = useState('')
  const normalizedSuggestedTags = useMemo(() => {
    if (!suggestedTags.length) return []
    const selected = new Set(values.tags.map((tag) => tag.toLowerCase()))
    const query = tagInput.trim().toLowerCase()
    const filtered = suggestedTags
      .map((tag) => ({ label: tag.label.trim(), count: tag.count }))
      .filter((tag) => tag.label)
      .filter((tag) => !selected.has(tag.label.toLowerCase()))
      .filter((tag) => (query ? tag.label.toLowerCase().includes(query) : true))
    return filtered.slice(0, 8)
  }, [suggestedTags, tagInput, values.tags])

  // Store Y positions (relative to the ScrollView content)
  const ingredientRowY = useRef<number[]>([])
  const stepRowY = useRef<number[]>([])
  const ingredientSectionY = useRef(0)
  const ingredientFieldY = useRef(0)
  const ingredientStackY = useRef(0)
  const stepSectionY = useRef(0)
  const stepFieldY = useRef(0)
  const stepStackY = useRef(0)
  const ingredientInputRefs = useRef<Array<TextInput | null>>([])
  const stepInputRefs = useRef<Array<TextInput | null>>([])

  const canSubmit = useMemo(() => {
    return values.title.trim().length > 0 && !isSubmitting
  }, [values.title, isSubmitting])

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
    requestAnimationFrame(() => {
      const nextIndex = values.ingredients.length
      ingredientInputRefs.current[nextIndex]?.focus()
    })
  }, [values.ingredients.length])

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

  const normalizeTag = useCallback((value: string) => {
    return value.trim().replace(/\s+/g, ' ')
  }, [])

  const addTag = useCallback(
    (nextValue?: string) => {
      const nextTag = normalizeTag(nextValue ?? tagInput)
    if (!nextTag) return
    const lower = nextTag.toLowerCase()
    setValues((prev) => {
      if (prev.tags.some((tag) => tag.toLowerCase() === lower)) return prev
      return { ...prev, tags: [...prev.tags, nextTag] }
    })
    setTagInput('')
    },
    [normalizeTag, tagInput]
  )

  const removeTag = useCallback((tagToRemove: string) => {
    setValues((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
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
    const normalizedTags = values.tags.map((tag) => tag.trim()).filter(Boolean)

    return {
      title,
      subtitle: normalizeOptionalText(values.subtitle),
      description: normalizeOptionalText(values.description),
      prepTimeMinutes: parseOptionalInt(values.prepTimeMinutes),
      cookTimeMinutes: parseOptionalInt(values.cookTimeMinutes),
      servings: parseOptionalInt(values.servings),
      ingredients: normalizedIngredients.length ? normalizedIngredients : null,
      steps: normalizedSteps.length ? normalizedSteps : null,
      tags: normalizedTags.length ? normalizedTags : null,
    }
  }, [values])

  const handleSubmit = useCallback(async () => {
    const payload = buildPayload()
    if (!payload) return
    await onSubmit(payload)
  }, [buildPayload, onSubmit])

  useImperativeHandle(
    ref,
    () => ({
      submit: () => {
        void handleSubmit()
      },
    }),
    [handleSubmit]
  )

  const requestScroll = useCallback(
    (y?: number) => {
      if (y == null) return
      // Slight negative offset so the field sits above the keyboard comfortably
      onRequestScrollTo?.(Math.max(0, y - 24))
    },
    [onRequestScrollTo]
  )

  const getIngredientScrollY = useCallback(
    (index: number) => {
      const rowY = ingredientRowY.current[index] ?? 0
      return ingredientSectionY.current + ingredientFieldY.current + ingredientStackY.current + rowY
    },
    []
  )

  const getStepScrollY = useCallback(
    (index: number) => {
      const rowY = stepRowY.current[index] ?? 0
      return stepSectionY.current + stepFieldY.current + stepStackY.current + rowY
    },
    []
  )

  return (
    <View style={styles.form}>
      {/* Basics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basics</Text>

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
      <View
        style={styles.section}
        onLayout={(e) => {
          ingredientSectionY.current = e.nativeEvent.layout.y
        }}
      >
        <Text style={styles.sectionTitle}>Ingredients</Text>

        <View
          style={styles.field}
          onLayout={(e) => {
            ingredientFieldY.current = e.nativeEvent.layout.y
          }}
        >
          <Text style={styles.label}>List</Text>

          <View
            style={styles.stepsStack}
            onLayout={(e) => {
              ingredientStackY.current = e.nativeEvent.layout.y
            }}
          >
            {values.ingredients.map((ingredient, index) => {
              const n = index + 1
              return (
                <View
                  key={`ingredient-${index}`}
                  style={styles.ingredientRow}
                  onLayout={(e) => {
                    ingredientRowY.current[index] = e.nativeEvent.layout.y
                  }}
                >
                  <TextInput
                    value={ingredient}
                    onChangeText={(t) => updateIngredient(index, t)}
                    onFocus={() => requestScroll(getIngredientScrollY(index))}
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
      <View
        style={styles.section}
        onLayout={(e) => {
          stepSectionY.current = e.nativeEvent.layout.y
        }}
      >
        <Text style={styles.sectionTitle}>Steps</Text>

        <View
          style={styles.field}
          onLayout={(e) => {
            stepFieldY.current = e.nativeEvent.layout.y
          }}
        >
          <Text style={styles.label}>Instructions</Text>

          <View
            style={styles.stepsStack}
            onLayout={(e) => {
              stepStackY.current = e.nativeEvent.layout.y
            }}
          >
            {values.steps.map((step, index) => {
              const n = index + 1
              return (
                <View
                  key={`step-${index}`}
                  style={styles.stepRow}
                  onLayout={(e) => {
                    stepRowY.current[index] = e.nativeEvent.layout.y
                  }}
                >
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{n}</Text>
                  </View>

                  <TextInput
                    value={step}
                    onChangeText={(t) => updateStep(index, t)}
                    onFocus={() => requestScroll(getStepScrollY(index))}
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
        <Text style={styles.sectionTitle}>Add to a collection (optional)</Text>
        <Text style={styles.helperText}>Tags act as collections—each tag you add creates a folder.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Collections</Text>

          <View style={styles.tagInputRow}>
            <TextInput
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="e.g. Healthy"
              placeholderTextColor={styles.placeholder.color}
              style={[styles.input, styles.tagInput]}
              editable={!isSubmitting}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => addTag()}
            />
            <Button
              variant="soft"
              size="md"
              onPress={addTag}
              disabled={isSubmitting}
              style={styles.tagAddButton}
              textStyle={styles.tagAddText}
            >
              Add
            </Button>
          </View>

          {values.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {values.tags.map((tag) => (
                <TagChip key={tag} label={tag} selected onPress={() => removeTag(tag)} />
              ))}
            </View>
          ) : null}

          {normalizedSuggestedTags.length > 0 ? (
            <View style={styles.suggestedTags}>
              {normalizedSuggestedTags.map((tag) => (
                <TagChip key={tag.label} label={tag.label} onPress={() => addTag(tag.label)} />
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
  helperText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
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
