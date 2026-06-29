import { createThemedStyles } from '@/styles/createStyles';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Option<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (next: T) => void;
};

export default function SearchFilterPills<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.id === value;

        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.9}
            style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
          >
            <Text
              style={[styles.text, active ? styles.textActive : styles.textIdle]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  row: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: theme.spacing.md,
    columnGap: theme.spacing.md,
  },
  pill: {
    flexBasis: '48%',
    maxWidth: '48%',
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  pillIdle: {
    backgroundColor: theme.colors.creamDark,
  },
  text: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
  },
  textActive: {
    color: theme.colors.primaryForeground,
  },
  textIdle: {
    color: theme.colors.foreground,
  },
}));
