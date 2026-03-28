import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'
import { theme } from '@/styles/theme'

type Props = {
  title: string
  subtitle: string
  icon: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  tone?: 'primary' | 'peach' | 'neutral'
}

export default function CreateActionCard({
  title,
  subtitle,
  icon,
  onPress,
  disabled = false,
  tone = 'neutral',
}: Props) {
  const containerTone: ViewStyle =
    tone === 'primary'
      ? styles.tonePrimary
      : tone === 'peach'
        ? styles.tonePeach
        : styles.toneNeutral

  const iconTone: ViewStyle =
    tone === 'primary'
      ? styles.iconTilePrimary
      : tone === 'peach'
        ? styles.iconTilePeach
        : styles.iconTileNeutral

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.card,
        containerTone,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconTile, iconTone]}>{icon}</View>

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {!disabled && (
        <Feather
          name="chevron-right"
          size={18}
          color={theme.colors.mutedForeground}
        />
      )}
    </Pressable>
  )
}

const styles = createThemedStyles((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },

  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },

  cardDisabled: {
    opacity: 0.75,
  },

  // Soft “tinted” row backgrounds (like your screenshots)
  tonePrimary: {
    backgroundColor: theme.colors.primarySoft,
  },
  tonePeach: {
    backgroundColor: theme.colors.accentLight,
  },
  toneNeutral: {
    backgroundColor: theme.colors.creamDark,
  },

  iconTile: {
    width: 54,
    height: 54,
    borderRadius: theme.radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  iconTilePrimary: {
    backgroundColor: 'hsla(142, 15%, 75%, 0.7)',
  },
  iconTilePeach: {
    backgroundColor: theme.colors.terracottaLight,
  },
  iconTileNeutral: {
    backgroundColor: theme.colors.secondary,
  },

  textBlock: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },

  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
    marginBottom: 2,
  },

  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
}))
