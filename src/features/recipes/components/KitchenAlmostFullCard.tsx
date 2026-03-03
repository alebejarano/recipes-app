import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Animated, Easing, Pressable, Text, TouchableOpacity, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'

type KitchenAlmostFullCardProps = {
  title: string
  line1: string
  line2: string
  onSeePremium: () => void
  onManageRecipes?: () => void
  onDismiss: () => void
}

export default function KitchenAlmostFullCard({
  title,
  line1,
  line2,
  onSeePremium,
  onManageRecipes,
  onDismiss,
}: KitchenAlmostFullCardProps) {
  const entry = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(entry, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [entry])

  const translateY = entry.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 0],
  })

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: entry,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss kitchen usage reminder"
          style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
        >
          <Feather name="x" size={14} style={styles.dismissIcon} />
        </Pressable>
      </View>

      <Text style={styles.body}>{line1}</Text>
      <Text style={styles.body}>{line2}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onSeePremium}
          accessibilityRole="button"
          activeOpacity={0.85}
          style={styles.primaryAction}
        >
          <Text style={styles.primaryActionText}>See Premium</Text>
        </TouchableOpacity>
        {onManageRecipes ? (
          <TouchableOpacity
            onPress={onManageRecipes}
            accessibilityRole="button"
            activeOpacity={0.75}
            style={styles.secondaryAction}
          >
            <Text style={styles.secondaryActionText}>Manage recipes</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  )
}

const styles = createThemedStyles((theme) => ({
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  actions: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  primaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.accent,
  },
  primaryActionText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.accentForeground,
  },
  secondaryAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  secondaryActionText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
  dismissButton: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonPressed: {
    backgroundColor: theme.colors.muted,
  },
  dismissIcon: {
    color: theme.colors.mutedForeground,
  },
}))
