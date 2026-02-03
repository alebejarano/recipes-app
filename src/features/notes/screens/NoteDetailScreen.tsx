// src/features/notes/screens/NoteDetailScreen.tsx
import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
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

import { useDeleteNote } from '@/features/notes/hooks/useDeleteNote'
import { useNote } from '@/features/notes/hooks/useNote'
import { getSafeReturnTo } from '@/lib/navigation'

const FALLBACK_TITLE = 'Untitled note'

type NoteDetailScreenProps = {
  noteId: string
}

export default function NoteDetailScreen({ noteId }: NoteDetailScreenProps) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const returnToParam = typeof safeReturnTo === 'string' ? safeReturnTo : undefined
  const { data: note, isLoading, isError } = useNote(noteId)
  const deleteMutation = useDeleteNote()

  const title = useMemo(() => note?.title?.trim() || FALLBACK_TITLE, [note?.title])
  const content = useMemo(() => note?.content?.trim() ?? '', [note?.content])

  const handleEdit = () => {
    router.push({
      pathname: '/(auth)/notes/[id]/edit',
      params: { id: noteId, returnTo: returnToParam },
    })
  }

  const handleMore = () => {
    Alert.alert('Note actions', undefined, [
      { text: 'Edit note', onPress: handleEdit },
      {
        text: 'Delete note',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete note?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await deleteMutation.mutateAsync(noteId)
                  if (safeReturnTo) {
                    router.replace(safeReturnTo)
                  } else {
                    router.back()
                  }
                } catch (error: any) {
                  Alert.alert('Delete failed', error?.message ?? 'Please try again.')
                }
              },
            },
          ])
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading note…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isError || !note) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Unable to load this note.</Text>
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
            accessibilityLabel="Go back"
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={18} style={styles.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleMore}
            accessibilityRole="button"
            accessibilityLabel="More actions"
            style={styles.iconButton}
          >
            <Feather name="more-vertical" size={18} style={styles.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Last updated {new Date(note.updatedAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.card}>
          {content ? (
            <Text style={styles.bodyText}>{content}</Text>
          ) : (
            <Text style={styles.emptyText}>No note content yet.</Text>
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
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  iconButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.radii.xl,
  },
  icon: { color: theme.colors.mutedForeground },
  header: { marginBottom: theme.spacing.lg },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
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
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  emptyText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
}))
