import { Feather } from '@expo/vector-icons'
import React, { useMemo } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type NoteItem = {
  id: string
  title: string
  preview: string
  relativeDate: string
}

const MOCK_NOTES: NoteItem[] = [
  {
    id: '1',
    title: 'Meal prep ideas',
    preview: 'Weekly batch cooking schedule...',
    relativeDate: 'Today',
  },
  {
    id: '2',
    title: 'Restaurant recommendat...',
    preview: 'That Italian place downtown...',
    relativeDate: 'Yesterday',
  },
  {
    id: '3',
    title: 'Substitution ideas',
    preview: 'Dairy-free swaps for baking...',
    relativeDate: '3 days ago',
  },
]

export default function NotesSegment({ bottomPadding }: { bottomPadding: number }) {
  const data = useMemo(() => MOCK_NOTES, [])

  return (
    <View style={styles.wrap}>
      <Text style={styles.helper}>Your kitchen notes and ideas</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {}}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={`Open note ${item.title}`}
          >
            <View style={styles.iconWrap}>
              <Feather name="file-text" size={18} color={theme.colors.mutedForeground} />
            </View>

            <View style={styles.rowText}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowDate}>{item.relativeDate}</Text>
              </View>

              <Text style={styles.rowPreview} numberOfLines={1}>
                {item.preview}
              </Text>
            </View>
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable
            onPress={() => {}}
            style={styles.newNote}
            accessibilityRole="button"
            accessibilityLabel="Create new note"
          >
            <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
            <Text style={styles.newNoteText}>New Note</Text>
          </Pressable>
        }
      />
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  wrap: { flex: 1 },

  helper: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    maxWidth: 320,
  },

  listContent: {
    paddingTop: 0,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  rowText: { flex: 1 },

  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },

  rowTitle: {
    flex: 1,
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },

  rowDate: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  rowPreview: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  newNote: {
    marginTop: theme.spacing.lg,
    height: 64,
    borderRadius: theme.radii.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },

  newNoteText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}))
