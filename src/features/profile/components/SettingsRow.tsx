import { Feather, Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Switch, Text, TouchableOpacity, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'

type RowBase = {
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentProps<typeof Feather>['name'] | React.ComponentProps<typeof Ionicons>['name']
  iconFamily?: 'feather' | 'ionicons'
  tone?: 'default' | 'accent' | 'danger'
  disabled?: boolean
}

type ToggleRow = RowBase & {
  type: 'toggle'
  value: boolean
  onValueChange: (next: boolean) => void
}

type LinkRow = RowBase & {
  type: 'link'
  rightText?: string
  onPress?: () => void
  showChevron?: boolean
}

export type SettingsRowItem = ToggleRow | LinkRow

export default function SettingsRow({
  item,
  isLast,
}: {
  item: SettingsRowItem
  isLast: boolean
}) {
  const tone = item.tone ?? 'default'
  const isDisabled = item.disabled ?? false
  const isInformationalLink = item.type === 'link' && !item.onPress
  const rowStyle = [
    styles.row,
    !isLast && styles.rowDivider,
    isDisabled && styles.rowDisabled,
    isInformationalLink && styles.rowInformational,
  ]

  const showChevron = item.type === 'link' ? (item.showChevron ?? true) : false
  const isPressableLink = item.type === 'link' && !isDisabled && Boolean(item.onPress)

  const content = (
    <>
      <View
        style={[
          styles.iconWrap,
          tone === 'accent' && styles.iconWrapAccent,
          tone === 'danger' && styles.iconWrapDanger,
        ]}
      >
        {item.iconFamily === 'ionicons' ? (
          <Ionicons
            name={item.icon as React.ComponentProps<typeof Ionicons>['name']}
            size={20}
            style={[
              styles.iconUpgrade,
              tone === 'accent' && styles.iconAccent,
              tone === 'danger' && styles.iconDanger,
            ]}
          />
        ) : (
          <Feather
            name={item.icon as React.ComponentProps<typeof Feather>['name']}
            size={18}
            style={[
              styles.icon,
              tone === 'accent' && styles.iconAccent,
              tone === 'danger' && styles.iconDanger,
            ]}
          />
        )}
      </View>

      <View style={styles.textWrap}>
        <Text
          style={[
            styles.title,
            tone === 'accent' && styles.titleAccent,
            tone === 'danger' && styles.titleDanger,
          ]}
        >
          {item.title}
        </Text>

        {!!item.subtitle && <Text style={styles.subtitle}>{item.subtitle}</Text>}
      </View>

      {item.type === 'toggle' ? (
        <Switch value={item.value} onValueChange={item.onValueChange} disabled={isDisabled} />
      ) : (
        <View style={styles.right}>
          {!!item.rightText && <Text style={styles.rightText}>{item.rightText}</Text>}
          {!isDisabled && showChevron && <Feather name="chevron-right" size={18} style={styles.chevron} />}
        </View>
      )}
    </>
  )

  if (item.type === 'link') {
    return (
      <TouchableOpacity
        activeOpacity={isPressableLink ? 0.85 : 1}
        onPress={isPressableLink ? item.onPress : undefined}
        style={rowStyle}
      >
        {content}
      </TouchableOpacity>
    )
  }

  // Toggle rows should not pretend to be links.
  return <View style={rowStyle}>{content}</View>
}

const styles = createThemedStyles((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowInformational: {
    backgroundColor: theme.colors.muted,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  iconWrapAccent: {
    backgroundColor: theme.colors.creamDark,
  },
  iconWrapDanger: {
    backgroundColor: theme.colors.secondary,
  },

  iconUpgrade: {
    color: theme.colors.mutedForeground,
    paddingLeft: theme.spacing.xs,
  },
  icon: { color: theme.colors.mutedForeground },
  iconAccent: { color: theme.colors.accent },
  iconDanger: { color: '#d13b3b' },

  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  titleAccent: {
    color: theme.colors.accent,
  },
  titleDanger: {
    color: '#d13b3b',
  },
  subtitle: {
    marginTop: 2,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rightText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  chevron: {
    color: theme.colors.mutedForeground,
  },
}))
