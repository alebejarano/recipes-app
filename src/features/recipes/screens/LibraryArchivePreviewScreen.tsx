import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'

import Screen from '@/components/Screen'
import { FREE_PLAN_MAX_IMPORT_TOTAL_BYTES, FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'
import { createThemedStyles } from '@/styles/createStyles'

const MB = 1024 * 1024
const recipes = Array.from({ length: 150 }, (_, index) => ({
  id: `preview-recipe-${index + 1}`,
  title: `Sample Recipe ${String(index + 1).padStart(3, '0')}`,
  createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
}))
const imports = Array.from({ length: 10 }, (_, index) => ({
  id: `preview-import-${index + 1}`,
  fileName: `sample-import-${String(index + 1).padStart(2, '0')}.pdf`,
  bytes: index < 8 ? 6 * MB : (index === 8 ? 6 : 2) * MB,
  createdAt: new Date(Date.UTC(2026, 2, 1 + index)).toISOString(),
}))

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString()
}

function sizeLabel(bytes: number) {
  return `${Math.ceil(bytes / MB)} MB`
}

export default function LibraryArchivePreviewScreen() {
  const [showArchive, setShowArchive] = useState(false)
  const [archiveSection, setArchiveSection] = useState<'recipes' | 'imports'>('recipes')
  const [activeRecipeIds, setActiveRecipeIds] = useState(() => recipes.slice(0, 100).map((item) => item.id))
  const [activeImportIds, setActiveImportIds] = useState(() => imports.slice(0, 8).map((item) => item.id))
  const activeImportBytes = useMemo(
    () => imports.filter((item) => activeImportIds.includes(item.id)).reduce((sum, item) => sum + item.bytes, 0),
    [activeImportIds],
  )

  const toggleRecipe = (id: string) => {
    const active = activeRecipeIds.includes(id)
    if (!active && activeRecipeIds.length >= FREE_PLAN_MAX_RECIPES) {
      Alert.alert('Active recipe limit reached', 'Remove a recipe from Active before making an archived recipe active.')
      return
    }
    setActiveRecipeIds((current) => active ? current.filter((value) => value !== id) : [...current, id])
  }

  const toggleImport = (id: string) => {
    const active = activeImportIds.includes(id)
    const item = imports.find((entry) => entry.id === id)
    if (!item) return
    if (!active && activeImportBytes + item.bytes > FREE_PLAN_MAX_IMPORT_TOTAL_BYTES) {
      Alert.alert('Active import limit reached', 'Remove an import from Active before making this archived import active.')
      return
    }
    setActiveImportIds((current) => active ? current.filter((value) => value !== id) : [...current, id])
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      {!showArchive ? (
        <>
          <Text style={styles.title}>Your library is safe</Text>
          <Text style={styles.body}>Free includes 100 active recipes and 50 MB of active imports. Your remaining Premium library stays safely stored in Cloud Archive.</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What happens now</Text>
            <Text style={styles.body}>Your newest recipes are already active. In Cloud Archive, removing an item from Active keeps it safely archived—it does not delete it. Manage Library is separate and permanently deletes local items to free device space.</Text>
            <View style={styles.manageLinks}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/recipes/manage' as never)}><Text style={styles.manageLink}>Manage recipes</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/imports/manage' as never)}><Text style={styles.manageLink}>Manage imports</Text></Pressable>
            </View>
          </View>
          <Pressable accessibilityRole="button" style={styles.primary} onPress={() => setShowArchive(true)}>
            <Text style={styles.primaryText}>Open Cloud Archive</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => router.push('/(auth)/premium' as never)}>
            <Text style={styles.secondaryText}>Restore full library with Premium</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/(auth)/(tabs)/collections' as never)}>
            <Text style={styles.continue}>Continue with Free</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable accessibilityRole="button" style={styles.back} onPress={() => setShowArchive(false)}>
            <Feather name="chevron-left" size={20} color={styles.accent.color} />
            <Text numberOfLines={1} style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Cloud Archive</Text>
          <Text style={styles.body}>Choose the recipes and imports available on Free. Everything else stays safely archived in the cloud.</Text>
          <View style={styles.explainer}>
            <Feather name="archive" size={20} color={styles.accent.color} />
            <View style={styles.rowCopy}>
              <Text style={styles.cardTitle}>Removing from Active is not deleting</Text>
              <Text style={styles.body}>An item removed from Active remains safely in Cloud Archive. You can activate it again later.</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.body}>Active recipes: {activeRecipeIds.length} / {FREE_PLAN_MAX_RECIPES}</Text>
            <Text style={styles.body}>Active imports: {sizeLabel(activeImportBytes)} / 50 MB</Text>
          </View>

          <View style={styles.segmentedControl} accessibilityRole="tablist">
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: archiveSection === 'recipes' }} style={[styles.segment, archiveSection === 'recipes' && styles.segmentSelected]} onPress={() => setArchiveSection('recipes')}>
              <Text style={[styles.segmentText, archiveSection === 'recipes' && styles.segmentTextSelected]}>Recipes ({recipes.length})</Text>
            </Pressable>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: archiveSection === 'imports' }} style={[styles.segment, archiveSection === 'imports' && styles.segmentSelected]} onPress={() => setArchiveSection('imports')}>
              <Text style={[styles.segmentText, archiveSection === 'imports' && styles.segmentTextSelected]}>Imports ({imports.length})</Text>
            </Pressable>
          </View>

          {archiveSection === 'recipes' ? recipes.map((item) => {
            const active = activeRecipeIds.includes(item.id)
            return (
              <Pressable key={item.id} style={styles.row} onPress={() => toggleRecipe(item.id)} accessibilityRole="checkbox" accessibilityState={{ checked: active }}>
                <Feather name={active ? 'check-circle' : 'archive'} size={18} color={styles.accent.color} />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.body}>{active ? 'Active on Free' : `Archived · Saved ${dateLabel(item.createdAt)}`}</Text>
                </View>
                <Text style={styles.action}>{active ? 'Remove from Active' : 'Make Active'}</Text>
              </Pressable>
            )
          }) : null}

          {archiveSection === 'imports' ? imports.map((item) => {
            const active = activeImportIds.includes(item.id)
            return (
              <Pressable key={item.id} style={styles.row} onPress={() => toggleImport(item.id)} accessibilityRole="checkbox" accessibilityState={{ checked: active }}>
                <Feather name={active ? 'check-circle' : 'archive'} size={18} color={styles.accent.color} />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowTitle}>{item.fileName}</Text>
                  <Text style={styles.body}>{active ? `Active on Free · ${sizeLabel(item.bytes)}` : `Archived · ${dateLabel(item.createdAt)} · ${sizeLabel(item.bytes)}`}</Text>
                </View>
                <Text style={styles.action}>{active ? 'Remove from Active' : 'Make Active'}</Text>
              </Pressable>
            )
          }) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Need to delete something permanently?</Text>
            <Text style={styles.body}>Cloud Archive does not delete anything. Manage Library is separate and uses permanent deletion to free space on this device.</Text>
            <View style={styles.manageLinks}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/recipes/manage' as never)}><Text style={styles.manageLink}>Manage recipes</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/imports/manage' as never)}><Text style={styles.manageLink}>Manage imports</Text></Pressable>
            </View>
          </View>
        </>
      )}
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { gap: theme.spacing.md, padding: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
  title: { ...theme.textVariants.display, color: theme.colors.foreground },
  body: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  card: { gap: theme.spacing.sm, padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card },
  cardTitle: { ...theme.textVariants.heading, color: theme.colors.foreground },
  primary: { padding: theme.spacing.lg, borderRadius: theme.radii.full, backgroundColor: theme.colors.primary, alignItems: 'center' },
  primaryText: { ...theme.textVariants.label, color: theme.colors.primaryForeground },
  secondary: { minHeight: 48, paddingHorizontal: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.accent, borderRadius: theme.radii.full, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { ...theme.textVariants.label, color: theme.colors.accent },
  continue: { textAlign: 'center', ...theme.textVariants.body, color: theme.colors.mutedForeground },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  backLabel: { ...theme.textVariants.label, color: theme.colors.accent, flexShrink: 1 },
  explainer: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.secondary },
  segmentedControl: { flexDirection: 'row', padding: theme.spacing.xs, borderRadius: theme.radii.full, backgroundColor: theme.colors.secondary },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.sm, borderRadius: theme.radii.full },
  segmentSelected: { backgroundColor: theme.colors.card },
  segmentText: { ...theme.textVariants.label, color: theme.colors.mutedForeground, textAlign: 'center' },
  segmentTextSelected: { color: theme.colors.foreground },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card },
  rowCopy: { flex: 1 },
  rowTitle: { ...theme.textVariants.label, color: theme.colors.foreground },
  action: { ...theme.textVariants.label, color: theme.colors.accent, textAlign: 'right', maxWidth: 112 },
  manageLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg },
  manageLink: { ...theme.textVariants.label, color: theme.colors.accent },
  accent: { color: theme.colors.accent },
}))
