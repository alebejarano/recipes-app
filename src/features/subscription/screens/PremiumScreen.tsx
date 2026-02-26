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
  isUpgrading?: boolean
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
  isUpgrading = false,
  onManageSubscription,
}: PremiumScreenProps) {
  const [billingCycle, setBillingCycle] = React.useState<'month' | 'year'>('month')

  const priceValue = billingCycle === 'month' ? '€5' : '€36'
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

      <Text style={styles.title}>
        {isActive ? 'You\'re on Premium' : 'Keep your recipes safe everywhere'}
      </Text>

      <Text style={styles.subtitle}>
        {isActive
          ? 'Your kitchen is synced, backed up, and fully unlocked.'
          : 'Your kitchen stays backed up, synced, and ready — wherever you cook.'}
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
        </>
      ) : null}

      <Text style={styles.includedTitle}>Everything included</Text>

      <View style={styles.featuresList}>
        {premiumItems.map((item) => (
          <View key={item.id} style={styles.featureRow}>
            <View style={styles.featureLeft}>
              <Feather name={item.icon} size={18} style={styles.featureIcon} />
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                {!!item.subtitle && <Text style={styles.featureSubtitle}>{item.subtitle}</Text>}
              </View>
            </View>
          </View>
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
          onPress={() => onUpgrade?.(billingCycle)}
          variant="premium"
          size="xl"
          style={styles.ctaButton}
          disabled={!onUpgrade || isUpgrading}
        >
          {isUpgrading ? 'Upgrading...' : 'Unlock Premium'}
        </Button>
      )}

      {!!onMaybeLater && !isActive && (
        <TouchableOpacity style={styles.notNowButton} onPress={onMaybeLater} activeOpacity={0.8}>
          <Text style={styles.notNowText}>Not now</Text>
        </TouchableOpacity>
      )}
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing['3xl'],
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  backRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
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
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    color: theme.colors.foreground,
    maxWidth: 340,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.mutedForeground,
    maxWidth: 360,
  },
  billingToggle: {
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  priceValue: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 72,
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
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  featuresList: {
    width: '100%',
    maxWidth: 390,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  featureIcon: {
    color: theme.colors.primary,
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
  ctaButton: {
    width: '100%',
    maxWidth: 390,
  },
  notNowButton: {
    marginTop: -theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  notNowText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}))
