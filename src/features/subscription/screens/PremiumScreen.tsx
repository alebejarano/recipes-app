import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import { useAnalyticsCapture } from '@/features/analytics/events'
import Screen from '@/components/Screen'
import { createThemedStyles } from '@/styles/createStyles'

type PremiumScreenProps = {
  onUpgrade?: (billingCycle: 'month' | 'year') => void
  onMaybeLater?: () => void
  isActive?: boolean
  isUpgrading?: boolean
  onManageSubscription?: () => void
}

const checklistItems = [
  'Never lose a recipe',
  'Sync across your devices',
  'Save without limits',
  'Backup your kitchen',
]

const supportingLines = [
  'Cloud backup and sync all your recipes and notes.',
  'Access your kitchen across all your devices.',
  'Unlimited recipes.',
  '5GB cloud storage for imports.',
]

export default function PremiumScreen({
  onUpgrade,
  onMaybeLater,
  isActive = false,
  isUpgrading = false,
  onManageSubscription,
}: PremiumScreenProps) {
  const captureAnalyticsEvent = useAnalyticsCapture()
  const [billingCycle, setBillingCycle] = React.useState<'month' | 'year'>('month')
  const monthlyPrice = 5
  const yearlyPrice = 36
  const yearlyMonthlyEquivalent = yearlyPrice / 12
  const priceValue = billingCycle === 'month' ? `€${monthlyPrice}` : `€${yearlyPrice}`
  const pricePeriod = billingCycle === 'month' ? '/ month' : '/ year'

  return (
    <Screen scroll contentStyle={styles.content}>
      {!!onMaybeLater && (
        <TouchableOpacity style={styles.backRow} onPress={onMaybeLater} activeOpacity={0.75}>
          <Feather name="chevron-left" size={18} style={styles.backIcon} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}

      <Image
        source={require('@assets/illustrations/hero-kitchen.jpg')}
        style={styles.heroImage}
        resizeMode="cover"
      />

      <Text style={styles.title}>Keep your recipes safe everywhere</Text>

      <Text style={styles.subtitle}>
        {isActive
          ? 'Your kitchen is synced, backed up, and fully unlocked.'
          : 'Premium gives you backup, sync, and unlimited saves — so your kitchen is always with you.'}
      </Text>

      {!isActive ? (
        <>
          <View style={styles.billingToggle}>
            <TouchableOpacity
              style={[styles.billingOption, billingCycle === 'month' && styles.billingOptionActive]}
              onPress={() => setBillingCycle('month')}
              activeOpacity={0.85}
            >
              <Text style={[styles.billingOptionText, billingCycle === 'month' && styles.billingOptionTextActive]}>
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.billingOption, billingCycle === 'year' && styles.billingOptionActive]}
              onPress={() => setBillingCycle('year')}
              activeOpacity={0.85}
            >
              <Text style={[styles.billingOptionText, billingCycle === 'year' && styles.billingOptionTextActive]}>
                Yearly
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>{priceValue}</Text>
            <Text style={styles.pricePeriod}>{pricePeriod}</Text>
          </View>
          {billingCycle === 'year' ? (
            <Text style={styles.yearlyNote}>That&apos;s €{yearlyMonthlyEquivalent} per month</Text>
          ) : null}
        </>
      ) : null}

      <Text style={styles.includedTitle}>Everything included</Text>

      <View style={styles.featuresList}>
        {checklistItems.map((item) => (
          <View key={item} style={styles.featureRow}>
            <View style={styles.featureLeft}>
              <Text style={styles.featureCheck}>✔</Text>
              <Text style={styles.featureTitle}>{item}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.supportingLines}>
        {supportingLines.map((line) => (
          <Text key={line} style={styles.featureSubtitle}>
            {line}
          </Text>
        ))}
      </View>

      {isActive ? (
        <Button
          onPress={onManageSubscription ?? (() => {})}
          variant="secondary"
          size="xl"
          style={styles.ctaButton}
        >
          Manage Subscription
        </Button>
      ) : (
        <Button
          onPress={() => {
            captureAnalyticsEvent('upgrade_clicked', {
              surface: 'premium_screen',
              billing_cycle: billingCycle,
            })
            onUpgrade?.(billingCycle)
          }}
          variant="premium"
          size="xl"
          style={styles.ctaButton}
          disabled={!onUpgrade || isUpgrading}
        >
          {isUpgrading ? 'Upgrading...' : 'Unlock Premium'}
        </Button>
      )}
      {!isActive ? (
        <Text style={styles.trustText}>
          It&apos;s €5. Not €4.99. Yes, we rounded it — we cook honestly.
        </Text>
      ) : null}

    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing['3xl'],
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backRow: {
    width: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  backIcon: {
    color: theme.colors.mutedForeground,
  },
  backText: {
    marginLeft: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  heroImage: {
    width: '100%',
    maxWidth: 390,
    height: 270,
    borderRadius: theme.radii.xl,
  },
  title: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    color: theme.colors.foreground,
    maxWidth: 340,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
    maxWidth: 360,
  },
  billingToggle: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.creamDark,
    borderRadius: theme.radii.full,
    padding: theme.spacing.xxs,
  },
  billingOption: {
    minWidth: 116,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billingOptionActive: {
    backgroundColor: theme.colors.background,
  },
  billingOptionText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.mutedForeground,
  },
  billingOptionTextActive: {
    color: theme.colors.foreground,
  },
  priceRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  yearlyNote: {
    marginTop: -theme.spacing.xxs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  priceValue: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 64,
    lineHeight: 72,
    color: theme.colors.foreground,
  },
  pricePeriod: {
    marginLeft: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.mutedForeground,
  },
  includedTitle: {
    marginTop: theme.spacing.xl,
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  featuresList: {
    width: '100%',
    maxWidth: 320,
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.sm,
  },
  featureCheck: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
  },
  featureTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
  supportingLines: {
    width: '100%',
    maxWidth: 320,
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  featureSubtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  ctaButton: {
    width: '100%',
    maxWidth: 320,
    marginTop: theme.spacing['2xl'],
  },
  trustText: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    maxWidth: 320,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
}))
