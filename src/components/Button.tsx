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

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'accent' | 'ghost' | 'premium'
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

  /** When true, disables the button and shows a spinner */
  loading?: boolean
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
}: ButtonProps) {
  const hasText = children != null && children !== ''
  const isDisabled = disabled || loading

  // Only primary buttons change label when loading
  const displayText =
    loading && variant === 'primary' && hasText ? 'Saving…' : children

  // Match spinner color to text color
  const spinnerColor = isDisabled
    ? styles[`textDisabled_${variant}`]?.color
    : styles[`text_${variant}`]?.color

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      activeOpacity={isDisabled ? 1 : 0.85}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[`size_${size}`],
        !isDisabled && styles[variant],
        isDisabled && styles[`disabled_${variant}`],
        style,
      ]}
    >
      {/* Spinner or icon */}
      {loading ? (
        <View style={[styles.icon, hasText ? styles.iconWithText : undefined]}>
          <ActivityIndicator size="small" color={spinnerColor ?? '#000'} />
        </View>
      ) : icon ? (
        <View style={[styles.icon, hasText ? styles.iconWithText : undefined]}>
          {icon}
        </View>
      ) : null}

      {/* Text */}
      {hasText ? (
        <Text
          style={[
            styles.textBase,
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
    borderRadius: theme.radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },

  size_md: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  size_lg: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  size_xl: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },

  primary: {
    backgroundColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  secondary: {
    backgroundColor: 'transparent',
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
    backgroundColor: theme.colors.terracotta,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  disabled_primary: {
    backgroundColor: theme.colors.primary,
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabled_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.7,
  },
  disabled_soft: {
    backgroundColor: theme.colors.muted,
  },
  disabled_accent: {
    backgroundColor: theme.colors.accent,
    opacity: 0.85,
  },
  disabled_ghost: {
    backgroundColor: 'transparent',
  },
  disabled_premium: {
    backgroundColor: theme.colors.terracotta,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.85,
  },

  textBase: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
  },
  text_primary: { color: theme.colors.primaryForeground },
  text_secondary: { color: theme.colors.foreground },
  text_soft: { color: theme.colors.foreground },
  text_accent: { color: theme.colors.accentForeground },
  text_ghost: { color: theme.colors.mutedForeground },
  text_premium: { color: theme.colors.accentForeground },

  textDisabled_primary: { color: theme.colors.primaryForeground },
  textDisabled_secondary: { color: theme.colors.mutedForeground },
  textDisabled_soft: { color: theme.colors.mutedForeground },
  textDisabled_accent: { color: theme.colors.accentForeground },
  textDisabled_ghost: { color: theme.colors.mutedForeground },
  textDisabled_premium: { color: theme.colors.accentForeground },

  icon: {},
  iconWithText: {
    marginRight: theme.spacing.sm,
  },
}))
