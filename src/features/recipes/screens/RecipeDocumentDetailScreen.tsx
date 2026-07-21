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
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

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
  const { locale, t } = useTranslation()
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
    return document?.title?.trim() || t('recipes.documentDetail.fallbackTitle')
  }, [document?.title, t])

  const fileInfo = useMemo(() => getFileInfo(document?.fileName), [document?.fileName])

  const uploadedOn = useMemo(() => {
    if (!document?.createdAt) return t('recipes.documentDetail.uploadedOnUnknown')
    
    try {
      const date = new Date(document.createdAt)
      if (Number.isNaN(date.getTime())) return t('recipes.documentDetail.uploadedOnUnknown')
      
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return t('recipes.documentDetail.uploadedOnUnknown')
    }
  }, [document, locale, t])

  const fileSize = useMemo(() => {
    if (!document?.fileSize || document.fileSize <= 0) return '0 MB'
    
    const mb = document.fileSize / (1024 * 1024)
    const kb = document.fileSize / 1024
    
    if (mb >= 1) {
      return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
    }
    return `${kb.toFixed(0)} KB`
  }, [document])

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
      Alert.alert(
        t('recipes.documentDetail.openFileErrorTitle'),
        t('recipes.documentDetail.openFileMissingPath')
      )
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
              t('recipes.documentDetail.fileNotFoundTitle'),
              t('recipes.documentDetail.fileNotFoundBody')
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
            Alert.alert(
              t('recipes.documentDetail.openFileErrorTitle'),
              t('recipes.documentDetail.prepareFailed')
            )
            return
          }
          openUri = contentUri
        } else if (!normalizedUri.startsWith('content://') && !normalizedUri.startsWith('http')) {
          Alert.alert(
            t('recipes.documentDetail.openFileErrorTitle'),
            t('recipes.documentDetail.unsupportedType')
          )
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
            Alert.alert(
              t('recipes.documentDetail.cannotOpenTitle'),
              t('recipes.documentDetail.cannotOpenBody')
            )
            return
          }
          await Linking.openURL(document.fileUri)
          return
        }

        const file = new File(document.fileUri)

        // iOS: use the local file URI directly
        if (file.uri.startsWith('file://') && !file.exists) {
          Alert.alert(
            t('recipes.documentDetail.fileNotFoundTitle'),
            t('recipes.documentDetail.fileNotFoundBody')
          )
          return
        }

        const canOpen = await Linking.canOpenURL(file.uri)

        if (!canOpen) {
          Alert.alert(
            t('recipes.documentDetail.cannotOpenTitle'),
            t('recipes.documentDetail.cannotOpenBody')
          )
          return
        }

        await Linking.openURL(file.uri)
      }
    } catch (error) {
      // Check if it's because no viewer is installed
      if (error instanceof Error && error.message.includes('No Activity found')) {
        Alert.alert(
          fileInfo.kind === 'pdf'
            ? t('recipes.documentDetail.noPdfViewerTitle')
            : t('recipes.documentDetail.cannotOpenTitle'),
          fileInfo.kind === 'pdf'
            ? t('recipes.documentDetail.noPdfViewerBody')
            : t('recipes.documentDetail.noAppBody'),
          [
            {
              text: t('recipes.documentDetail.ok'),
              style: 'default'
            }
          ]
        )
      } else {
        Alert.alert(
          t('recipes.documentDetail.openFileErrorTitle'),
          getUserFacingErrorMessage(error, t('recipes.documentDetail.openFailedFallback'))
        )
      }
    }
  }, [document, fileInfo, t])

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
        t('recipes.documentDetail.renameFailedTitle'),
        getUserFacingErrorMessage(error, t('recipes.documentDetail.renameFailedBody'))
      )
    }
  }, [documentId, renameValue, t, title, updateTitleMutation])

  // Delete handler
  const handleDeleteFile = useCallback(() => {
    if (!documentId || deleteMutation.isPending) return

    Alert.alert(
      t('recipes.documentDetail.deleteTitle'),
      t('recipes.documentDetail.deleteBody', { title }),
      [
        {
          text: t('recipes.documentDetail.cancel'),
          style: 'cancel'
        },
        {
          text: t('recipes.documentDetail.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(documentId)

              Alert.alert(t('recipes.documentDetail.deletedTitle'), t('recipes.documentDetail.deletedBody'), [
                {
                  text: t('recipes.documentDetail.ok'),
                  onPress: handleGoBack
                }
              ])
            } catch (error) {
              Alert.alert(
                t('recipes.documentDetail.deleteFailedTitle'),
                getUserFacingErrorMessage(error, t('recipes.documentDetail.deleteFailedBody'))
              )
            }
          }
        }
      ]
    )
  }, [documentId, deleteMutation, handleGoBack, t, title])

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.centeredContainer}>
          <Text style={styles.statusText}>{t('recipes.documentDetail.loading')}</Text>
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
          <Text style={styles.errorTitle}>{t('recipes.documentDetail.loadFailedTitle')}</Text>
          <Text style={styles.errorMessage}>{t('recipes.documentDetail.loadFailedBody')}</Text>
          <Button variant="secondary" size="md" onPress={handleGoBack}>
            {t('recipes.documentDetail.goBack')}
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
            accessibilityLabel={t('recipes.documentDetail.goBackA11y')}
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
            accessibilityLabel={t('recipes.documentDetail.editNameA11y')}
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
          {t('recipes.documentDetail.openLabel', { label: fileInfo.label })}
        </Button>

        {/* Metadata Card */}
        <View style={styles.metadataCard}>
          <Text style={styles.metadataTitle}>{t('recipes.documentDetail.metadataTitle')}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Feather name="calendar" size={16} style={styles.metadataIcon} />
              <Text style={styles.metadataLabel}>{t('recipes.documentDetail.uploadedLabel')}</Text>
            </View>
            <Text style={styles.metadataValue}>{uploadedOn}</Text>
          </View>

          <View style={styles.metadataRow}>
            <View style={styles.metadataItem}>
              <Feather name="hard-drive" size={16} style={styles.metadataIcon} />
              <Text style={styles.metadataLabel}>{t('recipes.documentDetail.fileSizeLabel')}</Text>
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
          {deleteMutation.isPending ? t('recipes.documentDetail.deleting') : t('recipes.documentDetail.deleteFile')}
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
            <Text style={styles.renameTitle}>{t('recipes.documentDetail.renameTitle')}</Text>
            <Text style={styles.renameDescription}>{t('recipes.documentDetail.renameDescription')}</Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              placeholder={t('recipes.documentDetail.renamePlaceholder')}
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
                {t('recipes.documentDetail.cancel')}
              </Button>
              <Button
                size="md"
                onPress={() => void handleRename()}
                disabled={!renameValue.trim() || renameValue.trim() === title}
                loading={updateTitleMutation.isPending}
                loadingLabel={t('recipes.documentDetail.saving')}
                style={styles.renameAction}
              >
                {t('recipes.documentDetail.save')}
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
    ...theme.textVariants.display,
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
    ...theme.textVariants.emphasis,
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
    ...theme.textVariants.labelSmall,
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
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  errorMessage: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
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
    backgroundColor: theme.colors.overlay,
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
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  renameDescription: {
    ...theme.textVariants.caption,
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
    ...theme.textVariants.body,
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
