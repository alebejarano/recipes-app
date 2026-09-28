import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Pressable, Text, View } from 'react-native'

import Screen from '@/components/Screen'
import { listFreeImportArchiveMetadata } from '@/features/recipes/api/freeArchiveRepo'
import { useLibraryRecipesList } from '@/features/recipes/hooks/useLibraryRecipes'
import { createThemedStyles } from '@/styles/createStyles'

export default function CloudArchiveRoute() {
  const recipesQuery = useLibraryRecipesList({ limit: 2000, includeArchive: true }, 'auth')
  const importsQuery = useQuery({
    queryKey: ['recipes', 'library', 'archive-imports'],
    queryFn: listFreeImportArchiveMetadata,
    retry: false,
  })
  const recipes = (recipesQuery.data ?? []).filter((item) => item.access === 'archived')
  const imports = importsQuery.data ?? []

  return (
    <Screen scroll contentStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Feather name="chevron-left" size={20} /><Text>Collections</Text></Pressable>
      <Text style={styles.title}>Cloud Archive</Text>
      <Text style={styles.subtitle}>Your Premium library is safely stored here. Upgrade to edit and sync everything.</Text>

      <Text style={styles.heading}>Recipes ({recipes.length})</Text>
      {recipes.map(({ recipe }) => (
        <View key={recipe.id} style={styles.row}>
          <Feather name="cloud" size={18} color={styles.icon.color} />
          <View style={styles.copy}><Text style={styles.rowTitle}>{recipe.title}</Text><Text style={styles.rowSubtitle}>Read-only cloud recipe</Text></View>
          <Pressable onPress={() => router.push('/(auth)/premium')}><Text style={styles.action}>Upgrade</Text></Pressable>
        </View>
      ))}

      <Text style={styles.heading}>Imports ({imports.length})</Text>
      {imports.map((item) => (
        <View key={item.id} style={styles.row}>
          <Feather name="lock" size={18} color={styles.icon.color} />
          <View style={styles.copy}><Text style={styles.rowTitle}>{item.title ?? item.fileName}</Text><Text style={styles.rowSubtitle}>{Math.ceil(item.bytes / 1024 / 1024)} MB · Cloud archive</Text></View>
          <Pressable onPress={() => router.push('/(auth)/premium')}><Text style={styles.action}>Upgrade</Text></Pressable>
        </View>
      ))}
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { gap: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
  back: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, minHeight: 44 },
  title: { ...theme.textVariants.display, color: theme.colors.foreground },
  subtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  heading: { ...theme.textVariants.heading, color: theme.colors.foreground, marginTop: theme.spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, padding: theme.spacing.md, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card },
  icon: { color: theme.colors.accent },
  copy: { flex: 1 },
  rowTitle: { ...theme.textVariants.label, color: theme.colors.foreground },
  rowSubtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  action: { ...theme.textVariants.label, color: theme.colors.accent },
}))
