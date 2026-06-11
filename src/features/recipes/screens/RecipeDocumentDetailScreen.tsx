import { Feather } from '@expo/vector-icons'
import { File } from '@/lib/fileSystem'
import { getContentUriAsync } from 'expo-file-system/legacy'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams, useSegments } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import {
  useDeleteRecipeDocument,
  useRecipeDocument,
  useUpdateRecipeDocumentTitle,
} from '@/features/recipes/hooks/useRecipeDocuments'
import { getSafeReturnTo } from '@/lib/navigation'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

const FALLBACK_TITLE = 'Recipe file'

type FileKind = 'pdf' | 'image' | 'unknown'

function getFileInfo(fileName?: string | null) {
  const lower = (fileName ?? '').trim().toLowerCase()
  if (lower.endsWith('.pdf')) {
    return { kind: 'pdf' as FileKind, label: 'PDF', mimeType: 'application/pdf' }
  }
  if (lower.endsWith('.png')) {
    return { kind: 'image' as FileKind, label: 'PNG', mimeType: 'image/png' }
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return { kind: 'image' as FileKind, label: 'JPG', mimeType: 'image/jpeg' }
  }
  return { kind: 'unknown' as FileKind, label: 'File', mimeType: '*/*' }
}

type RecipeDocumentDetailScreenProps = {
  documentId: string
}

