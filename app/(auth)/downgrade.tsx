import AsyncStorage from '@react-native-async-storage/async-storage'
import { Feather } from '@expo/vector-icons'
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

  useEffect(() => {
    void supabase
      .from('user_entitlements')
      .select('legacy_archive_started_at')
      .eq('user_id', user?.id ?? '')
      .maybeSingle()
      .then(({ data }) => setEvent(data?.legacy_archive_started_at ?? null))
  }, [user?.id])

  const continueFree = async () => {
    if (user?.id && event) {
      // Keep the local value for immediate, offline-safe dismissal, then
      // persist the same downgrade event to the account for other devices.
      await AsyncStorage.setItem(`subscription:legacy-archive-ack:${user.id}`, event)
      await supabase.rpc('acknowledge_legacy_archive_notice')
    }
    router.replace('/(auth)/(tabs)/collections')
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topRow}>
        <Pressable
          onPress={() => void continueFree()}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close downgrade notice"
          hitSlop={8}
        >
          <Feather name="x" size={22} color={styles.closeIcon.color} />
        </Pressable>
      </View>

      <Text style={styles.title}>Your library is safe</Text>
      <Text style={styles.body}>
        Free includes up to 100 recipes and 50 MB of imports already stored on this device. Your remaining Premium library stays safely archived in the cloud.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What happens now</Text>
        <Text style={styles.body}>
          Items already on this device remain available within the Free limits. To restore your complete library on any device, upgrade to Premium. Manage Library permanently deletes local items to free device space.
        </Text>
        <View style={styles.manageLinks}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/recipes/manage' as never)}>
            <Text style={styles.manageLink}>Manage recipes</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/imports/manage' as never)}>
            <Text style={styles.manageLink}>Manage imports</Text>
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.primary} onPress={() => router.push('/(auth)/premium' as never)}>
        <Text style={styles.primaryText}>Restore full library with Premium</Text>
      </Pressable>
      <Pressable onPress={() => void continueFree()}>
        <Text style={styles.continue}>Continue with Free</Text>
      </Pressable>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { justifyContent: 'center', gap: theme.spacing.lg, padding: theme.spacing.xl },
  topRow: { alignItems: 'flex-end', marginBottom: -theme.spacing.md },
  closeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  closeIcon: { color: theme.colors.mutedForeground },
  title: { ...theme.textVariants.display, color: theme.colors.foreground },
  body: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  card: { padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card, gap: theme.spacing.sm },
  cardTitle: { ...theme.textVariants.heading, color: theme.colors.foreground },
  manageLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.lg, paddingTop: theme.spacing.xs },
  manageLink: { ...theme.textVariants.label, color: theme.colors.accent },
  primary: { padding: theme.spacing.lg, borderRadius: theme.radii.full, backgroundColor: theme.colors.primary, alignItems: 'center' },
  primaryText: { ...theme.textVariants.label, color: theme.colors.primaryForeground },
  continue: { textAlign: 'center', ...theme.textVariants.body, color: theme.colors.mutedForeground },
}))
