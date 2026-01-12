import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';
import type { SegmentKey } from '../types';

type SegmentedTabsProps = {
  value: SegmentKey;
  onChange: (next: SegmentKey) => void;
};

type TabDef = {
  key: SegmentKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

const TABS: TabDef[] = [
  { key: 'recipes', label: 'Recipes', icon: 'folder' },
  { key: 'notes', label: 'Notes', icon: 'file-text' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping-cart' },
];

export default function SegmentedTabs({ value, onChange }: SegmentedTabsProps) {
  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const active = value === tab.key;

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
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    width: '100%',
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.creamDark,
    padding: theme.spacing.xs,
    flexDirection: 'row',
    gap: theme.spacing.xs,
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
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },

  tabTextActive: {
    color: theme.colors.foreground,
  },
}));
