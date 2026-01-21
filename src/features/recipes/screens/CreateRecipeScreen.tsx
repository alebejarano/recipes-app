// src/features/recipes/screens/CreateRecipeScreen.tsx

import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import { Alert, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { createThemedStyles } from '@/styles/createStyles'

import RecipeForm, {
  createEmptyRecipeFormValues,
  type RecipeFormSubmitValues,
} from '@/features/recipes/components/RecipeForm'
import { useCreateRecipe } from '@/features/recipes/hooks/useCreateRecipe'

export type CreateRecipeVariant = 'onboarding' | 'app'

interface CreateRecipeScreenProps {
  variant?: CreateRecipeVariant
  onSaved?: (recipeId: string) => void
  onBack?: () => void
}

export default function CreateRecipeScreen({
  variant = 'app',
  onSaved,
  onBack,
}: CreateRecipeScreenProps) {
  const isOnboarding = variant === 'onboarding'
  const createMutation = useCreateRecipe()

  const screenTitle = useMemo(
    () => (isOnboarding ? 'Create your first recipe' : 'Create your recipe'),
    [isOnboarding]
  )

  const screenSubtitle = useMemo(
    () => 'Add the basics—you can always edit later.',
    []
  )

  const submitLabel = useMemo(
    () => (isOnboarding ? 'Save and continue' : 'Add Recipe'),
    [isOnboarding]
  )

  const handleSubmit = useCallback(
    async (values: RecipeFormSubmitValues) => {
      try {
        const recipe = await createMutation.mutateAsync(values)

        // Preferred: let the caller control the next step (especially onboarding)
        if (onSaved) {
          onSaved(recipe.id)
          return
        }

        // Default navigation for app flow
        router.replace('/recipes/[id]')
      } catch (e) {
        Alert.alert('Save failed', 'Please try again.')
      }
    },
    [createMutation, onSaved]
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Optional back (onboarding) */}
        {onBack ? (
          <View style={styles.backWrapper}>
            <Button
              variant="ghost"
              size="md"
              onPress={onBack}
              style={styles.backButton}
              textStyle={styles.backText}
              icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
              disabled={createMutation.isPending}
            >
              Back
            </Button>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{screenTitle}</Text>
            <Text style={styles.subtitle}>{screenSubtitle}</Text>
          </View>

          <RecipeForm
            initialValues={createEmptyRecipeFormValues()}
            submitLabel={submitLabel}
            isSubmitting={createMutation.isPending}
            onSubmit={handleSubmit}
            onCancel={
              // In app flow, you said you rely on router.back from the page header.
              // We only show cancel if you pass onBack (or if you later want it).
              onBack ? onBack : undefined
            }
          />
        </ScrollView>

        {/* Inline error state (optional) */}
        {createMutation.isError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              Unable to save right now. Please try again.
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },

  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  /* Back */
  backWrapper: {
    marginBottom: theme.spacing.md,
  },
  backButton: {
    paddingHorizontal: 0,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  backIcon: {
    color: theme.colors.mutedForeground,
  },

  /* Header */
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  /* Error banner */
  errorBanner: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  errorText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
}))
