import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import { useAnalyticsCapture } from '@/features/analytics/events'
import Screen from '@/components/Screen'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type BillingCycle = 'month' | 'year'
type FeatherIconName = React.ComponentProps<typeof Feather>['name']

type PremiumScreenProps = {
  onUpgrade?: (billingCycle: BillingCycle) => void
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
}: PremiumScreenProps) {
  const captureAnalyticsEvent = useAnalyticsCapture()
  const { t } = useTranslation()
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('year')
  const benefits: { title: string; description: string; icon: FeatherIconName }[] = [
    { title: t('subscription.premium.checklist.neverLose'), description: t('subscription.premium.benefitDescriptions.neverLose'), icon: 'bookmark' },
    { title: t('subscription.premium.checklist.syncDevices'), description: t('subscription.premium.benefitDescriptions.syncDevices'), icon: 'refresh-cw' },
    { title: t('subscription.premium.checklist.unlimited'), description: t('subscription.premium.benefitDescriptions.unlimited'), icon: 'repeat' },
    { title: t('subscription.premium.benefitDescriptions.organizedTitle'), description: t('subscription.premium.benefitDescriptions.organized'), icon: 'folder' },
    { title: t('subscription.premium.benefitDescriptions.storageTitle'), description: t('subscription.premium.benefitDescriptions.storage'), icon: 'database' },
  ]

  return (
    <Screen scroll contentStyle={styles.content}>
      {!!onMaybeLater && (
        <TouchableOpacity style={styles.backRow} onPress={onMaybeLater} activeOpacity={0.75}>
          <Feather name="chevron-left" size={18} style={styles.backIcon} />
          <Text style={styles.backText}>{t('subscription.premium.back')}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>{t('subscription.premium.includedTitle')}</Text>

      <View style={styles.benefitsCard}>
        {benefits.map((benefit, index) => (
          <React.Fragment key={benefit.title}>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Feather name={benefit.icon} size={24} color={styles.benefitIconGlyph.color} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
            {index < benefits.length - 1 ? <View style={styles.benefitDivider} /> : null}
          </React.Fragment>
        ))}
      </View>

      {!isActive ? (
        <View style={styles.plansRow}>
          <TouchableOpacity
            style={[styles.planCard, billingCycle === 'month' && styles.planCardSelected]}
            onPress={() => setBillingCycle('month')}
            activeOpacity={0.85}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planName, billingCycle === 'month' && styles.planTextSelected]}>{t('subscription.premium.monthly')}</Text>
              <View style={[styles.selectionIndicator, billingCycle === 'month' && styles.selectionIndicatorSelected]}>
                {billingCycle === 'month' ? <Feather name="check" size={16} color={styles.selectionCheck.color} /> : null}
              </View>
            </View>
            <View style={styles.planPriceRow}>
              <Text style={[styles.planPrice, billingCycle === 'month' && styles.planTextSelected]}>{monthlyPriceLabel}</Text>
              <Text style={[styles.planPeriod, billingCycle === 'month' && styles.planTextSelected]}>{t('subscription.premium.perMonth')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, styles.yearlyPlanCard, billingCycle === 'year' && styles.planCardSelected]}
            onPress={() => setBillingCycle('year')}
            activeOpacity={0.85}
          >
            <View style={styles.bestValueBadge}><Text style={styles.bestValueText}>{t('subscription.premium.bestValue')}</Text></View>
            <View style={styles.planHeader}>
              <Text style={[styles.planName, styles.yearlyPlanText]}>{t('subscription.premium.yearly')}</Text>
              <View style={[styles.selectionIndicator, billingCycle === 'year' && styles.selectionIndicatorSelected]}>
                {billingCycle === 'year' ? <Feather name="check" size={16} color={styles.selectionCheck.color} /> : null}
              </View>
            </View>
            <View style={styles.planPriceRow}>
              <Text style={[styles.planPrice, styles.yearlyPlanText]}>{yearlyPriceLabel}</Text>
              <Text style={[styles.planPeriod, styles.yearlyPlanText]}>{t('subscription.premium.perYear')}</Text>
            </View>
            <View style={styles.freeMonthsBadge}>
              <Feather name="gift" size={16} color={styles.freeMonthsText.color} />
              <Text style={styles.freeMonthsText}>{t('subscription.premium.yearlyFreeMonths')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      <Button
        onPress={isActive ? onManageSubscription ?? (() => {}) : () => {
          captureAnalyticsEvent('upgrade_clicked', { surface: 'premium_screen', billing_cycle: billingCycle })
          onUpgrade?.(billingCycle)
        }}
        variant={isActive ? "secondary" : "premium"}
        size="xl"
        style={styles.ctaButton}
        disabled={!isActive && (!onUpgrade || isUpgrading)}
      >
        {isActive ? t('subscription.premium.manage') : isUpgrading ? t('subscription.premium.upgrading') : t('subscription.premium.unlock')}
      </Button>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing['3xl'], alignItems: 'center', gap: theme.spacing.xl },
  backRow: { alignSelf: 'stretch', minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  backIcon: { color: theme.colors.mutedForeground },
  backText: { marginLeft: theme.spacing.xs, ...theme.textVariants.body, color: theme.colors.mutedForeground },
  title: { textAlign: 'center', ...theme.textVariants.hero, color: theme.colors.foreground },
  benefitsCard: { width: '100%', maxWidth: 480 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, paddingVertical: theme.spacing.lg },
  benefitIcon: { width: 56, height: 56, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radii.full, backgroundColor: theme.colors.accent10 },
  benefitIconGlyph: { color: theme.colors.accent },
  benefitCopy: { flex: 1, gap: theme.spacing.xs },
  benefitTitle: { ...theme.textVariants.heading, color: theme.colors.foreground },
  benefitDescription: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  benefitDivider: { height: 1, backgroundColor: theme.colors.border },
  plansRow: { width: '100%', maxWidth: 480, flexDirection: 'row', alignItems: 'stretch', gap: theme.spacing.md },
  planCard: { flex: 1, minHeight: 178, padding: theme.spacing.lg, justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, backgroundColor: theme.colors.card },
  planCardSelected: { borderWidth: 2, borderColor: theme.colors.accent },
  yearlyPlanCard: { paddingTop: theme.spacing['2xl'] },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  planName: { ...theme.textVariants.heading, color: theme.colors.foreground },
  planTextSelected: { color: theme.colors.accent },
  yearlyPlanText: { color: theme.colors.accent },
  selectionIndicator: { width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.mutedForeground, borderRadius: theme.radii.full },
  selectionIndicatorSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
  selectionCheck: { color: theme.colors.accentForeground },
  planPriceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: theme.spacing.xs },
  planPrice: { fontFamily: theme.fontFamily.bold, fontSize: theme.fontSize.display, lineHeight: theme.lineHeight.display, color: theme.colors.foreground },
  planPeriod: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  bestValueBadge: { position: 'absolute', zIndex: 1, top: -theme.spacing.md, alignSelf: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.radii.full, backgroundColor: theme.colors.accentLight },
  bestValueText: { ...theme.textVariants.labelSmall, color: theme.colors.accent },
  freeMonthsBadge: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  freeMonthsText: { ...theme.textVariants.label, color: theme.colors.primary },
  ctaButton: { width: '100%', maxWidth: 480, marginTop: theme.spacing.xs },
}))
