import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'
import type { RecipeSegmentKey } from '../types'

type RecipeSegmentedTabsProps = {
  value: RecipeSegmentKey
  onChange: (next: RecipeSegmentKey) => void
}

type TabDef = {
  key: RecipeSegmentKey
  labelKey: string
  icon: keyof typeof Feather.glyphMap
}

const TABS: TabDef[] = [
  { key: 'folders', labelKey: 'collections.tabs.folders', icon: 'folder' },
  { key: 'documents', labelKey: 'collections.tabs.imports', icon: 'file-text' },
]

export default function RecipeSegmentedTabs({ value, onChange }: RecipeSegmentedTabsProps) {
  const { t } = useTranslation()

  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const active = value === tab.key

        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Feather
              name={tab.icon}
              size={16}
              color={active ? theme.colors.foreground : theme.colors.mutedForeground}
            />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{t(tab.labelKey)}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    width: '100%',
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.creamDark,
    padding: theme.spacing.xs,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },

  tab: {
    flex: 1,
    height: 44,
    borderRadius: theme.radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'transparent',
  },

  tabActive: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tabText: {
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
  },

  tabTextActive: {
    color: theme.colors.foreground,
  },
}))
