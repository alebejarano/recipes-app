import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import { createThemedStyles } from '@/styles/createStyles'

type PremiumScreenProps = {
  onUpgrade?: (billingCycle: 'month' | 'year') => void
  onMaybeLater?: () => void
  isActive?: boolean
  onManageSubscription?: () => void
}

const premiumItems = [
  {
    id: 'backup',
    icon: 'cloud' as const,
    title: 'Cloud backup & sync',
    subtitle: 'Recipes, notes, and imports',
  },
  {
    id: 'devices',
    icon: 'monitor' as const,
    title: 'Access on all your devices',
  },
  {
    id: 'recipes',
    icon: 'book-open' as const,
    title: 'Unlimited recipes',
  },
  {
    id: 'imports',
    icon: 'file-plus' as const,
    title: 'Unlimited imports',
  },
]

export default function PremiumScreen({
  onUpgrade,
  onMaybeLater,
  isActive = false,
  onManageSubscription,
}: PremiumScreenProps) {
  const [billingCycle, setBillingCycle] = React.useState<'month' | 'year'>('month')
  const priceValue = billingCycle === 'month' ? '5 €' : '36 €'
  const pricePeriod = billingCycle === 'month' ? '/ month' : '/ year'
  const sideLabel = billingCycle === 'month' ? ' Cancel anytime' : '40% saved'

  return (
    <Screen scroll contentStyle={styles.content}>
      {!!onMaybeLater && (
        <TouchableOpacity style={styles.backRow} onPress={onMaybeLater} activeOpacity={0.75}>
          <Feather name="chevron-left" size={18} style={styles.backIcon} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}

      <View>
          <Image
            source={
              isActive
                ? require('@assets/illustrations/premium-pantry.png')
                : require('@assets/illustrations/premium-counter.png')
            }
            style={styles.heroImage}
            resizeMode="contain"
          />
      </View>

      <Text style={styles.title}>{isActive ? "You're on Premium!!" : 'Go Premium'}</Text>
      <Text style={styles.subtitle}>
        {isActive
          ? 'Your subscription is active and all premium features are enabled.'
          : 'Your recipes deserve a safe home. Sync everywhere, lose nothing.'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>EVERYTHING INCLUDED</Text>
        <View style={styles.featuresList}>
          {premiumItems.map((item) => (
            <View key={item.id} style={styles.featureRow}>
              <View style={styles.featureLeft}>
                <Feather name={item.icon} size={20} style={styles.featureIcon} />
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  {!!item.subtitle && <Text style={styles.featureSubtitle}>{item.subtitle}</Text>}
                </View>
              </View>
              <Feather name="check" size={20} style={styles.featureCheck} />
            </View>
          ))}
        </View>
      </View>

      {isActive ? (
        <Button
          onPress={onManageSubscription ?? (() => {})}
          style={styles.ctaButton}
          textStyle={styles.ctaText}
        >
          Manage Subscription
        </Button>
      ) : (
        <>
          <View style={styles.priceRow}>
            <View style={styles.billingToggle}>
              <TouchableOpacity
                style={[styles.billingOption, billingCycle === 'month' && styles.billingOptionActive]}
                onPress={() => setBillingCycle('month')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    billingCycle === 'month' && styles.billingOptionTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.billingOption, billingCycle === 'year' && styles.billingOptionActive]}
                onPress={() => setBillingCycle('year')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.billingOptionText,
                    billingCycle === 'year' && styles.billingOptionTextActive,
                  ]}
                >
                  Yearly
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.priceMetaRow}>
              <View style={styles.pricePill}>
                <Text style={styles.priceValue}>{priceValue}</Text>
                <Text style={styles.pricePeriod}>{pricePeriod}</Text>
              </View>
              <Text style={[styles.sideLabel, billingCycle === 'year' && styles.sideLabelYearly]}>
                {sideLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.priceNote}>
            It’s €5. Not €4.99. Yes, we rounded it — we cook honestly.
          </Text>
          <Button
            onPress={() => onUpgrade?.(billingCycle)}
            style={styles.ctaButton}
            textStyle={styles.ctaText}
            disabled={!onUpgrade}
          >
            Start Premium
          </Button>
        </>
      )}

      {!!onMaybeLater && !isActive && (
        <TouchableOpacity style={styles.notNowButton} onPress={onMaybeLater} activeOpacity={0.8}>
          <Text style={styles.notNowText}>Not now</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.footer}>
        Your data stays private. Premium simply keeps it safe in the cloud.
      </Text>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing['3xl'],
    alignItems: 'center',
  },
  backRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
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
    width: 250,
    height: 150,
  },
  title: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
    maxWidth: 360,
    marginBottom: theme.spacing['2xl'],
  },
  card: {
    width: '100%',
    maxWidth: 390,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing['2xl'],
  },
  cardLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    letterSpacing: 0.8,
    color: theme.colors.warmGray,
    marginBottom: theme.spacing.lg,
  },
  featuresList: {
    gap: theme.spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  featureIcon: {
    color: theme.colors.primary,
    marginRight: theme.spacing.lg,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  featureSubtitle: {
    marginTop: theme.spacing.xxs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  featureCheck: {
    color: theme.colors.primary,
  },
  priceRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  billingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.creamDark,
    borderRadius: theme.radii.xxl,
    padding: theme.spacing.xxs,
    marginBottom: theme.spacing.lg,
  },
  billingOption: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.xxl,
  },
  billingOptionActive: {
    backgroundColor: theme.colors.background,
  },
  billingOptionText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  billingOptionTextActive: {
    color: theme.colors.foreground,
  },
  priceMetaRow: {
    width: '100%',
    maxWidth: 390,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.creamDark,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  priceValue: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
    fontWeight: theme.fontWeight.semibold
  },
  pricePeriod: {
    marginLeft: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  sideLabel: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  sideLabelYearly: {
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
  },
  priceNote: {
    marginTop: -theme.spacing.lg,
    marginBottom: theme.spacing['2xl'],
    textAlign: 'center',
    maxWidth: 360,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  ctaButton: {
    width: '100%',
    maxWidth: 390,
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
  },
  ctaText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.primaryForeground,
  },
  notNowButton: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  notNowText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.mutedForeground,
  },
  footer: {
    marginTop: theme.spacing['2xl'],
    textAlign: 'center',
    maxWidth: 340,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
}))
