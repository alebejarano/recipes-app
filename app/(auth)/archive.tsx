import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'

import Screen from '@/components/Screen'
import {
  listFreeImportLibraryMetadata,
  listFreeRecipeLibraryMetadata,
  setFreeActiveImportIds,
  setFreeActiveRecipeIds,
} from '@/features/recipes/api/freeArchiveRepo'
import { FREE_PLAN_MAX_IMPORT_TOTAL_BYTES, FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'
import { createThemedStyles } from '@/styles/createStyles'

function formatMegabytes(bytes: number) {
  return `${Math.ceil(bytes / 1024 / 1024)} MB`
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString()
}

export default function CloudArchiveRoute() {
  const queryClient = useQueryClient()
  const recipesQuery = useQuery({ queryKey: ['recipes', 'library', 'archive-recipes'], queryFn: listFreeRecipeLibraryMetadata, retry: false })
  const importsQuery = useQuery({ queryKey: ['recipes', 'library', 'free-active-imports'], queryFn: listFreeImportLibraryMetadata, retry: false })
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[] | null>(null)
  const [selectedImportIds, setSelectedImportIds] = useState<string[] | null>(null)
  const [archiveSection, setArchiveSection] = useState<'recipes' | 'imports'>('recipes')
  const recipes = useMemo(() => recipesQuery.data ?? [], [recipesQuery.data])
  const imports = useMemo(() => importsQuery.data ?? [], [importsQuery.data])
  const activeRecipeIds = selectedRecipeIds ?? recipes.filter((item) => item.isActive).map((item) => item.id)
  const activeImportIds = selectedImportIds ?? imports.filter((item) => item.isActive).map((item) => item.id)
  const activeImportBytes = useMemo(() => imports.filter((item) => activeImportIds.includes(item.id)).reduce((total, item) => total + item.bytes, 0), [activeImportIds, imports])

  const saveRecipeSlotsMutation = useMutation({
    mutationFn: setFreeActiveRecipeIds,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recipes', 'library'] })
      setSelectedRecipeIds(null)
    },
    onError: (error) => {
      setSelectedRecipeIds(null)
      Alert.alert('Could not update Active Library', error instanceof Error ? error.message : 'Please try again.')
    },
  })
  const saveImportSlotsMutation = useMutation({
    mutationFn: setFreeActiveImportIds,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recipes', 'library'] })
      setSelectedImportIds(null)
    },
    onError: (error) => {
      setSelectedImportIds(null)
      Alert.alert('Could not update Active Library', error instanceof Error ? error.message : 'Please try again.')
    },
  })

  const toggleRecipe = (id: string) => {
    if (saveRecipeSlotsMutation.isPending) return
    const isActive = activeRecipeIds.includes(id)
    if (!isActive && activeRecipeIds.length >= FREE_PLAN_MAX_RECIPES) {
      Alert.alert('Active Library is full', 'Free includes up to 100 active recipes. Remove another recipe from Active first.')
      return
    }
    const nextActiveRecipeIds = isActive ? activeRecipeIds.filter((value) => value !== id) : [...activeRecipeIds, id]
    setSelectedRecipeIds(nextActiveRecipeIds)
    saveRecipeSlotsMutation.mutate(nextActiveRecipeIds)
  }
  const toggleImport = (id: string) => {
    if (saveImportSlotsMutation.isPending) return
    const isActive = activeImportIds.includes(id)
    const item = imports.find((entry) => entry.id === id)
    if (!item) return
    if (!isActive && activeImportBytes + item.bytes > FREE_PLAN_MAX_IMPORT_TOTAL_BYTES) {
      Alert.alert('Active Library is full', 'Free includes up to 50 MB of active imports. Remove another import from Active first.')
      return
    }
    const nextActiveImportIds = isActive ? activeImportIds.filter((value) => value !== id) : [...activeImportIds, id]
    setSelectedImportIds(nextActiveImportIds)
    saveImportSlotsMutation.mutate(nextActiveImportIds)
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button"><Feather name="chevron-left" size={20} /><Text>Back</Text></Pressable>
      <Text style={styles.title}>Cloud Archive</Text>
      <Text style={styles.subtitle}>Choose the recipes and imports available on Free. Everything else stays safely archived in the cloud.</Text>
      <View style={styles.explainer}><Feather name="archive" size={20} color={styles.icon.color} /><View style={styles.copy}><Text style={styles.explainerTitle}>Removing from Active is not deleting</Text><Text style={styles.rowSubtitle}>An item removed from Active remains safely in Cloud Archive. You can activate it again later.</Text></View></View>
      <View style={styles.usageCard}><Text style={styles.usageText}>Active recipes: {activeRecipeIds.length} / {FREE_PLAN_MAX_RECIPES}</Text><Text style={styles.usageText}>Active imports: {formatMegabytes(activeImportBytes)} / 50 MB</Text></View>

      <View style={styles.segmentedControl} accessibilityRole="tablist">
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: archiveSection === 'recipes' }} style={[styles.segment, archiveSection === 'recipes' && styles.segmentSelected]} onPress={() => setArchiveSection('recipes')}><Text style={[styles.segmentText, archiveSection === 'recipes' && styles.segmentTextSelected]}>Recipes ({recipes.length})</Text></Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: archiveSection === 'imports' }} style={[styles.segment, archiveSection === 'imports' && styles.segmentSelected]} onPress={() => setArchiveSection('imports')}><Text style={[styles.segmentText, archiveSection === 'imports' && styles.segmentTextSelected]}>Imports ({imports.length})</Text></Pressable>
      </View>

      {archiveSection === 'recipes' ? recipes.map((recipe) => {
        const isActive = activeRecipeIds.includes(recipe.id)
        return <Pressable key={recipe.id} style={styles.row} onPress={() => toggleRecipe(recipe.id)} disabled={saveRecipeSlotsMutation.isPending} accessibilityRole="checkbox" accessibilityState={{ checked: isActive, disabled: saveRecipeSlotsMutation.isPending }}><Feather name={isActive ? 'check-circle' : 'archive'} size={18} color={styles.icon.color} /><View style={styles.copy}><Text style={styles.rowTitle}>{recipe.title}</Text><Text style={styles.rowSubtitle}>{isActive ? 'Active on Free' : `Archived · Saved ${formatDate(recipe.createdAt)}`}</Text></View><Text style={styles.action}>{saveRecipeSlotsMutation.isPending ? 'Saving…' : isActive ? 'Remove from Active' : 'Make Active'}</Text></Pressable>
      }) : null}

      {archiveSection === 'imports' ? imports.map((item) => {
        const isActive = activeImportIds.includes(item.id)
        return <Pressable key={item.id} style={styles.row} onPress={() => toggleImport(item.id)} disabled={saveImportSlotsMutation.isPending} accessibilityRole="checkbox" accessibilityState={{ checked: isActive, disabled: saveImportSlotsMutation.isPending }}><Feather name={isActive ? 'check-circle' : 'archive'} size={18} color={styles.icon.color} /><View style={styles.copy}><Text style={styles.rowTitle}>{item.title ?? item.fileName}</Text><Text style={styles.rowSubtitle}>{isActive ? `Active on Free · ${formatMegabytes(item.bytes)}` : `Archived · ${formatDate(item.createdAt)} · ${formatMegabytes(item.bytes)}`}</Text></View><Text style={styles.action}>{saveImportSlotsMutation.isPending ? 'Saving…' : isActive ? 'Remove from Active' : 'Make Active'}</Text></Pressable>
      }) : null}

      <View style={styles.deleteCard}><Text style={styles.explainerTitle}>Need to delete something permanently?</Text><Text style={styles.rowSubtitle}>Cloud Archive does not delete anything. Manage Library is separate and uses permanent deletion to free space on this device.</Text><View style={styles.manageActions}><Pressable onPress={() => router.push('/(auth)/recipes/manage' as never)} accessibilityRole="button"><Text style={styles.manageAction}>Manage recipes</Text></Pressable><Pressable onPress={() => router.push('/(auth)/imports/manage' as never)} accessibilityRole="button"><Text style={styles.manageAction}>Manage imports</Text></Pressable></View></View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { gap: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
  back: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, minHeight: 44 },
  title: { ...theme.textVariants.display, color: theme.colors.foreground }, subtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  segmentedControl: { flexDirection: 'row', padding: theme.spacing.xs, borderRadius: theme.radii.full, backgroundColor: theme.colors.secondary }, segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.full }, segmentSelected: { backgroundColor: theme.colors.card }, segmentText: { ...theme.textVariants.label, color: theme.colors.mutedForeground, textAlign: 'center' }, segmentTextSelected: { color: theme.colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card }, explainer: { flexDirection: 'row', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.secondary }, deleteCard: { gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card }, usageCard: { gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card },
  usageText: { ...theme.textVariants.label, color: theme.colors.foreground, fontVariant: ['tabular-nums'] }, icon: { color: theme.colors.accent }, copy: { flex: 1 }, rowTitle: { ...theme.textVariants.label, color: theme.colors.foreground }, rowSubtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground }, explainerTitle: { ...theme.textVariants.label, color: theme.colors.foreground }, action: { ...theme.textVariants.label, color: theme.colors.accent, textAlign: 'right', maxWidth: 105 }, manageActions: { flexDirection: 'row', gap: theme.spacing.lg }, manageAction: { ...theme.textVariants.label, color: theme.colors.accent },
}))
