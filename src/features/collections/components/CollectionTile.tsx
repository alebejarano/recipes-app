import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { pickEmoji } from '../utils/collections';

type CollectionTileProps = {
  label: string;
  count: number;
  emoji?: string;
  onPress: () => void;
};

export default function CollectionTile({
  label,
  count,
  emoji,
  onPress,
}: CollectionTileProps) {
  const icon = emoji ?? pickEmoji(label);

  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <View style={styles.iconBubble}>
        <Text style={styles.emoji}>{icon}</Text>
      </View>

      <View style={styles.textArea}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.meta}>{count} recipes</Text>
      </View>
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
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    justifyContent: 'flex-start',
    ...theme.shadows.soft,
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
    fontSize: 22,
  },

  textArea: {
    marginTop: theme.spacing.xl,
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
}));
