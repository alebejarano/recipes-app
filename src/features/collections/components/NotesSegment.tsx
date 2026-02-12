import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'

import { formatRelativeDay } from '@/features/home/utils/homeFormatters'
import { useStrategyNotesList } from '@/features/notes/hooks/useStrategyNotes'
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode'
import { getSafeReturnTo } from '@/lib/navigation'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type NoteItem = {
  id: string
  title: string
  preview: string
  relativeDate: string
}

const FALLBACK_TITLE = 'Untitled note'
const PREVIEW_LIMIT = 80

export default function NotesSegment({
  bottomPadding,
  mode = 'auth',
}: {
  bottomPadding: number
  mode?: 'auth' | 'public' | 'dev'
}) {
  const isPublic = mode === 'public'
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const notesQuery = useStrategyNotesList({ limit: 50 }, mode)
  const returnTo = getSafeReturnTo(
    mode === 'dev'
      ? '/(dev)/(tabs)/collections?segment=notes'
      : mode === 'public'
        ? '/(public)/(tabs)/collections?segment=notes'
        : '/(auth)/(tabs)/collections?segment=notes'
  )
  const returnToParam = typeof returnTo === 'string' ? returnTo : undefined

  const data = useMemo<NoteItem[]>(() => {
    const notes = notesQuery.data ?? []
    return notes.map((note) => ({
      id: note.id,
      title: note.title?.trim() || FALLBACK_TITLE,
      preview: (note.content ?? '').trim().slice(0, PREVIEW_LIMIT) || 'No note content yet.',
      relativeDate: formatRelativeDay(note.updatedAt),
    }))
  }, [notesQuery.data])

  return (
    <View style={styles.wrap}>
      <Text style={styles.helper}>Your kitchen notes and ideas</Text>

      {notesQuery.isLoading && !shouldUseLocalData ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading notes…</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="file-text" size={22} color={theme.colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>No notes yet</Text>
          <Text style={styles.emptyBody}>
            Save substitutions, meal prep ideas, or reminders.
          </Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: isPublic ? '/(public)/notes/create' : '/(auth)/notes/create',
                params: {
                  returnTo: returnToParam,
                },
              })
            }
            style={styles.emptyCta}
            accessibilityRole="button"
            accessibilityLabel="Create your first note"
          >
            <Feather name="plus" size={18} color={theme.colors.primaryForeground} />
            <Text style={styles.emptyCtaText}>Create your first note</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: isPublic ? '/(public)/notes/[id]' : '/(auth)/notes/[id]',
                params: {
                  id: item.id,
                  returnTo: returnToParam,
                },
              })
            }
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
            onPress={() =>
              router.push({
                pathname: isPublic ? '/(public)/notes/create' : '/(auth)/notes/create',
                params: {
                  returnTo: returnToParam,
                },
              })
            }
            style={styles.newNote}
            accessibilityRole="button"
            accessibilityLabel="Create new note"
          >
            <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
            <Text style={styles.newNoteText}>New Note</Text>
          </Pressable>
        }
      />
      )}
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
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  emptyState: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  emptyBody: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCta: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary,
  },
  emptyCtaText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.primaryForeground,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
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
    borderRadius: theme.radii.lg,
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
