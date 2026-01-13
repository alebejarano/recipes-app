import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  selected?: boolean;
  onPress?: () => void;
};

export default function DietaryChip({ label, icon, selected = false, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipDefault]}
    >
      <Feather
        name={icon}
        size={18}
        style={[styles.icon, selected ? styles.iconSelected : styles.iconDefault]}
      />

      <Text style={[styles.text, selected ? styles.textSelected : styles.textDefault]}>
        {label}
      </Text>

      {selected && <Feather name="check" size={18} style={styles.check} />}
    </TouchableOpacity>
  );
}

const styles = createThemedStyles((theme) => ({
  chip: {
    minHeight: 48,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.sage,
    borderColor: theme.colors.sage,
  },
  chipDefault: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
  },
  icon: {},
  iconSelected: { color: theme.colors.primaryForeground },
  iconDefault: { color: theme.colors.foreground },

  text: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
  },
  textSelected: {
    color: theme.colors.primaryForeground,
  },
  textDefault: {
    color: theme.colors.foreground,
  },
  check: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.primaryForeground,
  },
}));
