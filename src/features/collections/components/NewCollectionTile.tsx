import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTranslation } from '@/localization';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

type NewCollectionTileProps = {
  onPress: () => void;
};

export default function NewCollectionTile({ onPress }: NewCollectionTileProps) {
  const { t } = useTranslation();

  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <View style={styles.plus}>
        <Feather name="plus" size={22} color={theme.colors.mutedForeground} />
      </View>
      <Text style={styles.label}>{t('collections.createFolder')}</Text>
    </Pressable>
  );
}

const styles = createThemedStyles((theme) => ({
  tile: {
    flex: 1,
    minHeight: 160,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },

  plus: {
    width: 58,
    height: 58,
    borderRadius: theme.radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.creamDark,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },

  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
}));
