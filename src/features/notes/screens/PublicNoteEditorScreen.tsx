import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

import {
  useCreateLocalNote,
  useDeleteLocalNote,
  useLocalNote,
  useUpdateLocalNote,
} from '@/features/notes/hooks/useLocalNotes'
import { getSafeReturnTo } from '@/lib/navigation'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'

const FOOTER_HEIGHT = 72

type NoteEditorScreenProps = {
  noteId?: string
}

export default function PublicNoteEditorScreen({ noteId }: NoteEditorScreenProps) {
  const insets = useSafeAreaInsets()
  const isEditing = Boolean(noteId)
  const resolvedNoteId = noteId ?? ''
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  const returnToParam = typeof safeReturnTo === 'string' ? safeReturnTo : undefined
  const showSnackbar = useTransientSnackbarStore((state) => state.show)

  const noteQuery = useLocalNote(resolvedNoteId)
  const createMutation = useCreateLocalNote()
  const updateMutation = useUpdateLocalNote(resolvedNoteId)
  const deleteMutation = useDeleteLocalNote()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const initialValuesRef = useRef<{ title: string; content: string } | null>(null)

  useEffect(() => {
    if (!isEditing) return
    if (!noteQuery.data || initialValuesRef.current) return

    const nextValues = {
      title: noteQuery.data.title ?? '',
      content: noteQuery.data.content ?? '',
    }

    initialValuesRef.current = nextValues
    setTitle(nextValues.title)
    setContent(nextValues.content)
  }, [isEditing, noteQuery.data])

  const normalizedTitle = title.trim()
  const normalizedContent = content.trim()
  const isValid = normalizedTitle.length > 0 || normalizedContent.length > 0

  const hasChanges = useMemo(() => {
    if (!isEditing) return true
    if (!initialValuesRef.current) return false
    return (
      normalizedTitle !== initialValuesRef.current.title.trim() ||
      normalizedContent !== initialValuesRef.current.content.trim()
    )
  }, [isEditing, normalizedTitle, normalizedContent])

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending
  const canSave = isValid && hasChanges && !isSaving

  const screenTitle = isEditing ? 'Edit note' : 'Create a note'
  const screenSubtitle = isEditing
    ? 'Update your note anytime.'
    : 'Capture ideas, tips, and quick thoughts.'
  const saveLabel = isEditing ? 'Save changes' : 'Save note'

  const handleBack = () => {
    if (isSaving || isDeleting) return
    if (safeReturnTo) {
      router.replace(safeReturnTo)
    } else {
      router.back()
    }
  }

  const handleSave = async () => {
    if (!canSave) return

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ title, content })
        router.replace({
          pathname: '/(public)/notes/[id]',
          params: { id: resolvedNoteId, returnTo: returnToParam },
        })
        return
      } else {
        const note = await createMutation.mutateAsync({ title, content })
        router.replace({
          pathname: '/(public)/notes/[id]',
          params: { id: note.id, returnTo: returnToParam },
        })
        return
      }
    } catch (error: any) {
      Alert.alert('Save failed', getUserFacingErrorMessage(error))
    }
  }

  const handleDelete = () => {
    if (!resolvedNoteId || isDeleting || isSaving) return

    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(resolvedNoteId)
            showSnackbar('Note deleted')
            router.back()
          } catch (error: any) {
            Alert.alert('Delete failed', getUserFacingErrorMessage(error))
          }
        },
      },
    ])
  }

  if (isEditing && noteQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>Loading note…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isEditing && noteQuery.isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Unable to load this note.</Text>
          <Button variant="secondary" size="md" onPress={handleBack}>
            Go back
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Button
            variant="ghost"
            size="md"
            onPress={handleBack}
            style={styles.backButton}
            textStyle={styles.backText}
            icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
            disabled={isSaving || isDeleting}
          >
            Back
          </Button>

          {isEditing ? (
            <Button
              variant="ghost"
              size="md"
              onPress={handleDelete}
              style={styles.deleteButton}
              textStyle={styles.deleteText}
              disabled={isSaving || isDeleting}
            >
              Delete
            </Button>
          ) : null}
        </View>

        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: insets.bottom + FOOTER_HEIGHT + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
          >
            <Text style={styles.title}>{screenTitle}</Text>
            <Text style={styles.subtitle}>{screenSubtitle}</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Title (optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Meal prep ideas"
                  placeholderTextColor={styles.placeholder.color}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Note</Text>
              <View style={styles.textAreaWrapper}>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write here..."
                  placeholderTextColor={styles.placeholder.color}
                  multiline
                  textAlignVertical="top"
                  style={styles.textArea}
                />
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <Button
              variant="secondary"
              size="md"
              onPress={handleBack}
              disabled={isSaving || isDeleting}
              style={styles.footerButton}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onPress={handleSave}
              loading={isSaving}
              disabled={!canSave || isSaving || isDeleting}
              style={styles.footerButton}
            >
              {saveLabel}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex1: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingTop: layout.screenPadding,
    paddingBottom: theme.spacing.md,
  },
  backButton: { paddingHorizontal: 0 },
  backText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
  },
  backIcon: { color: theme.colors.mutedForeground, fontSize: theme.fontSize.lg, },
  deleteButton: { paddingHorizontal: 0 },
  deleteText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.accent,
  },

  scroll: {
    paddingHorizontal: layout.screenPadding,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.lg,
  },
  fieldGroup: { marginBottom: theme.spacing.lg },
  label: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  input: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  textAreaWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 180,
  },
  textArea: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  footer: {
    flexDirection: 'row',
    gap: layout.listGap,
    paddingHorizontal: layout.screenPadding,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  footerButton: { flex: 1 },
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
}))
