import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
};

export default function TrendingChip({ label, icon, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={styles.chip}
    >
      <View style={styles.iconWrap}>
        <Feather name={icon} size={16} style={styles.icon} />
      </View>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = createThemedStyles((theme) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    height: 44,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.sageLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: theme.colors.sageDark,
  },
  text: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
}));
