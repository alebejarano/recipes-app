import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import { createThemedStyles } from '@/styles/createStyles'

type PremiumScreenProps = {
  onUpgrade: () => void
  onMaybeLater?: () => void
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

export default function PremiumScreen({ onUpgrade, onMaybeLater }: PremiumScreenProps) {
  return (
    <Screen scroll contentStyle={styles.content}>
      {!!onMaybeLater && (
        <TouchableOpacity style={styles.backRow} onPress={onMaybeLater} activeOpacity={0.75}>
          <Feather name="chevron-left" size={18} style={styles.backIcon} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}

      <View style={styles.heroIconWrap}>
        <View style={styles.heroIconCircle}>
          <Feather name="shield" size={28} style={styles.heroIcon} />
        </View>
        <View style={styles.heroCheckBubble}>
          <Feather name="check" size={13} style={styles.heroCheckIcon} />
        </View>
      </View>

      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.subtitle}>
        Your recipes deserve a safe home. Sync everywhere, lose nothing.
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

      <View style={styles.priceRow}>
        <View style={styles.pricePill}>
          <Text style={styles.priceValue}>5 €</Text>
          <Text style={styles.pricePeriod}>/ month</Text>
        </View>
        <Text style={styles.cancelText}>· Cancel anytime</Text>
      </View>

      <Button onPress={onUpgrade} style={styles.ctaButton} textStyle={styles.ctaText}>
        Start Premium
      </Button>

      {!!onMaybeLater && (
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
  heroIconWrap: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  heroIconCircle: {
    width: 82,
    height: 82,
    borderRadius: theme.radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
  },
  heroIcon: {
    color: theme.colors.sage,
  },
  heroCheckBubble: {
    position: 'absolute',
    right: -6,
    top: -5,
    width: 34,
    height: 34,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  heroCheckIcon: {
    color: theme.colors.primaryForeground,
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
    color: theme.colors.sage,
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
    color: theme.colors.sage,
  },
  priceRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginRight: theme.spacing.md,
  },
  priceValue: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    color: theme.colors.foreground,
  },
  pricePeriod: {
    marginLeft: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  cancelText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
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
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.border,
  },
}))
