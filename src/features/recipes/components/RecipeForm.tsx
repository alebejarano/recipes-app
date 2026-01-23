// src/features/recipes/components/RecipeForm.tsx
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { Alert, Text, TextInput, View } from 'react-native'

import Button from '@/components/Button'
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
  }
}

type Props = {
  initialValues?: RecipeFormValues
  submitLabel: string
  isSubmitting?: boolean
  onSubmit: (values: RecipeFormSubmitValues) => Promise<void> | void
  onCancel?: () => void
  showActions?: boolean
}

const RecipeForm = forwardRef<RecipeFormHandle, Props>(function RecipeForm(
  { initialValues, submitLabel, isSubmitting, onSubmit, onCancel, showActions = true },
  ref
) {
  const [values, setValues] = useState<RecipeFormValues>(
    initialValues ?? createEmptyRecipeFormValues()
  )

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
    setValues((prev) => ({ ...prev, ingredients: [...prev.ingredients, ''] }))
  }, [])

  const removeIngredient = useCallback((index: number) => {
    setValues((prev) => {
      const ingredients = prev.ingredients.filter((_, i) => i !== index)
      return { ...prev, ingredients: ingredients.length ? ingredients : [''] }
    })
  }, [])

  const addStep = useCallback(() => {
    setValues((prev) => ({ ...prev, steps: [...prev.steps, ''] }))
  }, [])

  const removeStep = useCallback((index: number) => {
    setValues((prev) => {
      const steps = prev.steps.filter((_, i) => i !== index)
      return { ...prev, steps: steps.length ? steps : [''] }
    })
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

    const normalizedSteps = values.steps
      .map((step) => step.trim())
      .filter(Boolean)

    return {
      title,
      subtitle: normalizeOptionalText(values.subtitle),
      description: normalizeOptionalText(values.description),
      prepTimeMinutes: parseOptionalInt(values.prepTimeMinutes),
      cookTimeMinutes: parseOptionalInt(values.cookTimeMinutes),
      servings: parseOptionalInt(values.servings),
      ingredients: normalizedIngredients.length ? normalizedIngredients : null,
      steps: normalizedSteps.length ? normalizedSteps : null,
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ingredients</Text>

        <View style={styles.field}>
          <Text style={styles.label}>List</Text>
          <View style={styles.stepsStack}>
            {values.ingredients.map((ingredient, index) => {
              const ingredientNumber = `${index + 1}`
              return (
                <View key={`ingredient-${index}`} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{ingredientNumber}</Text>
                  </View>

                  <TextInput
                    value={ingredient}
                    onChangeText={(t) => updateIngredient(index, t)}
                    placeholder={`Ingredient ${ingredientNumber}`}
                    placeholderTextColor={styles.placeholder.color}
                    style={[styles.input, styles.stepInput]}
                    editable={!isSubmitting}
                    autoCapitalize="sentences"
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
              const stepNumber = `${index + 1}`
              return (
                <View key={`step-${index}`} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{stepNumber}</Text>
                  </View>

                  <TextInput
                    value={step}
                    onChangeText={(t) => updateStep(index, t)}
                    placeholder={`Step ${stepNumber}`}
                    placeholderTextColor={styles.placeholder.color}
                    style={[styles.input, styles.stepInput]}
                    editable={!isSubmitting}
                    autoCapitalize="sentences"
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
  stepsStack: {
    gap: theme.spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
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
  stepInput: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
  },
  removeStep: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  addStepButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  addStepText: {
    fontSize: theme.fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
}))
