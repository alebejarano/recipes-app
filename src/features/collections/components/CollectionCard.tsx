import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

interface CollectionCardProps {
  label: string
  count: number
  kind: 'tag' | 'uncategorized'
  onPress: () => void
}

export default function CollectionCard({
  label,
  count,
  kind,
  onPress,
}: CollectionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count} recipes`}
    >
      <View style={styles.iconWrapper}>
        <Feather
          name={kind === 'uncategorized' ? 'inbox' : 'folder'}
          size={20}
          color={theme.colors.primary}
        />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {label}
      </Text>

      <Text style={styles.meta}>
        {count} recipe{count === 1 ? '' : 's'}
      </Text>
    </Pressable>
  )
}

const styles = createThemedStyles(theme => ({
  card: {
    flex: 1,
    minHeight: 150,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  cardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
  },

  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySoft,
    marginBottom: theme.spacing.sm,
  },

  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },

  meta: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
}))
