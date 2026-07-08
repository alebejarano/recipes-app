import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Alert, Linking, Platform, Text, View } from 'react-native'

import Button from '@/components/Button'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { i18n } from '@/localization/i18n'
import { createThemedStyles } from '@/styles/createStyles'

type ManageSubscriptionScreenProps = {
  onBack: () => void
  onDowngradeToFreeForTest?: () => void
  premiumPlanLabel?: string
  premiumNextRenewalLabel?: string
  onOpenCustomerCenter?: () => void
  onRestorePurchases?: () => void
  isRestoring?: boolean
}

function getManageSubscriptionLabel() {
  if (Platform.OS === 'ios') return i18n.t('subscription.manage.manageAppStore')
  if (Platform.OS === 'android') return i18n.t('subscription.manage.manageGooglePlay')
  return i18n.t('subscription.manage.manageGeneric')
}

async function openStoreSubscriptionSettings() {
  const url = Platform.select({
    ios: 'itms-apps://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
    default: null,
  })

  if (!url) {
    Alert.alert(
      i18n.t('subscription.manage.fallbackTitle'),
      i18n.t('subscription.manage.fallbackBody')
    )
    return
  }

  try {
    await Linking.openURL(url)
  } catch {
    Alert.alert(
      i18n.t('subscription.manage.fallbackTitle'),
      i18n.t('subscription.manage.fallbackOpenBody')
    )
  }
}

export default function ManageSubscriptionScreen({
  onBack,
  onDowngradeToFreeForTest,
  premiumPlanLabel = '€5/month',
  premiumNextRenewalLabel = i18n.t('subscription.premium.renewsOn', { date: 'Mar 27, 2026' }),
  onOpenCustomerCenter,
  onRestorePurchases,
  isRestoring = false,
}: ManageSubscriptionScreenProps) {
  const manageSubscriptionLabel = getManageSubscriptionLabel()

  return (
    <ProfileSubpageLayout title={i18n.t('subscription.manage.title')} onBack={onBack}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Feather name="credit-card" size={22} color={styles.icon.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>{i18n.t('subscription.manage.premiumName')}</Text>
            <Text style={styles.cardSubtitle}>{premiumPlanLabel}</Text>
          </View>
        </View>

        <Text style={styles.renewal}>{premiumNextRenewalLabel}</Text>
        <Text style={styles.copy}>
          {i18n.t('subscription.manage.copy')}
        </Text>

        <Button
          onPress={() => {
            if (onOpenCustomerCenter) {
              onOpenCustomerCenter()
              return
            }

            void openStoreSubscriptionSettings()
          }}
          variant="secondary"
          size="md"
          icon={<Feather name="external-link" size={16} color={styles.buttonIcon.color} />}
        >
          {manageSubscriptionLabel}
        </Button>

        {onRestorePurchases ? (
          <Button onPress={onRestorePurchases} variant="secondary" size="md">
            {isRestoring
              ? i18n.t('subscription.manage.restoring')
              : i18n.t('subscription.manage.restorePurchases')}
          </Button>
        ) : null}
      </View>

      {onDowngradeToFreeForTest ? (
        <Button onPress={onDowngradeToFreeForTest} variant="secondary" size="md">
          {i18n.t('subscription.manage.downgrade')}
        </Button>
      ) : null}
    </ProfileSubpageLayout>
  )
}

const styles = createThemedStyles((theme) => ({
  card: {
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
  },
  icon: {
    color: theme.colors.primary,
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  cardTitle: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  cardSubtitle: {
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
  },
  renewal: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  copy: {
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  buttonIcon: {
    color: theme.colors.secondaryForeground,
  },
}))
