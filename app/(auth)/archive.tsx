import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Text, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

export default function CloudArchiveRoute() {
  const { t } = useTranslation()

  return (
    <Screen scroll contentStyle={styles.content}>
      <Button
        variant="ghost"
        size="md"
        onPress={() => router.back()}
        style={styles.back}
        icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
      >
        {t('subscription.archive.back')}
      </Button>

      <View style={styles.iconCircle}>
        <Feather name="archive" size={28} color={styles.icon.color} />
      </View>
      <Text style={styles.title}>{t('subscription.archive.title')}</Text>
      <Text style={styles.subtitle}>{t('subscription.archive.subtitle')}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('subscription.archive.cardTitle')}</Text>
        <Text style={styles.cardBody}>{t('subscription.archive.cardBody')}</Text>
      </View>

      <Button variant="primary" size="lg" onPress={() => router.push('/(auth)/premium' as never)}>
        {t('subscription.archive.restore')}
      </Button>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { gap: theme.spacing.md, paddingTop: theme.spacing.md, paddingBottom: theme.spacing['3xl'] },
  back: { width: 'auto', alignSelf: 'flex-start', paddingHorizontal: theme.spacing.sm, marginLeft: -theme.spacing.sm },
  backIcon: { color: theme.colors.mutedForeground },
  iconCircle: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: theme.colors.accent10, marginTop: theme.spacing.lg },
  title: { ...theme.textVariants.display, color: theme.colors.foreground },
  subtitle: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  card: { gap: theme.spacing.sm, padding: theme.spacing.lg, borderRadius: theme.radii.lg, backgroundColor: theme.colors.card, marginTop: theme.spacing.sm },
  cardTitle: { ...theme.textVariants.heading, color: theme.colors.foreground },
  cardBody: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  icon: { color: theme.colors.accent },
}))
