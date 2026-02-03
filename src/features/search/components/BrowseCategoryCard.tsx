import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  tone: 'neutral' | 'sage';
  onPress?: () => void;
};

export default function BrowseCategoryCard({ label, icon, tone, onPress }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, tone === 'sage' ? styles.sageCard : styles.neutralCard]}
    >
      <View style={styles.iconBubble}>
        <Feather
          name={icon}
          size={22}
          style={[styles.icon, tone === 'sage' ? styles.iconSage : styles.iconNeutral]}
        />
      </View>

      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = createThemedStyles((theme) => ({
  card: {
    flex: 1,
    minHeight: 92,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },

  neutralCard: {
    backgroundColor: theme.colors.background,
  },
  sageCard: {
    backgroundColor: theme.colors.sageLight,
  },

  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {},
  iconNeutral: {
    color: theme.colors.mutedForeground,
  },
  iconSage: {
    color: theme.colors.sageDark,
  },

  label: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
}));
