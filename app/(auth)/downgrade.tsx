import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Screen from '@/components/Screen'
import { useAuth } from '@/features/auth/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { createThemedStyles } from '@/styles/createStyles'

export default function DowngradeScreen() {
  const { user } = useAuth()
  const [event, setEvent] = useState<string | null>(null)
  useEffect(() => { void supabase.from('user_entitlements').select('legacy_archive_started_at').eq('user_id', user?.id ?? '').maybeSingle().then(({ data }) => setEvent(data?.legacy_archive_started_at ?? null)) }, [user?.id])
  const continueFree = async () => {
    if (user?.id && event) await AsyncStorage.setItem(`subscription:legacy-archive-ack:${user.id}`, event)
    router.replace('/(auth)/(tabs)/collections')
  }
  return <Screen contentStyle={styles.content}><Text style={styles.title}>Your library is safe</Text><Text style={styles.body}>Free includes 100 active recipes and 50 MB of active imports. Your remaining Premium library stays safely stored in Cloud Archive.</Text><View style={styles.card}><Text style={styles.cardTitle}>What happens now</Text><Text style={styles.body}>Your newest recipes are already active. In Cloud Archive, removing an item from Active keeps it safely archived—it does not delete it. Manage Library is separate and permanently deletes local items to free device space.</Text><View style={styles.manageLinks}><Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/recipes/manage' as never)}><Text style={styles.manageLink}>Manage recipes</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/imports/manage' as never)}><Text style={styles.manageLink}>Manage imports</Text></Pressable></View></View><Pressable style={styles.primary} onPress={() => router.push('/(auth)/archive' as never)}><Text style={styles.primaryText}>Open Cloud Archive</Text></Pressable><Pressable style={styles.secondary} onPress={() => router.push('/(auth)/premium' as never)}><Text style={styles.secondaryText}>Restore full library with Premium</Text></Pressable><Pressable onPress={() => { void continueFree() }}><Text style={styles.continue}>Continue with Free</Text></Pressable></Screen>
}
const styles = createThemedStyles((theme) => ({ content: { justifyContent: 'center', gap: theme.spacing.lg, padding: theme.spacing.xl }, title: { ...theme.textVariants.display, color: theme.colors.foreground }, body: { ...theme.textVariants.body, color: theme.colors.mutedForeground }, card: { padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card, gap: theme.spacing.sm }, cardTitle: { ...theme.textVariants.heading, color: theme.colors.foreground }, manageLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg, paddingTop: theme.spacing.xs }, manageLink: { ...theme.textVariants.label, color: theme.colors.accent }, primary: { padding: theme.spacing.lg, borderRadius: theme.radii.full, backgroundColor: theme.colors.primary, alignItems: 'center' }, primaryText: { ...theme.textVariants.label, color: theme.colors.primaryForeground }, secondary: { minHeight: 48, paddingHorizontal: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.accent, borderRadius: theme.radii.full, alignItems: 'center', justifyContent: 'center' }, secondaryText: { ...theme.textVariants.label, color: theme.colors.accent }, continue: { textAlign: 'center', ...theme.textVariants.body, color: theme.colors.mutedForeground } }))
