import { Feather } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { formatRelativeDay } from '@/features/home/utils/homeFormatters';
import { useStrategyNotesList } from '@/features/notes/hooks/useStrategyNotes';
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode';
import { getSafeReturnTo } from '@/lib/navigation';
import { getUserFacingErrorMessage } from '@/lib/userFacingError';
import { useTranslation } from '@/localization';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

type NoteItem = {
  id: string
  title: string
  preview: string
  relativeDate: string
  pinnedAt: string | null
}

const PREVIEW_LIMIT = 80

export default function NotesSegment({
  bottomPadding,
  mode = 'auth',
}: {
  bottomPadding: number
  mode?: 'auth' | 'public'
}) {
  const { t } = useTranslation()
  const isPublic = mode === 'public'
  const { shouldUseLocalData } = useStorageDataMode(mode)
  const notesQuery = useStrategyNotesList({ limit: 50 }, mode)
  const returnTo = getSafeReturnTo(
    mode === 'public'
        ? '/(public)/(tabs)/collections?segment=notes'
        : '/(auth)/(tabs)/collections?segment=notes'
  )
  const returnToParam = typeof returnTo === 'string' ? returnTo : undefined

  const data = useMemo<NoteItem[]>(() => {
    const notes = notesQuery.data ?? []
    return notes.map((note) => ({
      id: note.id,
      title: note.title?.trim() || t('notes.fallbackTitle'),
      preview: (note.content ?? '').trim().slice(0, PREVIEW_LIMIT) || t('notes.emptyContent'),
      relativeDate: formatRelativeDay(note.updatedAt),
      pinnedAt: note.pinnedAt ?? null,
    }))
  }, [notesQuery.data, t])

  return (
    <View style={styles.wrap}>
      <Text style={styles.helper}>{t('notes.segment.helper')}</Text>

      {notesQuery.isLoading && !shouldUseLocalData ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>{t('notes.segment.loading')}</Text>
        </View>
      ) : notesQuery.isError ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="alert-circle" size={22} color={theme.colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>{t('notes.segment.loadFailed')}</Text>
          <Text style={styles.emptyBody}>
            {getUserFacingErrorMessage(notesQuery.error)}
          </Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="file-text" size={22} color={theme.colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>{t('notes.segment.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('notes.segment.emptyBody')}</Text>
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
            accessibilityLabel={t('notes.segment.createFirstA11y')}
          >
            <Feather name="plus" size={18} color={theme.colors.primaryForeground} />
            <Text style={styles.emptyCtaText}>{t('notes.segment.createFirst')}</Text>
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
            style={[styles.row, item.pinnedAt ? styles.rowPinned : null]}
            accessibilityRole="button"
            accessibilityLabel={t('notes.segment.openA11y', { title: item.title })}
          >
            <View style={[styles.iconWrap, item.pinnedAt ? styles.iconWrapPinned : null]}>
              <Feather
                name="file-text"
                size={18}
                color={item.pinnedAt ? theme.colors.accent : theme.colors.mutedForeground}
              />
            </View>

            <View style={styles.rowText}>
              <View style={styles.rowTop}>
                <View style={styles.rowTitleWrap}>
                  {item.pinnedAt ? (
                    <MaterialCommunityIcons name="pin" size={22} style={styles.pinIcon} />
                  ) : null}
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
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
            accessibilityLabel={t('notes.segment.createA11y')}
          >
            <Feather name="plus" size={18} color={theme.colors.mutedForeground} />
            <Text style={styles.newNoteText}>{t('notes.segment.create')}</Text>
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
    ...theme.textVariants.body,
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
    ...theme.textVariants.label,
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
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  emptyBody: {
    ...theme.textVariants.body,
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
    ...theme.textVariants.label,
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
  rowPinned: {
    borderColor: theme.colors.terracottaLight,
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
  iconWrapPinned: {
    backgroundColor: theme.colors.terracottaLight,
  },

  rowText: { flex: 1 },

  rowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  pinIcon: {
    color: theme.colors.accent,
  },

  rowTitle: {
    flex: 1,
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },

  rowDate: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },

  rowPreview: {
    marginTop: theme.spacing.xs,
    ...theme.textVariants.body,
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
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
  },
}))
