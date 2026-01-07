import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

interface RecipeRowProps {
  title: string
  tags?: string[]
  onPress?: () => void
}

export default function RecipeRow({
  title,
  tags = [],
  onPress,
}: RecipeRowProps) {
  const meta =
    tags.length === 0 ? 'No tags' : tags.join(' • ')

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${meta}`}
    >
      <View style={styles.iconWrapper}>
        <Text style={styles.emoji}>📝</Text>
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <Feather
        name="chevron-right"
        size={18}
        color={theme.colors.mutedForeground}
      />
    </Pressable>
  )
}

const styles = createThemedStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  rowPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },

  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  emoji: {
    fontSize: 20,
  },

  textBlock: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },

  title: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
    marginBottom: 2,
  },

  meta: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
}))
