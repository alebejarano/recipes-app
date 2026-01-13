import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type RowBase = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  tone?: 'default' | 'accent' | 'danger';
};

type ToggleRow = RowBase & {
  type: 'toggle';
  value: boolean;
  onValueChange: (next: boolean) => void;
};

type LinkRow = RowBase & {
  type: 'link';
  rightText?: string;
  onPress?: () => void;
};

export type SettingsRowItem = ToggleRow | LinkRow;

export default function SettingsRow({ item, isLast }: { item: SettingsRowItem; isLast: boolean }) {
  const tone = item.tone ?? 'default';

  return (
    <TouchableOpacity
      activeOpacity={item.type === 'link' ? 0.85 : 1}
      onPress={item.type === 'link' ? item.onPress : undefined}
      style={[styles.row, !isLast && styles.rowDivider]}
    >
      <View style={[styles.iconWrap, tone === 'accent' && styles.iconWrapAccent, tone === 'danger' && styles.iconWrapDanger]}>
        <Feather
          name={item.icon}
          size={18}
          style={[
            styles.icon,
            tone === 'accent' && styles.iconAccent,
            tone === 'danger' && styles.iconDanger,
          ]}
        />
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

        {!!item.subtitle && (
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        )}
      </View>

      {item.type === 'toggle' ? (
        <Switch
          value={item.value}
          onValueChange={item.onValueChange}
        />
      ) : (
        <View style={styles.right}>
          {!!item.rightText && <Text style={styles.rightText}>{item.rightText}</Text>}
          <Feather name="chevron-right" size={18} style={styles.chevron} />
        </View>
      )}
    </TouchableOpacity>
  );
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

  icon: { color: theme.colors.mutedForeground },
  iconAccent: { color: theme.colors.terracotta },
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
    color: theme.colors.terracotta,
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
}));