export default function RecipeDocumentDetailScreen({ documentId }: RecipeDocumentDetailScreenProps) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const segments = useSegments()
  const routeMode = segments[0] === '(public)' ? 'public' : 'auth'
  const safeReturnTo = getSafeReturnTo(returnTo)
  
  const { data: document, isLoading, isError } = useRecipeDocument(documentId, routeMode)
  const deleteMutation = useDeleteRecipeDocument(routeMode)
  const updateTitleMutation = useUpdateRecipeDocumentTitle(routeMode)
  const [isRenameVisible, setIsRenameVisible] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  // Computed values
  const title = useMemo(() => {
    return document?.title?.trim() || FALLBACK_TITLE
  }, [document?.title])

  const fileInfo = useMemo(() => getFileInfo(document?.fileName), [document?.fileName])

  const uploadedOn = useMemo(() => {
    if (!document?.createdAt) return '—'
    
    try {
      const date = new Date(document.createdAt)
      if (Number.isNaN(date.getTime())) return '—'
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return '—'
    }
  }, [document?.createdAt])

  const fileSize = useMemo(() => {
    if (!document?.fileSize || document.fileSize <= 0) return '0 MB'
    
    const mb = document.fileSize / (1024 * 1024)
    const kb = document.fileSize / 1024
    
    if (mb >= 1) {
      return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
    }
    return `${kb.toFixed(0)} KB`
  }, [document?.fileSize])

  // Navigation handler
  const handleGoBack = useCallback(() => {
    if (safeReturnTo) {
      router.replace(safeReturnTo)
    } else {
      router.back()
    }
  }, [safeReturnTo])

  // Open file handler
  const handleOpenFile = useCallback(async () => {
    if (!document?.fileUri) {
      Alert.alert('Unable to open file', 'No file path is available for this import.')
      return
    }

    try {
      if (Platform.OS === 'android') {
        const rawUri = document.fileUri.trim()
        const normalizedUri = rawUri.startsWith('/') ? `file://${rawUri}` : rawUri
        let openUri = rawUri

        if (normalizedUri.startsWith('file://')) {
          const file = new File(normalizedUri)
          if (!file.exists) {
            Alert.alert(
              'File Not Found',
              'The file could not be found. It may have been moved or deleted.'
            )
            return
          }

          let contentUri = file.contentUri
          if (!contentUri) {
            try {
              contentUri = await getContentUriAsync(normalizedUri)
            } catch {
              contentUri = ''
            }
          }

          if (!contentUri) {
            Alert.alert('Unable to open file', 'This file cannot be prepared for opening right now.')
            return
          }
          openUri = contentUri
        } else if (!normalizedUri.startsWith('content://') && !normalizedUri.startsWith('http')) {
          Alert.alert('Unable to open file', 'This file type is not supported.')
          return
        } else {
          openUri = normalizedUri
        }

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: openUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: fileInfo.mimeType,
        })
      } else {
        if (/^https?:\/\//i.test(document.fileUri)) {
          const canOpenRemote = await Linking.canOpenURL(document.fileUri)
          if (!canOpenRemote) {
            Alert.alert('Cannot Open File', 'No application available to open this file.')
            return
          }
          await Linking.openURL(document.fileUri)
          return
        }

        const file = new File(document.fileUri)

        // iOS: use the local file URI directly
        if (file.uri.startsWith('file://') && !file.exists) {
          Alert.alert(
            'File Not Found',
            'The file could not be found. It may have been moved or deleted.'
          )
          return
        }

        const canOpen = await Linking.canOpenURL(file.uri)

        if (!canOpen) {
          Alert.alert(
            'Cannot Open File',
            'No application available to open this file.'
          )
          return
        }

        await Linking.openURL(file.uri)
      }
    } catch (error) {
      // Check if it's because no viewer is installed
      if (error instanceof Error && error.message.includes('No Activity found')) {
        Alert.alert(
          fileInfo.kind === 'pdf' ? 'No PDF Viewer Found' : 'No App Found',
          fileInfo.kind === 'pdf'
            ? 'Please install a PDF viewer app (like Adobe Acrobat Reader, Google PDF Viewer, or any file manager) to open PDF files.'
            : 'Please install an app that can open this file type.',
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        )
      } else {
        Alert.alert(
          'Unable to open file',
          getUserFacingErrorMessage(error, 'This file could not be opened. Please try again.')
        )
      }
    }
  }, [document?.fileUri, fileInfo])

  const handleOpenRename = useCallback(() => {
    setRenameValue(title)
    setIsRenameVisible(true)
  }, [title])

  const handleCloseRename = useCallback(() => {
    if (updateTitleMutation.isPending) return
    setIsRenameVisible(false)
  }, [updateTitleMutation.isPending])

  const handleRename = useCallback(async () => {
    const nextTitle = renameValue.trim()
    if (!nextTitle || nextTitle === title || updateTitleMutation.isPending) return

    try {
      await updateTitleMutation.mutateAsync({
        id: documentId,
        title: nextTitle,
      })
      setIsRenameVisible(false)
    } catch (error) {
      Alert.alert(
        'Rename failed',
        getUserFacingErrorMessage(error, 'The import name could not be updated. Please try again.')
      )
    }
  }, [documentId, renameValue, title, updateTitleMutation])

  // Delete handler
  const handleDeleteFile = useCallback(() => {
    if (!documentId || deleteMutation.isPending) return

    Alert.alert(
      'Delete file?',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(documentId)

              Alert.alert('Deleted', 'File has been deleted successfully.', [
                {
                  text: 'OK',
                  onPress: handleGoBack
                }
              ])
            } catch (error) {
              Alert.alert(
                'Delete failed',
                getUserFacingErrorMessage(error, 'Failed to delete the file. Please try again.')
              )
            }
          }
        }
      ]
    )
  }, [documentId, deleteMutation, title, handleGoBack])

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centeredContainer}>
          <Text style={styles.statusText}>Loading file…</Text>
        </View>
      </SafeAreaView>
    )
  }

  // Error state
  if (isError || !document) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centeredContainer}>
          <Feather name="alert-circle" size={48} style={styles.errorIcon} />
          <Text style={styles.errorTitle}>Unable to load file</Text>
          <Text style={styles.errorMessage}>
            This document could not be loaded. It may have been deleted or is no longer available.
          </Text>
          <Button variant="secondary" size="md" onPress={handleGoBack}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  // Main content
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleGoBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={20} style={styles.backIcon} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Feather name="file-text" size={32} style={styles.titleIcon} />
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            onPress={handleOpenRename}
            accessibilityRole="button"
            accessibilityLabel="Edit import name"
            style={styles.editTitleButton}
          >
            <Feather name="edit-2" size={18} style={styles.editTitleIcon} />
          </TouchableOpacity>
        </View>

        {/* Open Button */}
        <Button
          variant="primary"
          size="lg"
          onPress={handleOpenFile}
          icon={<Feather name="external-link" size={18} style={styles.buttonIcon} />}
        >
          {`Open ${fileInfo.label}`}
        </Button>

        {/* Metadata Card */}
        <View style={styles.metadataCard}>
          <Text style={styles.metadataTitle}>Document Information</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Feather name="calendar" size={16} style={styles.metadataIcon} />
              <Text style={styles.metadataLabel}>Uploaded</Text>
            </View>
            <Text style={styles.metadataValue}>{uploadedOn}</Text>
          </View>

          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Feather name="hard-drive" size={16} style={styles.metadataIcon} />
              <Text style={styles.metadataLabel}>File Size</Text>
            </View>
            <Text style={styles.metadataValue}>{fileSize}</Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Delete Button */}
        <Button
          variant="secondary"
          size="md"
          onPress={handleDeleteFile}
          disabled={deleteMutation.isPending}
          icon={<Feather name="trash-2" size={16} style={styles.deleteIcon} />}
        >
          {deleteMutation.isPending ? 'Deleting…' : 'Delete file'}
        </Button>
      </ScrollView>

      <Modal
        visible={isRenameVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseRename}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.renameCard}>
            <Text style={styles.renameTitle}>Edit import name</Text>
            <Text style={styles.renameDescription}>
              This changes the name shown in Dropsauce. The original file is not modified.
            </Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder="Import name"
              placeholderTextColor={styles.placeholder.color}
              style={styles.renameInput}
              autoFocus
              autoCapitalize="sentences"
              autoCorrect
              maxLength={120}
              returnKeyType="done"
              onSubmitEditing={() => void handleRename()}
            />
            <View style={styles.renameActions}>
              <Button
                variant="secondary"
                size="md"
                onPress={handleCloseRename}
                disabled={updateTitleMutation.isPending}
                style={styles.renameAction}
              >
                Cancel
              </Button>
              <Button
                size="md"
                onPress={() => void handleRename()}
                disabled={!renameValue.trim() || renameValue.trim() === title}
                loading={updateTitleMutation.isPending}
                loadingLabel="Saving…"
                style={styles.renameAction}
              >
                Save
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  // Container styles
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: layout.sectionGap,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backIcon: {
    color: theme.colors.foreground,
  },

  // Title styles
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  titleIcon: {
    color: theme.colors.primary,
  },
  title: {
    flex: 1,
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  editTitleButton: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  editTitleIcon: {
    color: theme.colors.foreground,
  },

  // Button icons
  buttonIcon: {
    color: theme.colors.background,
  },
  deleteIcon: {
    color: theme.colors.destructive,
  },

  // Metadata card
  metadataCard: {
    padding: layout.cardPadding,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: layout.cardGap,
  },
  metadataTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metadataIcon: {
    color: theme.colors.mutedForeground,
  },
  metadataLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  metadataValue: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },

  // Status and error styles
  statusText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
  },
  errorIcon: {
    color: theme.colors.destructive,
  },
  errorTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  errorMessage: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: theme.lineHeight.base,
  },

  // Utility
  spacer: {
    flex: 1,
    minHeight: theme.spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(20, 16, 10, 0.36)',
  },
  renameCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.radii.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.md,
  },
  renameTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  renameDescription: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  renameInput: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  placeholder: {
    color: theme.colors.mutedForeground,
  },
  renameActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  renameAction: {
    flex: 1,
  },
}))
