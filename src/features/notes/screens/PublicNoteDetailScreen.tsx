import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { createThemedStyles } from '@/styles/createStyles'

import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import { useDeleteLocalNote, useLocalNote, useUpdateLocalNote } from '@/features/notes/hooks/useLocalNotes'
import { getSafeReturnTo } from '@/lib/navigation'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useTranslation } from '@/localization'

type NoteDetailScreenProps = {
  noteId: string
}

export default function PublicNoteDetailScreen({ noteId }: NoteDetailScreenProps) {
  const { locale, t } = useTranslation()
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const returnToParam = typeof safeReturnTo === 'string' ? safeReturnTo : undefined
  const showSnackbar = useTransientSnackbarStore((state) => state.show)
  const { data: note, isLoading, isError } = useLocalNote(noteId)
  const deleteMutation = useDeleteLocalNote()
  const updateMutation = useUpdateLocalNote(noteId)
  const [pinnedOverride, setPinnedOverride] = useState<boolean | null>(null)
  const isPinned = pinnedOverride ?? Boolean(note?.pinnedAt)

  const title = useMemo(() => note?.title?.trim() || t('notes.fallbackTitle'), [note?.title, t])
  const content = useMemo(() => note?.content?.trim() ?? '', [note?.content])

  const handleEdit = () => {
    router.push({
      pathname: '/(public)/notes/[id]/edit',
      params: { id: noteId, returnTo: returnToParam },
    })
  }

  const handleMore = () => {
    Alert.alert(t('notes.detail.actionsTitle'), undefined, [
      { text: t('notes.detail.edit'), onPress: handleEdit },
      {
        text: t('notes.detail.delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('notes.editor.deleteAlertTitle'), t('notes.editor.deleteAlertMessage'), [
            { text: t('notes.editor.cancel'), style: 'cancel' },
            {
              text: t('notes.detail.delete'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteMutation.mutateAsync(noteId)
                  showSnackbar(t('notes.editor.deleted'))
                  if (safeReturnTo) {
                    router.replace(safeReturnTo)
                  } else {
                    router.back()
                  }
                } catch (error: any) {
                  Alert.alert(t('notes.editor.deleteFailedTitle'), getUserFacingErrorMessage(error))
                }
              },
            },
          ])
        },
      },
      { text: t('notes.detail.cancel'), style: 'cancel' },
    ])
  }

  const handleTogglePin = async () => {
    if (!note) return
    const nextIsPinned = !isPinned
    setPinnedOverride(nextIsPinned)

    try {
      await updateMutation.mutateAsync({
        pinnedAt: nextIsPinned ? new Date().toISOString() : null,
      })
      setPinnedOverride(null)
      showSnackbar(isPinned ? t('notes.detail.unpinned') : t('notes.detail.pinned'))
    } catch (error: any) {
      setPinnedOverride(null)
      Alert.alert(t('notes.detail.pinFailedTitle'), getUserFacingErrorMessage(error))
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>{t('notes.detail.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !note) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>{t('notes.detail.loadFailed')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (safeReturnTo) {
                router.replace(safeReturnTo)
              } else {
                router.back()
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={t('notes.detail.goBackA11y')}
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={18} style={styles.icon} />
          </TouchableOpacity>

          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => { void handleTogglePin() }}
              accessibilityRole="button"
              accessibilityLabel={isPinned ? t('notes.detail.unpinA11y') : t('notes.detail.pinA11y')}
              style={styles.iconButton}
              disabled={updateMutation.isPending}
            >
              <MaterialCommunityIcons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={22}
                style={[styles.icon, isPinned ? styles.iconPinned : undefined]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMore}
              accessibilityRole="button"
              accessibilityLabel={t('notes.detail.moreA11y')}
              style={styles.iconButton}
              disabled={deleteMutation.isPending}
            >
              <Feather name="more-vertical" size={18} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {t('notes.detail.updatedAt', { date: new Date(note.updatedAt).toLocaleDateString(locale) })}
          </Text>
        </View>

        <View style={styles.card}>
          {content ? (
            <Text style={styles.bodyText}>{content}</Text>
          ) : (
            <Text style={styles.emptyText}>{t('notes.emptyContent')}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  topActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  icon: { color: theme.colors.mutedForeground },
  iconPinned: { color: theme.colors.accent },
  header: { marginBottom: theme.spacing.lg },
  title: {
    ...theme.textVariants.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
  },
  bodyText: {
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  emptyText: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
}))
