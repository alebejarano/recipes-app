import { Feather } from '@expo/vector-icons'
import { File } from 'expo-file-system'
import * as IntentLauncher from 'expo-intent-launcher'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useMemo } from 'react'
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { useDeleteRecipeDocument, useRecipeDocument } from '@/features/recipes/hooks/useRecipeDocuments'
import { getSafeReturnTo } from '@/lib/navigation'
import { createThemedStyles } from '@/styles/createStyles'

const FALLBACK_TITLE = 'Recipe PDF'

type RecipeDocumentDetailScreenProps = {
  documentId: string
}

export default function RecipeDocumentDetailScreen({ documentId }: RecipeDocumentDetailScreenProps) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const safeReturnTo = getSafeReturnTo(returnTo)
  
  const { data: document, isLoading, isError } = useRecipeDocument(documentId)
  const deleteMutation = useDeleteRecipeDocument()

  // Computed values
  const title = useMemo(() => {
    return document?.title?.trim() || FALLBACK_TITLE
  }, [document?.title])

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

  // Open PDF handler
  const handleOpenPDF = useCallback(async () => {
    if (!document?.fileUri) {
      Alert.alert('Error', 'No file path available.')
      return
    }

    try {
      // Create file instance
      const file = new File(document.fileUri)
      
      // Check if file exists
      if (!file.exists) {
        Alert.alert(
          'File Not Found',
          'The PDF file could not be found. It may have been moved or deleted.'
        )
        return
      }

      if (Platform.OS === 'android') {
        // Android: Use the File's contentUri property (new API)
        const contentUri = file.contentUri
        
        if (!contentUri) {
          Alert.alert(
            'Error',
            'Unable to generate content URI for this file.'
          )
          return
        }
        
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/pdf',
        })
      } else {
        // iOS: Use the file URI directly
        const canOpen = await Linking.canOpenURL(file.uri)
        
        if (!canOpen) {
          Alert.alert(
            'Cannot Open PDF',
            'No application available to open PDF files.'
          )
          return
        }
        
        await Linking.openURL(file.uri)
      }
    } catch (error) {
      console.error('Error opening PDF:', error)
      
      // Check if it's because no PDF viewer is installed
      if (error instanceof Error && error.message.includes('No Activity found')) {
        Alert.alert(
          'No PDF Viewer Found',
          'Please install a PDF viewer app (like Adobe Acrobat Reader, Google PDF Viewer, or any file manager) to open PDF files.',
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        )
      } else {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred.'
        
        Alert.alert('Unable to Open PDF', errorMessage)
      }
    }
  }, [document?.fileUri])

  // Delete handler
  const handleDeletePDF = useCallback(() => {
    if (!documentId || deleteMutation.isPending) return

    Alert.alert(
      'Delete PDF?',
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
              
              Alert.alert('Deleted', 'PDF has been deleted successfully.', [
                {
                  text: 'OK',
                  onPress: handleGoBack
                }
              ])
            } catch (error) {
              console.error('Error deleting PDF:', error)
              
              const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to delete the PDF. Please try again.'
              
              Alert.alert('Delete Failed', errorMessage)
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
          <Text style={styles.statusText}>Loading PDF…</Text>
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
          <Text style={styles.errorTitle}>Unable to Load PDF</Text>
          <Text style={styles.errorMessage}>
            This document could not be loaded. It may have been deleted or is no longer available.
          </Text>
          <Button variant="primary" size="md" onPress={handleGoBack}>
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
        </View>

        {/* Open Button */}
        <Button
          variant="primary"
          size="lg"
          onPress={handleOpenPDF}
          icon={<Feather name="external-link" size={18} style={styles.buttonIcon} />}
        >
          Open PDF
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
          onPress={handleDeletePDF}
          disabled={deleteMutation.isPending}
          icon={<Feather name="trash-2" size={16} style={styles.deleteIcon} />}
        >
          {deleteMutation.isPending ? 'Deleting…' : 'Delete PDF'}
        </Button>
      </ScrollView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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

  // Button icons
  buttonIcon: {
    color: theme.colors.background,
  },
  deleteIcon: {
    color: theme.colors.destructive,
  },

  // Metadata card
  metadataCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    gap: theme.spacing.md,
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
}))