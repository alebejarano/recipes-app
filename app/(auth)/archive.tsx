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
  const [isDirty, setIsDirty] = useState(false)
  const recipes = useMemo(() => recipesQuery.data ?? [], [recipesQuery.data])
  const imports = useMemo(() => importsQuery.data ?? [], [importsQuery.data])
  const activeRecipeIds = selectedRecipeIds ?? recipes.filter((item) => item.isActive).map((item) => item.id)
  const activeImportIds = selectedImportIds ?? imports.filter((item) => item.isActive).map((item) => item.id)
  const activeImportBytes = useMemo(() => imports.filter((item) => activeImportIds.includes(item.id)).reduce((total, item) => total + item.bytes, 0), [activeImportIds, imports])
  const hasChanges = isDirty

  const saveMutation = useMutation({
    mutationFn: async () => { await Promise.all([setFreeActiveRecipeIds(activeRecipeIds), setFreeActiveImportIds(activeImportIds)]) },
    onSuccess: async () => {
      setSelectedRecipeIds(null)
      setSelectedImportIds(null)
      setIsDirty(false)
      await queryClient.invalidateQueries({ queryKey: ['recipes', 'library'] })
    },
    onError: (error) => Alert.alert('Could not save Active Library', error instanceof Error ? error.message : 'Please try again.'),
  })

  const toggleRecipe = (id: string) => {
    const isActive = activeRecipeIds.includes(id)
    if (!isActive && activeRecipeIds.length >= FREE_PLAN_MAX_RECIPES) {
      Alert.alert('Active Library is full', 'Free includes up to 100 active recipes. Remove another recipe from Active first.')
      return
    }
    setIsDirty(true)
    setSelectedRecipeIds(isActive ? activeRecipeIds.filter((value) => value !== id) : [...activeRecipeIds, id])
  }
  const toggleImport = (id: string) => {
    const isActive = activeImportIds.includes(id)
    const item = imports.find((entry) => entry.id === id)
    if (!item) return
    if (!isActive && activeImportBytes + item.bytes > FREE_PLAN_MAX_IMPORT_TOTAL_BYTES) {
      Alert.alert('Active Library is full', 'Free includes up to 50 MB of active imports. Remove another import from Active first.')
      return
    }
    setIsDirty(true)
    setSelectedImportIds(isActive ? activeImportIds.filter((value) => value !== id) : [...activeImportIds, id])
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button"><Feather name="chevron-left" size={20} /><Text>Collections</Text></Pressable>
      <Text style={styles.title}>Cloud Archive</Text>
      <Text style={styles.subtitle}>Choose the recipes and imports available on Free. Everything else stays safely archived in the cloud.</Text>
      <View style={styles.explainer}><Feather name="archive" size={20} color={styles.icon.color} /><View style={styles.copy}><Text style={styles.explainerTitle}>Removing from Active is not deleting</Text><Text style={styles.rowSubtitle}>An item removed from Active remains safely in Cloud Archive. You can activate it again later.</Text></View></View>
      <View style={styles.usageCard}><Text style={styles.usageText}>Active recipes: {activeRecipeIds.length} / {FREE_PLAN_MAX_RECIPES}</Text><Text style={styles.usageText}>Active imports: {formatMegabytes(activeImportBytes)} / 50 MB</Text></View>

      <Text style={styles.heading}>Recipes ({recipes.length})</Text>
      {recipes.map((recipe) => {
        const isActive = activeRecipeIds.includes(recipe.id)
        return <Pressable key={recipe.id} style={styles.row} onPress={() => toggleRecipe(recipe.id)} accessibilityRole="checkbox" accessibilityState={{ checked: isActive }}><Feather name={isActive ? 'check-circle' : 'archive'} size={18} color={styles.icon.color} /><View style={styles.copy}><Text style={styles.rowTitle}>{recipe.title}</Text><Text style={styles.rowSubtitle}>{isActive ? 'Active on Free' : `Archived · Saved ${formatDate(recipe.createdAt)}`}</Text></View><Text style={styles.action}>{isActive ? 'Remove from Active' : 'Make Active'}</Text></Pressable>
      })}

      <Text style={styles.heading}>Imports ({imports.length})</Text>
      {imports.map((item) => {
        const isActive = activeImportIds.includes(item.id)
        return <Pressable key={item.id} style={styles.row} onPress={() => toggleImport(item.id)} accessibilityRole="checkbox" accessibilityState={{ checked: isActive }}><Feather name={isActive ? 'check-circle' : 'archive'} size={18} color={styles.icon.color} /><View style={styles.copy}><Text style={styles.rowTitle}>{item.title ?? item.fileName}</Text><Text style={styles.rowSubtitle}>{isActive ? `Active on Free · ${formatMegabytes(item.bytes)}` : `Archived · ${formatDate(item.createdAt)} · ${formatMegabytes(item.bytes)}`}</Text></View><Text style={styles.action}>{isActive ? 'Remove from Active' : 'Make Active'}</Text></Pressable>
      })}

      {hasChanges ? <Pressable style={styles.saveButton} onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending}><Text style={styles.saveButtonText}>{saveMutation.isPending ? 'Saving…' : 'Save Active Library'}</Text></Pressable> : null}
      <View style={styles.deleteCard}><Text style={styles.explainerTitle}>Need to delete something permanently?</Text><Text style={styles.rowSubtitle}>Cloud Archive does not delete anything. Manage Library is separate and uses permanent deletion to free space on this device.</Text><View style={styles.manageActions}><Pressable onPress={() => router.push('/(auth)/recipes/manage' as never)} accessibilityRole="button"><Text style={styles.manageAction}>Manage recipes</Text></Pressable><Pressable onPress={() => router.push('/(auth)/imports/manage' as never)} accessibilityRole="button"><Text style={styles.manageAction}>Manage imports</Text></Pressable></View></View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { gap: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
  back: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, minHeight: 44 },
  title: { ...theme.textVariants.display, color: theme.colors.foreground }, subtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground }, heading: { ...theme.textVariants.heading, color: theme.colors.foreground, marginTop: theme.spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card }, explainer: { flexDirection: 'row', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.secondary }, deleteCard: { gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card }, usageCard: { gap: theme.spacing.xs, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card },
  usageText: { ...theme.textVariants.label, color: theme.colors.foreground, fontVariant: ['tabular-nums'] }, icon: { color: theme.colors.accent }, copy: { flex: 1 }, rowTitle: { ...theme.textVariants.label, color: theme.colors.foreground }, rowSubtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground }, explainerTitle: { ...theme.textVariants.label, color: theme.colors.foreground }, action: { ...theme.textVariants.label, color: theme.colors.accent, textAlign: 'right', maxWidth: 105 }, saveButton: { padding: theme.spacing.lg, borderRadius: theme.radii.full, backgroundColor: theme.colors.accent, alignItems: 'center', marginTop: theme.spacing.md }, saveButtonText: { ...theme.textVariants.label, color: theme.colors.accentForeground }, manageActions: { flexDirection: 'row', gap: theme.spacing.lg }, manageAction: { ...theme.textVariants.label, color: theme.colors.accent },
}))
