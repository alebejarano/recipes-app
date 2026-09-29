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
      <View style={styles.previewNotice}>
        <Feather name="info" size={18} color={styles.accent.color} />
        <Text style={styles.noticeText}>TEST PREVIEW — sample data only. Nothing is saved, uploaded, or deleted.</Text>
      </View>

      {!showArchive ? (
        <>
          <Text style={styles.title}>Your library is safe</Text>
          <Text style={styles.body}>Preview: a Premium account with 150 recipes and imports has downgraded. Free keeps up to 100 active recipes and 50 MB of active imports; the rest stays safely archived.</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>What happens now</Text>
            <Text style={styles.body}>Removing an item from Active keeps it safely archived. It does not delete it. Permanently deleting items is a separate action in Manage Library.</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.primary} onPress={() => setShowArchive(true)}>
            <Text style={styles.primaryText}>Open Cloud Archive</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Close preview</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable accessibilityRole="button" style={styles.back} onPress={() => setShowArchive(false)}>
            <Feather name="chevron-left" size={20} color={styles.accent.color} />
            <Text style={styles.action}>Downgrade notice</Text>
          </Pressable>
          <Text style={styles.title}>Cloud Archive</Text>
          <Text style={styles.body}>Choose what stays available on Free. Archived items remain safely stored and can be made active later.</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Active Library preview</Text>
            <Text style={styles.body}>Recipes: {activeRecipeIds.length} / {FREE_PLAN_MAX_RECIPES}</Text>
            <Text style={styles.body}>Imports: {sizeLabel(activeImportBytes)} / 50 MB</Text>
          </View>

          <Text style={styles.sectionTitle}>Recipes ({recipes.length})</Text>
          {recipes.map((item) => {
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
          })}

          <Text style={styles.sectionTitle}>Imports ({imports.length})</Text>
          {imports.map((item) => {
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
          })}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Permanent deletion is separate</Text>
            <Text style={styles.body}>Cloud Archive only changes what is Active. To permanently delete real items, go to Manage Library. This preview never deletes anything.</Text>
          </View>
          <Pressable accessibilityRole="button" style={styles.secondary} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Close preview</Text>
          </Pressable>
        </>
      )}
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { gap: theme.spacing.md, padding: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
  previewNotice: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.secondary },
  noticeText: { ...theme.textVariants.label, color: theme.colors.foreground, flex: 1 },
  title: { ...theme.textVariants.display, color: theme.colors.foreground },
  body: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  card: { gap: theme.spacing.sm, padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card },
  cardTitle: { ...theme.textVariants.heading, color: theme.colors.foreground },
  primary: { padding: theme.spacing.lg, borderRadius: theme.radii.full, backgroundColor: theme.colors.accent, alignItems: 'center' },
  primaryText: { ...theme.textVariants.label, color: theme.colors.accentForeground },
  secondary: { padding: theme.spacing.md, alignItems: 'center' },
  secondaryText: { ...theme.textVariants.label, color: theme.colors.accent },
  back: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  sectionTitle: { ...theme.textVariants.heading, color: theme.colors.foreground, marginTop: theme.spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card },
  rowCopy: { flex: 1 },
  rowTitle: { ...theme.textVariants.label, color: theme.colors.foreground },
  action: { ...theme.textVariants.label, color: theme.colors.accent, textAlign: 'right', maxWidth: 112 },
  accent: { color: theme.colors.accent },
}))
