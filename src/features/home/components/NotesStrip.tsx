import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

type NotePreview = {
  title: string;
  updatedAt?: string;
};

type Props = {
  title: string;
  note: NotePreview;
  meta: string;
  onPress?: () => void;
};

export default function NotesStrip({ title, note, meta, onPress }: Props) {
  return (
    <View>
      <View style={styles.header}>
        <Feather name="file-text" size={18} color={theme.colors.mutedForeground} />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <Pressable
        onPress={onPress}
        style={styles.pill}
        accessibilityRole="button"
        accessibilityLabel={`Open note ${note.title}`}
      >
        <Text style={styles.pillTitle} numberOfLines={1}>
          {note.title}
        </Text>
        <Text style={styles.pillMeta} numberOfLines={1}>
          {meta}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
  pill: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.muted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  pillTitle: {
    flex: 1,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.foreground,
  },
  pillMeta: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.mutedForeground,
  },
}));
