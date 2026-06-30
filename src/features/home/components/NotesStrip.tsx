import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';
import { layout } from '@/styles/layout';
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
    gap: layout.listGap,
    marginBottom: layout.listGap,
  },
  headerTitle: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  pill: {
    paddingHorizontal: layout.cardPadding,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: layout.cardGap,
  },
  pillTitle: {
    flex: 1,
    ...theme.textVariants.label,
    color: theme.colors.foreground,
  },
  pillMeta: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
}));
