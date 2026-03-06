import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams, useSegments } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Screen from '@/components/Screen'
import { useDeleteManagedImport, useManagedImports } from '@/features/recipes/hooks/useManagedImports'
import { getSafeReturnTo } from '@/lib/navigation'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type ManageImportsScreenProps = {
  mode?: 'auth' | 'public' | 'dev'
}

type SortMode = 'oldest' | 'largest'

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${Math.round(bytes)} B`
}

export default function ManageImportsScreen({ mode }: ManageImportsScreenProps) {
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>()
  const segments = useSegments()
  const resolvedMode =
    mode ??
    (segments[0] === '(dev)' ? 'dev' : segments[0] === '(public)' ? 'public' : 'auth')
  const safeReturnTo = getSafeReturnTo(returnTo)
  const fallbackReturnTo =
    resolvedMode === 'dev'
      ? '/(dev)/(tabs)/collections?segment=recipes&recipesSegment=documents'
      : resolvedMode === 'public'
        ? '/(public)/(tabs)/collections?segment=recipes&recipesSegment=documents'
        : '/(auth)/(tabs)/collections?segment=recipes&recipesSegment=documents'

  const insets = useSafeAreaInsets()
  const bottomPadding = insets.bottom + theme.spacing.lg
  const importsQuery = useManagedImports()
  const deleteImportMutation = useDeleteManagedImport()

  const [sortMode, setSortMode] = useState<SortMode>('oldest')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteSuccessMessage, setBulkDeleteSuccessMessage] = useState<string | null>(null)

  const importData = useMemo(() => importsQuery.data ?? [], [importsQuery.data])

  const sortedImports = useMemo(() => {
    const list = [...importData]
    if (sortMode === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      return list
    }
    list.sort((a, b) => b.bytes - a.bytes)
    return list
  }, [importData, sortMode])

  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedImportIds([])
      return
    }
    const existingIds = new Set(sortedImports.map((file) => file.id))
    setSelectedImportIds((current) => current.filter((id) => existingIds.has(id)))
  }, [isSelectionMode, sortedImports])

  useEffect(() => {
    if (!bulkDeleteSuccessMessage) return
    const timeout = setTimeout(() => setBulkDeleteSuccessMessage(null), 2600)
    return () => clearTimeout(timeout)
  }, [bulkDeleteSuccessMessage])

  const selectedCount = selectedImportIds.length

  const handleBack = () => {
    router.replace((safeReturnTo ?? fallbackReturnTo) as any)
  }

  const toggleSelect = (id: string) => {
    if (isBulkDeleting) return
    setSelectedImportIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    )
  }

  const handleSelectAll = () => {
    if (isBulkDeleting) return
    if (selectedCount === sortedImports.length) {
      setSelectedImportIds([])
      return
    }
    setSelectedImportIds(sortedImports.map((file) => file.id))
  }

  const handleCancelSelection = () => {
    if (isBulkDeleting) return
    setSelectedImportIds([])
  }

  const handleExitSelectionMode = () => {
    if (isBulkDeleting) return
    setIsSelectionMode(false)
    setSelectedImportIds([])
  }

  const handleDelete = () => {
    if (selectedCount === 0 || isBulkDeleting) return
    Alert.alert(
      selectedCount === 1 ? 'Delete import?' : `Delete ${selectedCount} imports?`,
      selectedCount === 1
        ? 'This will permanently remove the selected import from your storage.'
        : `This will permanently remove ${selectedCount} imports from your storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: selectedCount === 1 ? 'Delete import' : `Delete ${selectedCount} imports`,
          style: 'destructive',
          onPress: async () => {
            const idsToDelete = [...selectedImportIds]
            setIsBulkDeleting(true)
            try {
              const results = await Promise.allSettled(
                idsToDelete.map((id) => deleteImportMutation.mutateAsync(id))
              )
              const failedIds = results
                .map((result, index) => ({ result, id: idsToDelete[index] }))
                .filter((entry) => entry.result.status === 'rejected')
                .map((entry) => entry.id)
              const deletedCount = idsToDelete.length - failedIds.length

              if (failedIds.length > 0) {
                setSelectedImportIds(failedIds)
                Alert.alert(
                  'Some imports could not be deleted',
                  `${deletedCount} deleted, ${failedIds.length} failed.`
                )
                return
              }

              setSelectedImportIds([])
              if (deletedCount === sortedImports.length) {
                setIsSelectionMode(false)
              }
              setBulkDeleteSuccessMessage(
                `${deletedCount} import${deletedCount === 1 ? '' : 's'} deleted`
              )
            } finally {
              setIsBulkDeleting(false)
            }
          },
        },
      ]
    )
  }

  const handleRowPress = (id: string) => {
    if (isBulkDeleting) return
    if (!isSelectionMode) {
      setIsSelectionMode(true)
      setSelectedImportIds([id])
      return
    }
    toggleSelect(id)
  }

  return (
    <Screen scroll={false} contentStyle={styles.screenContent}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={18} color={theme.colors.mutedForeground} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>
            {isSelectionMode
              ? `${selectedCount} import${selectedCount === 1 ? '' : 's'} selected`
              : 'Manage imports'}
          </Text>
        </View>
        <Pressable
          onPress={isSelectionMode ? handleExitSelectionMode : () => setIsSelectionMode(true)}
          style={styles.selectButton}
          accessibilityRole="button"
          accessibilityLabel={isSelectionMode ? 'Exit selection mode' : 'Select imports'}
          disabled={isBulkDeleting}
        >
          <Text style={styles.selectButtonText}>{isSelectionMode ? 'Done' : 'Select'}</Text>
        </Pressable>
      </View>

      {!isSelectionMode ? (
        <View style={styles.sortRow}>
          <Pressable
            onPress={() => setSortMode('oldest')}
            style={[styles.sortPill, sortMode === 'oldest' && styles.sortPillActive]}
            accessibilityRole="button"
            accessibilityLabel="Sort imports by oldest"
          >
            <Text style={[styles.sortText, sortMode === 'oldest' && styles.sortTextActive]}>
              Oldest
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortMode('largest')}
            style={[styles.sortPill, sortMode === 'largest' && styles.sortPillActive]}
            accessibilityRole="button"
            accessibilityLabel="Sort imports by largest"
          >
            <Text style={[styles.sortText, sortMode === 'largest' && styles.sortTextActive]}>
              Largest
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.listWrap}>
        {importsQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={styles.loadingText.color} />
            <Text style={styles.loadingText}>Loading imports…</Text>
          </View>
        ) : sortedImports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No imports to manage</Text>
            <Text style={styles.emptyBody}>
              Import files first, then return here to organize your storage.
            </Text>
          </View>
        ) : (
          <FlatList
            data={sortedImports}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: bottomPadding },
            ]}
            ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
            renderItem={({ item }) => {
              const isSelected = selectedImportIds.includes(item.id)
              const kindLabel = item.kind === 'document' ? 'Document' : 'Image'
              const displayTitle =
                item.title?.trim() ||
                item.fileName?.trim() ||
                `Untitled ${kindLabel.toLowerCase()}`
              const rowMeta =
                sortMode === 'largest'
                  ? `${kindLabel} · ${formatFileSize(item.bytes)}`
                  : `${kindLabel} · Saved ${new Date(item.createdAt).toLocaleDateString()}`

              return (
                <View style={[styles.rowCard, isSelected && styles.rowCardSelected]}>
                  <Pressable
                    onPress={() => handleRowPress(item.id)}
                    style={styles.rowPress}
                    accessibilityRole={isSelectionMode ? 'checkbox' : 'button'}
                    accessibilityState={isSelectionMode ? { checked: isSelected } : undefined}
                    accessibilityLabel={
                      isSelectionMode
                        ? `${isSelected ? 'Deselect' : 'Select'} ${displayTitle}`
                        : `Select ${displayTitle}`
                    }
                  >
                    {isSelectionMode ? (
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected ? (
                          <Feather name="check" size={12} color={theme.colors.primaryForeground} />
                        ) : null}
                      </View>
                    ) : null}
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {displayTitle}
                      </Text>
                      <Text style={styles.rowMeta}>{rowMeta}</Text>
                    </View>
                  </Pressable>
                </View>
              )
            }}
          />
        )}

        {isSelectionMode && selectedCount > 0 ? (
          <View style={styles.bulkBar}>
            <Pressable
              onPress={handleSelectAll}
              style={styles.bulkButton}
              accessibilityRole="button"
              accessibilityLabel={selectedCount === sortedImports.length ? 'Deselect all imports' : 'Select all imports'}
              disabled={isBulkDeleting}
            >
              <Text style={styles.bulkButtonText}>
                {selectedCount === sortedImports.length ? 'Deselect all' : 'Select all'}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleCancelSelection}
              style={styles.bulkButton}
              accessibilityRole="button"
              accessibilityLabel="Cancel selection"
              disabled={isBulkDeleting}
            >
              <Text style={styles.bulkButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[styles.bulkButton, styles.bulkDeleteButton]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${selectedCount} selected imports`}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
              ) : (
                <Text style={styles.bulkDeleteButtonText}>Delete ({selectedCount})</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {bulkDeleteSuccessMessage ? (
          <View
            style={[
              styles.snackbar,
              {
                bottom: insets.bottom + (isSelectionMode && selectedCount > 0 ? theme.spacing['2xl'] : theme.spacing.xs),
              },
            ]}
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Feather name="check-circle" size={16} color={styles.snackbarIcon.color} />
            <Text style={styles.snackbarText}>{bulkDeleteSuccessMessage}</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  screenContent: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  selectButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
  },
  selectButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.primary,
  },
  sortRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  sortPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
  },
  sortPillActive: {
    backgroundColor: theme.colors.primary,
  },
  sortText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.secondaryForeground,
  },
  sortTextActive: {
    color: theme.colors.primaryForeground,
  },
  listWrap: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  listContent: {
    paddingBottom: theme.spacing.lg,
  },
  rowCard: {
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  rowCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.secondary,
  },
  rowPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  checkboxSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  rowMeta: {
    marginTop: theme.spacing.xxs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  bulkBar: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bulkButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  bulkButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
  bulkDeleteButton: {
    backgroundColor: theme.colors.destructive,
  },
  bulkDeleteButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.primaryForeground,
  },
  snackbar: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  snackbarIcon: {
    color: theme.colors.primary,
  },
  snackbarText: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  emptyBody: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
}))
