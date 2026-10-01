import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import Screen from '@/components/Screen'
import { createThemedStyles } from '@/styles/createStyles'

export default function CloudArchiveRoute() {
  return (
    <Screen scroll contentStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back">
        <Feather name="chevron-left" size={20} />
        <Text>Back</Text>
      </Pressable>

      <View style={styles.iconCircle}>
        <Feather name="archive" size={28} color={styles.icon.color} />
      </View>
      <Text style={styles.title}>Your library is safely archived</Text>
      <Text style={styles.subtitle}>Your previous Premium recipes and imports remain protected in the cloud. Free keeps only the items already stored on this device, within the Free limits.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Restore your full library anywhere</Text>
        <Text style={styles.cardBody}>Upgrade to Premium to access your complete library and sync it to a new phone or tablet.</Text>
      </View>

      <Pressable style={styles.primary} onPress={() => router.push('/(auth)/premium' as never)} accessibilityRole="button" accessibilityLabel="Restore full library with Premium">
        <Text style={styles.primaryText}>Restore full library with Premium</Text>
      </Pressable>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { gap: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
  back: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, minHeight: 44 },
  iconCircle: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: theme.colors.accent10, marginTop: theme.spacing.lg },
  title: { ...theme.textVariants.display, color: theme.colors.foreground },
  subtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  card: { gap: theme.spacing.sm, padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card, marginTop: theme.spacing.sm },
  cardTitle: { ...theme.textVariants.heading, color: theme.colors.foreground },
  cardBody: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.lg, borderRadius: theme.radii.full, backgroundColor: theme.colors.primary, marginTop: theme.spacing.sm },
  primaryText: { ...theme.textVariants.label, color: theme.colors.primaryForeground },
  icon: { color: theme.colors.accent },
}))
