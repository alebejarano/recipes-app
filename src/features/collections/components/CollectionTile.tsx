import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import type { CollectionTileVariant } from '../types';
import { getVariantStyle, pickEmoji } from '../utils/collections';

type CollectionTileProps = {
  label: string;
  count: number;
  variant: CollectionTileVariant;
  emoji?: string;
  onPress: () => void;
};

export default function CollectionTile({
  label,
  count,
  variant,
  emoji,
  onPress,
}: CollectionTileProps) {
  const v = useMemo(() => getVariantStyle(variant), [variant]);
  const icon = emoji ?? pickEmoji(label);

  return (
    <Pressable onPress={onPress} style={[styles.tile, { backgroundColor: v.backgroundColor }]}>
      <View style={styles.iconBubble}>
        <Text style={styles.emoji}>{icon}</Text>
      </View>

      <View style={styles.textArea}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.meta}>{count} recipes</Text>
      </View>

      <View style={[styles.ghostShape, { backgroundColor: v.ghostColor }]} />
    </Pressable>
  );
}

const styles = createThemedStyles((theme) => ({
  tile: {
    flex: 1,
    minHeight: 160,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    padding: theme.spacing.lg,
    justifyContent: 'space-between',
  },

  iconBubble: {
    width: 58,
    height: 58,
    borderRadius: theme.radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  emoji: {
    fontSize: 20,
  },

  textArea: {
    marginTop: theme.spacing.lg,
  },

  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
  },

  meta: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },

  ghostShape: {
    position: 'absolute',
    right: -22,
    bottom: -22,
    width: 96,
    height: 96,
    borderRadius: theme.radii.lg,
    opacity: 0.18,
  },
}));
