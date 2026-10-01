import { Feather } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  isPurchaseReady?: boolean
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
  isPurchaseReady = true,
  onManageSubscription,
  monthlyPriceLabel = '€5',
  yearlyPriceLabel = '€36',
  yearlyMonthlyEquivalentLabel,
}: PremiumScreenProps) {
  const captureAnalyticsEvent = useAnalyticsCapture()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('year')
  const [purchaseBarHeight, setPurchaseBarHeight] = React.useState(180)
  const renewalDisclosure = billingCycle === 'year'
    ? t('subscription.premium.yearlyRenewalDisclosure', {
        price: yearlyPriceLabel,
        monthlyPrice: yearlyMonthlyEquivalentLabel ?? t('subscription.premium.yearlyMonthlyEquivalentFallback'),
      })
    : t('subscription.premium.monthlyRenewalDisclosure', { price: monthlyPriceLabel })
  const benefits: { title: string; description: string; icon: FeatherIconName }[] = [
    { title: t('subscription.premium.checklist.neverLose'), description: t('subscription.premium.benefitDescriptions.neverLose'), icon: 'bookmark' },
    { title: t('subscription.premium.checklist.restore'), description: t('subscription.premium.benefitDescriptions.restore'), icon: 'download-cloud' },
    { title: t('subscription.premium.checklist.syncDevices'), description: t('subscription.premium.benefitDescriptions.syncDevices'), icon: 'refresh-cw' },
    { title: t('subscription.premium.checklist.unlimited'), description: t('subscription.premium.benefitDescriptions.unlimited'), icon: 'repeat' },
    { title: t('subscription.premium.benefitDescriptions.organizedTitle'), description: t('subscription.premium.benefitDescriptions.organized'), icon: 'folder' },
    { title: t('subscription.premium.benefitDescriptions.storageTitle'), description: t('subscription.premium.benefitDescriptions.storage'), icon: 'database' },
  ]

  return (
    <>
      <View style={styles.root}>
      <Screen scroll contentStyle={[styles.content, { paddingBottom: purchaseBarHeight + 16 }]}>
      {!!onMaybeLater && (
        <TouchableOpacity style={styles.backRow} onPress={onMaybeLater} activeOpacity={0.75}>
          <Feather name="chevron-left" size={18} style={styles.backIcon} />
          <Text style={styles.backText}>{t('subscription.premium.back')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.heroCopy}>
        <Text style={styles.heroTitle}>
          {t('subscription.premium.titleLead')}
          <Text style={styles.heroTitleAccent}>{t('subscription.premium.titleAccent')}</Text>
        </Text>
        <Text style={styles.heroSubtitle}>{t('subscription.premium.subtitleInactive')}</Text>
      </View>

      <View style={styles.benefitsCard}>
        {benefits.map((benefit) => (
          <React.Fragment key={benefit.title}>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Feather name={benefit.icon} size={20} color={styles.benefitIconGlyph.color} />
              </View>
              <View style={styles.benefitCopy}>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>

      {!isActive ? (
        <View style={styles.plansRow}>
          <TouchableOpacity
            style={[styles.planCard, billingCycle === 'month' && styles.planCardSelected]}
            onPress={() => setBillingCycle('month')}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected: billingCycle === 'month' }}
          >
            <View style={styles.planOptionCopy}>
              <Text style={[styles.planName, billingCycle === 'month' && styles.planTextSelected]}>{t('subscription.premium.monthlyPlanTitle')}</Text>
              <Text style={styles.planHint}>{t('subscription.premium.monthlyPlanHint')}</Text>
            </View>
            <View style={styles.planOptionPrice}>
              <Text style={[styles.planPrice, billingCycle === 'month' && styles.planTextSelected]}>{monthlyPriceLabel}</Text>
              <Text style={[styles.planPeriod, billingCycle === 'month' && styles.planTextSelected]}>{t('subscription.premium.perMonth')}</Text>
            </View>
            <View style={[styles.selectionIndicator, billingCycle === 'month' && styles.selectionIndicatorSelected]}>
              {billingCycle === 'month' ? <Feather name="check" size={16} color={styles.selectionCheck.color} /> : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, styles.yearlyPlanCard, billingCycle === 'year' && styles.planCardSelected]}
            onPress={() => setBillingCycle('year')}
            activeOpacity={0.85}
            accessibilityRole="radio"
            accessibilityState={{ selected: billingCycle === 'year' }}
          >
            <View style={styles.bestValueBadge}><Text style={styles.bestValueText}>{t('subscription.premium.bestValue')}</Text></View>
            <View style={styles.planOptionCopy}>
              <Text style={[styles.planName, billingCycle === 'year' && styles.planTextSelected]}>{t('subscription.premium.yearly')}</Text>
              <View style={styles.freeMonthsBadge}>
                <Feather name="gift" size={16} color={styles.freeMonthsText.color} />
                <Text style={styles.freeMonthsText}>{t('subscription.premium.yearlyFreeMonths')}</Text>
              </View>
            </View>
            <View style={styles.planOptionPrice}>
              <Text style={[styles.planPrice, billingCycle === 'year' && styles.planTextSelected]}>{yearlyPriceLabel}</Text>
              <Text style={[styles.planPeriod, billingCycle === 'year' && styles.planTextSelected]}>{t('subscription.premium.perYear')}</Text>
            </View>
            <View style={[styles.selectionIndicator, billingCycle === 'year' && styles.selectionIndicatorSelected]}>
              {billingCycle === 'year' ? <Feather name="check" size={16} color={styles.selectionCheck.color} /> : null}
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      </Screen>

      <View
        onLayout={({ nativeEvent }) => {
          const nextHeight = nativeEvent.layout.height
          setPurchaseBarHeight((currentHeight) => currentHeight === nextHeight ? currentHeight : nextHeight)
        }}
        style={[styles.purchaseBar, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.purchaseBarContent}>
      <Button
        onPress={isActive ? onManageSubscription ?? (() => {}) : () => {
          captureAnalyticsEvent('upgrade_clicked', { surface: 'premium_screen', billing_cycle: billingCycle })
          onUpgrade?.(billingCycle)
        }}
        variant={isActive ? "secondary" : "premium"}
        size="xl"
        style={styles.ctaButton}
        disabled={!isActive && (!onUpgrade || isUpgrading || !isPurchaseReady)}
      >
        {isActive
          ? t('subscription.premium.manage')
          : isUpgrading
            ? t('subscription.premium.upgrading')
            : !isPurchaseReady
              ? t('subscription.premium.loadingPlans')
              : t('subscription.premium.unlock')}
      </Button>
      {!isActive ? <Text style={styles.renewalDisclosure}>{renewalDisclosure}</Text> : null}
        </View>
      </View>

      </View>

      <Modal visible={isUpgrading} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={styles.loadingSpinner.color} />
            <Text style={styles.loadingTitle}>{t('subscription.premium.activatingTitle')}</Text>
            <Text style={styles.loadingBody}>{t('subscription.premium.activatingBody')}</Text>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = createThemedStyles((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing['3xl'], alignItems: 'center', gap: theme.spacing.xl },
  backRow: { alignSelf: 'stretch', minHeight: 44, flexDirection: 'row', alignItems: 'center' },
  backIcon: { color: theme.colors.mutedForeground },
  backText: { marginLeft: theme.spacing.xs, ...theme.textVariants.body, color: theme.colors.mutedForeground },
  heroCopy: { width: '100%', maxWidth: 480, alignItems: 'flex-start', gap: theme.spacing.md },
  heroTitle: { width: '100%', textAlign: 'left', fontFamily: theme.fontFamily.fraunces, fontSize: 38, lineHeight: 44, color: theme.colors.foreground },
  heroTitleAccent: { color: theme.colors.accent },
  heroSubtitle: { maxWidth: 440, textAlign: 'left', fontFamily: theme.fontFamily.regular, fontSize: theme.fontSize.lg, lineHeight: theme.lineHeight.lg, color: theme.colors.mutedForeground },
  benefitsCard: { width: '100%', maxWidth: 480 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg, paddingVertical: theme.spacing.lg },
  benefitIcon: { width: 48, height: 48, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: theme.radii.full, backgroundColor: theme.colors.accent10 },
  benefitIconGlyph: { color: theme.colors.accent },
  benefitCopy: { flex: 1, gap: theme.spacing.xs },
  benefitTitle: { ...theme.textVariants.heading, color: theme.colors.foreground },
  benefitDescription: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  plansRow: { width: '100%', maxWidth: 480, flexDirection: 'column', alignItems: 'stretch', gap: theme.spacing.md },
  planCard: { width: '100%', minHeight: 108, padding: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.xl, backgroundColor: theme.colors.card },
  planCardSelected: { borderWidth: 2, borderColor: theme.colors.accent },
  yearlyPlanCard: { marginTop: theme.spacing.sm },
  planOptionCopy: { flex: 1, gap: theme.spacing.xs },
  planHint: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  planOptionPrice: { alignItems: 'flex-end', marginRight: theme.spacing.sm },
  planName: { ...theme.textVariants.heading, color: theme.colors.foreground },
  planTextSelected: { color: theme.colors.accent },
  selectionIndicator: { width: 28, height: 28, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.mutedForeground, borderRadius: theme.radii.full },
  selectionIndicatorSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent },
  selectionCheck: { color: theme.colors.accentForeground },
  planPrice: { fontFamily: theme.fontFamily.bold, fontSize: theme.fontSize.xxl, lineHeight: theme.lineHeight.xxl, color: theme.colors.foreground },
  planPeriod: { ...theme.textVariants.body, color: theme.colors.mutedForeground },
  bestValueBadge: { position: 'absolute', zIndex: 1, top: -theme.spacing.md, alignSelf: 'center', paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.radii.full, backgroundColor: theme.colors.accentLight },
  bestValueText: { ...theme.textVariants.labelSmall, color: theme.colors.accent },
  freeMonthsBadge: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  freeMonthsText: { ...theme.textVariants.labelSmall, color: theme.colors.primary },
  purchaseBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: theme.spacing.md, paddingHorizontal: theme.spacing.xl, borderTopWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.background },
  purchaseBarContent: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: theme.spacing.sm },
  ctaButton: { width: '100%' },
  renewalDisclosure: { textAlign: 'center', ...theme.textVariants.caption, color: theme.colors.mutedForeground },
  loadingBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing['2xl'], backgroundColor: theme.colors.overlay },
  loadingCard: { width: '100%', maxWidth: 320, alignItems: 'center', gap: theme.spacing.md, padding: theme.spacing['2xl'], borderRadius: theme.radii.xl, backgroundColor: theme.colors.card },
  loadingSpinner: { color: theme.colors.accent },
  loadingTitle: { textAlign: 'center', ...theme.textVariants.heading, color: theme.colors.foreground },
  loadingBody: { textAlign: 'center', ...theme.textVariants.body, color: theme.colors.mutedForeground },
}))
