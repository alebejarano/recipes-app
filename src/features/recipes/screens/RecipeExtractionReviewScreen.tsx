import { useQuery } from '@tanstack/react-query'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { getRecipeExtraction } from '@/features/recipes/api/recipeExtractionsRepo'
import RecipeForm, {
  createEmptyRecipeFormValues,
  type RecipeFormIngredient,
  type RecipeFormValues,
} from '@/features/recipes/components/RecipeForm'
import CreateRecipeScreen from '@/features/recipes/screens/CreateRecipeScreen'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type RecipeExtractionReviewScreenProps = {
  extractionId: string
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean)
  if (typeof value === 'string') return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  return []
}

function ingredients(value: unknown): RecipeFormIngredient[] {
  if (!Array.isArray(value)) return createEmptyRecipeFormValues().ingredients

  const items = value.map((ingredient): RecipeFormIngredient => {
    if (typeof ingredient === 'string') {
      return { kind: 'ingredient', quantity: '', unit: '', name: ingredient.trim(), notes: '' }
    }
    const item = ingredient && typeof ingredient === 'object' ? ingredient as Record<string, unknown> : {}
    return {
      kind: item.kind === 'section' ? 'section' : 'ingredient',
      quantity: text(item.quantity),
      unit: text(item.unit),
      name: text(item.name) || text(item.ingredient),
      notes: text(item.notes),
    }
  }).filter((ingredient) => ingredient.name)

  return items.length ? items : createEmptyRecipeFormValues().ingredients
}

function buildInitialValues(recipe: Record<string, unknown>): RecipeFormValues {
  return {
    ...createEmptyRecipeFormValues(),
    title: text(recipe.title),
    subtitle: text(recipe.subtitle),
    description: text(recipe.description) || text(recipe.notes),
    prepTimeMinutes: text(recipe.prep_time_minutes) || text(recipe.prepTimeMinutes),
    cookTimeMinutes: text(recipe.cook_time_minutes) || text(recipe.cookTimeMinutes),
    servings: text(recipe.servings),
    ingredients: ingredients(recipe.ingredients),
    steps: stringArray(recipe.instructions ?? recipe.steps).length
      ? stringArray(recipe.instructions ?? recipe.steps)
      : createEmptyRecipeFormValues().steps,
  }
}

export default function RecipeExtractionReviewScreen({ extractionId }: RecipeExtractionReviewScreenProps) {
  const { t } = useTranslation()
  const extractionQuery = useQuery({
    queryKey: ['recipe-extraction', extractionId],
    queryFn: () => getRecipeExtraction(extractionId),
    enabled: Boolean(extractionId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'queued' || status === 'processing' ? 2_000 : false
    },
  })

  const extraction = extractionQuery.data
  const initialValues = extraction?.recipe ? buildInitialValues(extraction.recipe) : null

  if (extractionQuery.isLoading || extraction?.status === 'queued' || extraction?.status === 'processing') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={styles.icon.color} />
          <Text style={styles.title}>{t('recipes.extraction.reviewLoadingTitle')}</Text>
          <Text style={styles.body}>{t('recipes.extraction.reviewLoadingBody')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (extractionQuery.isError || !extraction || extraction.status === 'failed' || !initialValues) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Feather name="alert-circle" size={44} style={styles.icon} />
          <Text style={styles.title}>{t('recipes.extraction.reviewFailedTitle')}</Text>
          <Text style={styles.body}>{extraction?.failure?.message ?? t('recipes.extraction.reviewFailedBody')}</Text>
          <Button variant="secondary" size="md" onPress={() => router.back()}>
            {t('recipes.documentDetail.goBack')}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const completedExtraction = extraction
  const missingFields = completedExtraction.missingFields
    .map((field) => t(`recipes.extraction.fields.${field}` as never))
    .filter(Boolean)
  const notice = missingFields.length
    ? t('recipes.extraction.partialNotice', { fields: missingFields.join(', ') })
    : t('recipes.extraction.reviewNotice')

  return (
    <CreateRecipeScreen
      entry="scratch"
      initialRecipeValues={initialValues}
      titleOverride={t('recipes.extraction.reviewTitle')}
      subtitleOverride={t('recipes.extraction.reviewSubtitle')}
      notice={notice}
    />
  )
}

const styles = createThemedStyles((theme) => ({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing.md, padding: theme.spacing.xl },
  icon: { color: theme.colors.primary },
  title: { ...theme.textVariants.title, color: theme.colors.foreground, textAlign: 'center' },
  body: { ...theme.textVariants.body, color: theme.colors.mutedForeground, textAlign: 'center' },
}))
