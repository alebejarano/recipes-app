import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import { useAnalyticsCapture } from '@/features/analytics/events'
import Screen from '@/components/Screen'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type PremiumScreenProps = {
  onUpgrade?: (billingCycle: 'month' | 'year') => void
  onMaybeLater?: () => void
  isActive?: boolean
  isUpgrading?: boolean
  onManageSubscription?: () => void
  monthlyPriceLabel?: string
  yearlyPriceLabel?: string
  yearlyMonthlyEquivalentLabel?: string | null
}

export default function PremiumScreen({
  onUpgrade,
  onMaybeLater,
  isActive = false,
  isUpgrading = false,
  onManageSubscription,
  monthlyPriceLabel = '€5',
  yearlyPriceLabel = '€36',
  yearlyMonthlyEquivalentLabel,
}: PremiumScreenProps) {
  const captureAnalyticsEvent = useAnalyticsCapture()
  const { t } = useTranslation()
  const [billingCycle, setBillingCycle] = React.useState<'month' | 'year'>('month')
  const priceValue = billingCycle === 'month' ? monthlyPriceLabel : yearlyPriceLabel
  const pricePeriod = billingCycle === 'month' ? t('subscription.premium.perMonth') : t('subscription.premium.perYear')
  const checklistItems = [
    t('subscription.premium.checklist.neverLose'),
    t('subscription.premium.checklist.syncDevices'),
    t('subscription.premium.checklist.unlimited'),
    t('subscription.premium.checklist.backup'),
  ]
  const supportingLines = [
    t('subscription.premium.supporting.backup'),
    t('subscription.premium.supporting.access'),
    t('subscription.premium.supporting.unlimited'),
    t('subscription.premium.supporting.storage'),
  ]

  return (
    <Screen scroll contentStyle={styles.content}>
      {!!onMaybeLater && (
        <TouchableOpacity style={styles.backRow} onPress={onMaybeLater} activeOpacity={0.75}>
          <Feather name="chevron-left" size={18} style={styles.backIcon} />
          <Text style={styles.backText}>{t('subscription.premium.back')}</Text>
        </TouchableOpacity>
      )}

      <Image
        source={require('@assets/illustrations/hero-kitchen.jpg')}
        style={styles.heroImage}
        resizeMode="cover"
      />

      <Text style={styles.title}>{t('subscription.premium.title')}</Text>

      <Text style={styles.subtitle}>
        {isActive
          ? t('subscription.premium.subtitleActive')
          : t('subscription.premium.subtitleInactive')}
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
                {t('subscription.premium.monthly')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.billingOption, billingCycle === 'year' && styles.billingOptionActive]}
              onPress={() => setBillingCycle('year')}
              activeOpacity={0.85}
            >
              <Text style={[styles.billingOptionText, billingCycle === 'year' && styles.billingOptionTextActive]}>
                {t('subscription.premium.yearly')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>{priceValue}</Text>
            <Text style={styles.pricePeriod}>{pricePeriod}</Text>
          </View>
          {billingCycle === 'year' && yearlyMonthlyEquivalentLabel ? (
            <Text style={styles.yearlyNote}>{t('subscription.premium.yearlyNote', { price: yearlyMonthlyEquivalentLabel })}</Text>
          ) : null}
        </>
      ) : null}

      <Text style={styles.includedTitle}>{t('subscription.premium.includedTitle')}</Text>

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
          {t('subscription.premium.manage')}
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
          {isUpgrading ? t('subscription.premium.upgrading') : t('subscription.premium.unlock')}
        </Button>
      )}
      {!isActive ? (
        <Text style={styles.trustText}>
          {t('subscription.premium.trust')}
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
    ...theme.textVariants.body,
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
    ...theme.textVariants.hero,
    color: theme.colors.foreground,
    maxWidth: 340,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    ...theme.textVariants.subtitle,
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
    ...theme.textVariants.heading,
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
    ...theme.textVariants.body,
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
    ...theme.textVariants.title,
    color: theme.colors.mutedForeground,
  },
  includedTitle: {
    marginTop: theme.spacing.xl,
    textAlign: 'center',
    ...theme.textVariants.heading,
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
    ...theme.textVariants.emphasis,
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
    ...theme.textVariants.caption,
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
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
}))
