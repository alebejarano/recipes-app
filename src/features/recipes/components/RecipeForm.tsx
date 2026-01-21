// src/features/recipes/components/RecipeForm.tsx
import React, { useCallback, useMemo, useState } from 'react'
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
  ingredientsText: string
  stepsText: string
}

export type RecipeFormSubmitValues = {
  title: string
  subtitle: string | null
  description: string | null
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  servings: number | null
  ingredientsText: string | null
  stepsText: string | null
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
    ingredientsText: '',
    stepsText: '',
  }
}

export default function RecipeForm({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  initialValues?: RecipeFormValues
  submitLabel: string
  isSubmitting?: boolean
  onSubmit: (values: RecipeFormSubmitValues) => Promise<void> | void
  onCancel?: () => void
}) {
  const [values, setValues] = useState<RecipeFormValues>(
    initialValues ?? createEmptyRecipeFormValues()
  )

  const canSubmit = useMemo(() => {
    return values.title.trim().length > 0 && !isSubmitting
  }, [values.title, isSubmitting])

  const update = useCallback(<K extends keyof RecipeFormValues>(key: K, next: RecipeFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: next }))
  }, [])

  const handleSubmit = useCallback(async () => {
    const title = values.title.trim()
    if (!title) {
      Alert.alert('Missing title', 'Please enter a recipe title.')
      return
    }

    const payload: RecipeFormSubmitValues = {
      title,
      subtitle: normalizeOptionalText(values.subtitle),
      description: normalizeOptionalText(values.description),
      prepTimeMinutes: parseOptionalInt(values.prepTimeMinutes),
      cookTimeMinutes: parseOptionalInt(values.cookTimeMinutes),
      servings: parseOptionalInt(values.servings),
      ingredientsText: normalizeOptionalText(values.ingredientsText),
      stepsText: normalizeOptionalText(values.stepsText),
    }

    await onSubmit(payload)
  }, [onSubmit, values])

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
          <TextInput
            value={values.ingredientsText}
            onChangeText={(t) => update('ingredientsText', t)}
            placeholder={`Write ingredients freely.\n\nOne per line is recommended.`}
            placeholderTextColor={styles.placeholder.color}
            multiline
            style={[styles.input, styles.textarea]}
            editable={!isSubmitting}
            autoCapitalize="sentences"
          />
        </View>
      </View>

      {/* Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Steps</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            value={values.stepsText}
            onChangeText={(t) => update('stepsText', t)}
            placeholder={`Write your steps freely.\n\nLine breaks are preserved.`}
            placeholderTextColor={styles.placeholder.color}
            multiline
            style={[styles.input, styles.textarea]}
            editable={!isSubmitting}
            autoCapitalize="sentences"
          />
        </View>
      </View>

      {/* Actions */}
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
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  form: {
    gap: theme.spacing.lg,
  },

  section: {
    gap: theme.spacing.sm,
  },

  sectionTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },

  field: {
    gap: theme.spacing.xs,
  },

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
    borderRadius: theme.radii.xl, // per your design system
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base, // your system: no "md"
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },

  textarea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },

  placeholder: {
    color: theme.colors.mutedForeground,
  },

  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  flex1: {
    flex: 1,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
}))
