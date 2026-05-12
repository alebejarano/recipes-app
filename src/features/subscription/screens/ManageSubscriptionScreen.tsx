import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Alert, Linking, Platform, Text, View } from 'react-native'

import Button from '@/components/Button'
import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { createThemedStyles } from '@/styles/createStyles'

type ManageSubscriptionScreenProps = {
  onBack: () => void
  onDowngradeToFreeForTest?: () => void
  premiumPlanLabel?: string
  premiumNextRenewalLabel?: string
}

function getManageSubscriptionLabel() {
  if (Platform.OS === 'ios') return 'Manage in App Store'
  if (Platform.OS === 'android') return 'Manage in Google Play'
  return 'Manage subscription'
}

async function openStoreSubscriptionSettings() {
  const url = Platform.select({
    ios: 'itms-apps://apps.apple.com/account/subscriptions',
    android: 'https://play.google.com/store/account/subscriptions',
    default: null,
  })

  if (!url) {
    Alert.alert(
      'Manage subscription',
      'Manage your Premium subscription from the App Store or Google Play account used for purchase.'
    )
    return
  }

  try {
    await Linking.openURL(url)
  } catch {
    Alert.alert(
      'Manage subscription',
      'Open your App Store or Google Play subscriptions to cancel or change Premium.'
    )
  }
}

export default function ManageSubscriptionScreen({
  onBack,
  onDowngradeToFreeForTest,
  premiumPlanLabel = '€5/month',
  premiumNextRenewalLabel = 'Renews Mar 27, 2026',
}: ManageSubscriptionScreenProps) {
  const manageSubscriptionLabel = getManageSubscriptionLabel()

  return (
    <ProfileSubpageLayout title="Manage Subscription" onBack={onBack}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <Feather name="credit-card" size={22} color={styles.icon.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.cardTitle}>Premium</Text>
            <Text style={styles.cardSubtitle}>{premiumPlanLabel}</Text>
          </View>
        </View>

        <Text style={styles.renewal}>{premiumNextRenewalLabel}</Text>
        <Text style={styles.copy}>
          To cancel or change Premium, manage the subscription from the store account used for
          purchase. Premium access stays active until the end of the current billing period.
        </Text>

        <Button
          onPress={() => {
            void openStoreSubscriptionSettings()
          }}
          variant="secondary"
          size="md"
          icon={<Feather name="external-link" size={16} color={styles.buttonIcon.color} />}
        >
          {manageSubscriptionLabel}
        </Button>
      </View>

      {onDowngradeToFreeForTest ? (
        <Button onPress={onDowngradeToFreeForTest} variant="secondary" size="md">
          Downgrade to Free
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  cardSubtitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  renewal: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  copy: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  buttonIcon: {
    color: theme.colors.secondaryForeground,
  },
}))
