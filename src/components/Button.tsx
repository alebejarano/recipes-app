// src/components/Button.tsx
import { createThemedStyles } from '@/styles/createStyles'
import React from 'react'
import {
  ActivityIndicator,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

type ButtonVariant =
  | 'primary'   // Main CTA on a screen or modal
  | 'secondary' // Important supporting action
  | 'soft'      // Quiet utility action inside the UI
  | 'accent'    // Warm, special, occasional emphasis
  | 'ghost'     // Lightweight text-like action
  | 'premium'   // Subscription and premium-only CTA
type ButtonSize = 'md' | 'lg' | 'xl'

interface ButtonProps {
  children?: React.ReactNode
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  icon?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  style,
  textStyle,
  disabled = false,
  loading = false,
  loadingLabel,
}: ButtonProps) {
  const hasText = children != null && children !== ''
  const isDisabled = disabled || loading

  const displayText = loading && hasText ? (loadingLabel ?? children) : children

  const spinnerColor = isDisabled
    ? styles[`textDisabled_${variant}`]?.color
    : styles[`text_${variant}`]?.color

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      activeOpacity={isDisabled ? 1 : 0.88}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[`radius_${size}`],
        styles[`size_${size}`],
        !isDisabled ? styles[variant] : styles[`disabled_${variant}`],
        style,
      ]}
    >
      {loading ? (
        <View style={styles.icon}>
          <ActivityIndicator size="small" color={spinnerColor ?? '#000'} />
        </View>
      ) : icon ? (
        <View style={styles.icon}>{icon}</View>
      ) : null}

      {hasText ? (
        <Text
          style={[
            styles[`textSize_${size}`],
            !isDisabled ? styles[`text_${variant}`] : styles[`textDisabled_${variant}`],
            textStyle,
          ]}
        >
          {displayText}
        </Text>
      ) : null}
    </TouchableOpacity>
  )
}

const styles = createThemedStyles((theme) => ({
  base: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },

  radius_md: {
    borderRadius: theme.radii.md,
  },
  radius_lg: {
    borderRadius: theme.radii.lg,
  },
  radius_xl: {
    borderRadius: theme.radii.xl,
  },

  size_md: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 52,
  },
  size_xl: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 58,
  },

  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  soft: {
    backgroundColor: theme.colors.creamDark,
  },
  accent: {
    backgroundColor: theme.colors.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  premium: {
    backgroundColor: theme.colors.accent,
    borderWidth: 1,
    borderColor: theme.colors.terracottaLight,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  disabled_primary: {
    backgroundColor: theme.colors.primary,
    opacity: 0.5,
  },
  disabled_secondary: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.65,
  },
  disabled_soft: {
    backgroundColor: theme.colors.muted,
    opacity: 0.8,
  },
  disabled_accent: {
    backgroundColor: theme.colors.accent,
    opacity: 0.7,
  },
  disabled_ghost: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  disabled_premium: {
    backgroundColor: theme.colors.accent,
    borderWidth: 1,
    borderColor: theme.colors.terracottaLight,
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },

  textSize_md: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
  },
  textSize_lg: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
  },
  textSize_xl: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
  },

  text_primary: {
    color: theme.colors.primaryForeground,
  },
  text_secondary: {
    color: theme.colors.foreground,
  },
  text_soft: {
    color: theme.colors.foreground,
  },
  text_accent: {
    color: theme.colors.accentForeground,
  },
  text_ghost: {
    color: theme.colors.primary,
  },
  text_premium: {
    color: theme.colors.accentForeground,
  },

  textDisabled_primary: {
    color: theme.colors.primaryForeground,
  },
  textDisabled_secondary: {
    color: theme.colors.mutedForeground,
  },
  textDisabled_soft: {
    color: theme.colors.mutedForeground,
  },
  textDisabled_accent: {
    color: theme.colors.accentForeground,
  },
  textDisabled_ghost: {
    color: theme.colors.mutedForeground,
  },
  textDisabled_premium: {
    color: theme.colors.accentForeground,
  },

  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}))
