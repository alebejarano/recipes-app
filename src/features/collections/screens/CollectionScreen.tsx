// app/(dev)/(tabs)/collections.tsx (or wherever CollectionsScreen lives)

import { Feather } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router, useLocalSearchParams, useSegments } from 'expo-router'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'

import Screen from '@/components/Screen'
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

import CollectionTile from '@/features/collections/components/CollectionTile'
import NewCollectionTile from '@/features/collections/components/NewCollectionTile'
import RecipeSegmentedTabs from '@/features/collections/components/RecipeSegmentedTabs'
import SegmentedTabs from '@/features/collections/components/SegmentedTabs'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import KitchenAlmostFullCard from '@/features/recipes/components/KitchenAlmostFullCard'

// NEW: segment pages
import NotesSegment from '@/features/collections/components/NotesSegment'
import RecipeDocumentsSegment from '@/features/collections/components/RecipeDocumentsSegment'
import ShoppingSegment from '@/features/collections/components/ShoppingSegment'

import { useAuth } from '@/features/auth/context/AuthContext'
import type { CollectionItem, RecipeSegmentKey, SegmentKey } from '@/features/collections/types'
import {
  buildCollectionsForSegment,
  getCategorizingFolders,
} from '@/features/collections/utils/collections'
import { useStrategyCreateFolder, useStrategyFoldersList } from '@/features/folders/hooks/useStrategyFolders'
import { useRecipeDocumentUsageSummary } from '@/features/recipes/hooks/useRecipeDocuments'
import { useStrategyRecipesList } from '@/features/recipes/hooks/useStrategyRecipes'
import { useStorageDataMode } from '@/features/storage/hooks/useStorageDataMode'
import { FREE_PLAN_MAX_IMPORT_TOTAL_BYTES } from '@/features/subscription/constants/limits'
import { KITCHEN_ALMOST_FULL_STORAGE_DISMISS_UNTIL_PREFIX } from '@/features/subscription/constants/reminderKeys'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import { useLimitQaOverrides } from '@/features/subscription/dev/limitQaOverrides'
import {
  hasShownStorageReminderInSession,
  markStorageReminderShownInSession,
} from '@/features/subscription/dev/reminderSession'
import { buildFreePlanUsageSnapshot, formatMegabytes } from '@/features/subscription/utils/planUsage'
import { getSafeReturnTo } from '@/lib/navigation'

type CollectionsScreenProps = {
  mode?: 'auth' | 'public' | 'dev'
}

export default function CollectionsScreen({ mode }: CollectionsScreenProps) {
  const { segment: segmentParam, recipesSegment, docSuccess, docQueued, sort } = useLocalSearchParams<{
    segment?: SegmentKey
    recipesSegment?: RecipeSegmentKey
    docSuccess?: string
    docQueued?: string
    sort?: 'recent' | 'largest' | 'oldest'
  }>()
  const segments = useSegments()
  const resolvedMode =
    mode ??
    (segments[0] === '(dev)' ? 'dev' : segments[0] === '(public)' ? 'public' : 'auth')
  const isPublic = resolvedMode === 'public'
  const isDevMode = resolvedMode === 'dev'
  const { user } = useAuth()
  const showSnackbar = useTransientSnackbarStore((state) => state.show)
  const { plan } = useContext(SubscriptionContext)
  const { overrides } = useLimitQaOverrides()
  const { shouldUseLocalData } = useStorageDataMode(resolvedMode)
  const [segment, setSegment] = useState<SegmentKey>('recipes')
  const [recipeSegment, setRecipeSegment] = useState<RecipeSegmentKey>('folders')
  const [showDocSuccess, setShowDocSuccess] = useState(false)
  const [showDocQueued, setShowDocQueued] = useState(false)
  const [queueStorageReminderAfterSuccess, setQueueStorageReminderAfterSuccess] = useState(false)
  const [showStorageReminder, setShowStorageReminder] = useState(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderEmoji, setNewFolderEmoji] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)
  const recipesQuery = useStrategyRecipesList({ limit: 200 }, resolvedMode)
  const storageUsageQuery = useRecipeDocumentUsageSummary({ enabled: plan !== 'premium' })
  const foldersQuery = useStrategyFoldersList(resolvedMode)
  const createFolderMutation = useStrategyCreateFolder(resolvedMode)
  const returnTo = getSafeReturnTo(
    resolvedMode === 'dev'
      ? '/(dev)/(tabs)/collections?segment=recipes'
      : resolvedMode === 'public'
        ? '/(public)/(tabs)/collections?segment=recipes'
        : '/(auth)/(tabs)/collections?segment=recipes'
  )
  const returnToParam = typeof returnTo === 'string' ? returnTo : undefined
  const manageImportsPath =
    resolvedMode === 'dev'
      ? '/(dev)/imports/manage'
      : resolvedMode === 'public'
        ? '/(public)/imports/manage'
        : '/(auth)/imports/manage'
  const recipeCount = recipesQuery.data?.length ?? 0
  const storageBytesUsed = storageUsageQuery.data?.totalBytes ?? 0
  const usageSnapshot = useMemo(
    () => buildFreePlanUsageSnapshot(recipeCount, storageBytesUsed),
    [recipeCount, storageBytesUsed]
  )
  const effectiveStorageUsageBand =
    isDevMode && overrides.storageUsageBandOverride ? overrides.storageUsageBandOverride : usageSnapshot.storageUsageBand
  const storageLeftMb = Math.max(0, formatMegabytes(FREE_PLAN_MAX_IMPORT_TOTAL_BYTES - storageBytesUsed))

  useEffect(() => {
    if (segmentParam === 'notes' || segmentParam === 'recipes' || segmentParam === 'shopping') {
      setSegment(segmentParam)
    }
  }, [segmentParam])

  useEffect(() => {
    if (recipesSegment === 'documents' || recipesSegment === 'folders') {
      setRecipeSegment(recipesSegment)
    }
  }, [recipesSegment])

  useEffect(() => {
    if (docSuccess === '1') {
      setSegment('recipes')
      setRecipeSegment('documents')
      setShowDocSuccess(true)
      setShowDocQueued(false)
      setShowStorageReminder(false)
    }
  }, [docSuccess])

  useEffect(() => {
    if (docQueued === '1') {
      setSegment('recipes')
      setRecipeSegment('documents')
      setShowDocQueued(true)
      setShowDocSuccess(false)
      setShowStorageReminder(false)
    }
  }, [docQueued])

  useEffect(() => {
    if (!showDocSuccess && !showDocQueued) return
    const timeout = setTimeout(() => {
      setShowDocSuccess(false)
      setShowDocQueued(false)
    }, showDocQueued ? 4200 : 2400)
    return () => clearTimeout(timeout)
  }, [showDocQueued, showDocSuccess])

  useEffect(() => {
    if (recipeSegment !== 'documents' && showDocSuccess) {
      setShowDocSuccess(false)
    }
    if (recipeSegment !== 'documents' && showDocQueued) {
      setShowDocQueued(false)
    }
  }, [recipeSegment, showDocQueued, showDocSuccess])

  useEffect(() => {
    if (docSuccess !== '1') return
    if (plan === 'premium') return
    if (effectiveStorageUsageBand !== 'between95and99') return
    if (hasShownStorageReminderInSession()) return
    if (storageUsageQuery.isLoading) return

    let isCancelled = false

    async function maybeQueueStorageReminder() {
      const key = `${KITCHEN_ALMOST_FULL_STORAGE_DISMISS_UNTIL_PREFIX}${resolvedMode}:${user?.id ?? 'guest'}`
      try {
        const rawDismissUntil = await AsyncStorage.getItem(key)
        if (isCancelled) return
        const dismissUntil = Number(rawDismissUntil ?? 0)
        if (Number.isFinite(dismissUntil) && dismissUntil > Date.now()) return
      } catch {
        if (isCancelled) return
      }

      setQueueStorageReminderAfterSuccess(true)
    }

    void maybeQueueStorageReminder()
    return () => {
      isCancelled = true
    }
  }, [
    docSuccess,
    plan,
    resolvedMode,
    storageUsageQuery.isLoading,
    effectiveStorageUsageBand,
    user?.id,
  ])

  useEffect(() => {
    if (!queueStorageReminderAfterSuccess) return
    if (showDocSuccess) return
    if (recipeSegment !== 'documents' || segment !== 'recipes') return
    markStorageReminderShownInSession()
    setShowStorageReminder(true)
    setQueueStorageReminderAfterSuccess(false)
  }, [queueStorageReminderAfterSuccess, recipeSegment, segment, showDocSuccess])

  const dismissStorageReminder = async () => {
    setShowStorageReminder(false)
    markStorageReminderShownInSession()
    const dismissUntil = Date.now() + 24 * 60 * 60 * 1000
    try {
      await AsyncStorage.setItem(
        `${KITCHEN_ALMOST_FULL_STORAGE_DISMISS_UNTIL_PREFIX}${resolvedMode}:${user?.id ?? 'guest'}`,
        String(dismissUntil)
      )
    } catch {
      // No-op: session suppression still avoids repeat prompts.
    }
  }

  const recipeData = useMemo(
    () => recipesQuery.data ?? [],
    [recipesQuery.data]
  )

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>()
    let uncategorized = 0
    for (const recipe of recipeData) {
      const folders = recipe.folders ?? []
      if (getCategorizingFolders(folders).length === 0) {
        uncategorized += 1
      }
      for (const folder of folders) {
        const key = folder.name.toLowerCase()
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return { counts, uncategorized }
  }, [recipeData])

  const collections = useMemo<CollectionItem[]>(() => {
    const base = buildCollectionsForSegment(segment, recipeData)
    if (segment !== 'recipes') return base

    const folderSource = foldersQuery.data ?? []

    const folderItems: CollectionItem[] =
      folderSource.map((folder) => ({
        key: folder.name,
        label: folder.name,
        count: folderCounts.counts.get(folder.name.toLowerCase()) ?? 0,
        kind: 'tag' as const,
        emoji: folder.emoji ?? undefined,
      }))

    const items: CollectionItem[] = [...folderItems]
    if (folderCounts.uncategorized > 0) {
      items.push({
        key: 'Uncategorized',
        label: 'Uncategorized',
        count: folderCounts.uncategorized,
        kind: 'tag',
      })
    }

    items.sort((a, b) => a.label.localeCompare(b.label))
    items.push({ key: 'new', label: 'Create folder', count: 0, kind: 'new' })

    return items
  }, [segment, recipeData, foldersQuery.data, folderCounts])

  const recipeHelperText =
    recipeSegment === 'documents'
      ? ''
      : 'Recipes are grouped automatically based on tags'
  const isCreatingFolder = createFolderMutation.isPending
  const showFab = segment === 'recipes'

  const fabLabel =
    recipeSegment === 'documents'
      ? 'Import file'
      : 'Create folder'

  const onPressFab = () => {
    if (recipeSegment === 'documents') {
      router.push({
        pathname: isPublic
          ? '/(public)/recipes/create'
          : resolvedMode === 'dev'
            ? '/(dev)/recipes/create'
            : '/(auth)/recipes/create',
        params: { entry: 'pdf' },
      })
      return
    }
    setIsCreateFolderOpen(true)
  }

  const handleCreateFolder = async () => {
    if (isCreatingFolder) return
    const name = newFolderName.trim()
    if (!name) return
    const emoji = newFolderEmoji.trim() || '📁'

    try {
      if (shouldUseLocalData) {
        const folderCount = foldersQuery.data?.length ?? 0
        await createFolderMutation.mutateAsync({ name, emoji })
        if (isPublic && folderCount >= 2) {
          Alert.alert(
            'Keep your folders safe',
            'Create an account to sync and back up your folders.',
            [
              { text: 'Not now', style: 'cancel' },
              { text: 'Create account', onPress: () => router.push('/(public)/get-started') },
            ]
          )
        }
      } else {
        await createFolderMutation.mutateAsync({ name, emoji })
      }
    } catch (error: any) {
      const code = error?.code ?? error?.cause?.code
      if (code === '23505') {
        Alert.alert('Folder already exists', 'Choose a different folder name.')
      } else {
        Alert.alert('Unable to create folder', 'Please try again.')
      }
      return
    }

    setNewFolderName('')
    setNewFolderEmoji('')
    setIsCreateFolderOpen(false)
    showSnackbar('Folder created')
  }

  return (
    <Screen scroll={false} contentStyle={styles.screenContent}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>Everything organized in one place</Text>
        </View>

        {showFab ? (
          <Pressable
            onPress={onPressFab}
            style={styles.fab}
            accessibilityRole="button"
            accessibilityLabel={fabLabel}
            disabled={isCreatingFolder}
          >
            <Feather name="plus" size={22} color={theme.colors.primaryForeground} />
          </Pressable>
        ) : null}
      </View>

      {/* Segmented control */}
      <SegmentedTabs value={segment} onChange={setSegment} />
      {segment === 'recipes' ? (
        <RecipeSegmentedTabs value={recipeSegment} onChange={setRecipeSegment} />
      ) : null}

      {segment === 'recipes' && recipeSegment === 'documents' && (showDocSuccess || showDocQueued) ? (
        <View style={styles.successBanner} accessibilityRole="alert">
          <View style={styles.successContent}>
            <Feather
              name={showDocQueued ? 'cloud-off' : 'check-circle'}
              size={18}
              color={styles.successIcon.color}
            />
            <Text style={styles.successText}>
              {showDocQueued
                ? 'Saved offline. This file will upload when your connection is back.'
                : 'Your recipe file has been successfully uploaded.'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              setShowDocSuccess(false)
              setShowDocQueued(false)
            }}
            style={styles.successClose}
            accessibilityRole="button"
            accessibilityLabel="Dismiss success message"
          >
            <Feather name="x" size={16} color={styles.successCloseIcon.color} />
          </Pressable>
        </View>
      ) : null}
      {segment === 'recipes' && recipeSegment === 'documents' && !showDocSuccess && !showDocQueued && showStorageReminder ? (
        <KitchenAlmostFullCard
          title="Your kitchen storage is almost full"
          line1={`About ${storageLeftMb} MB left on Free.`}
          line2="Premium keeps everything backed up & synced."
          onSeePremium={() =>
            router.push(
              resolvedMode === 'dev'
                ? '/(dev)/premium'
                : resolvedMode === 'public'
                  ? '/(public)/premium'
                  : '/(auth)/premium'
            )
          }
          onSecondaryAction={() =>
            router.push({
              pathname: manageImportsPath as any,
              params: { returnTo: returnToParam },
            })
          }
          secondaryActionLabel="Manage imports"
          onDismiss={() => {
            void dismissStorageReminder()
          }}
        />
      ) : null}

      {/* Segment content */}
      {segment === 'recipes' ? (
        <>
          {recipeHelperText ? (
            <Text style={styles.helperText}>{recipeHelperText}</Text>
          ) : null}

          {recipeSegment === 'documents' ? (
            <RecipeDocumentsSegment
              bottomPadding={bottomPadding}
              mode={isPublic ? 'public' : resolvedMode}
              sortBy={sort === 'largest' || sort === 'oldest' ? sort : 'recent'}
            />
          ) : recipesQuery.isLoading && !shouldUseLocalData ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={styles.loadingText.color} />
              <Text style={styles.loadingText}>Loading recipes…</Text>
            </View>
          ) : recipeData.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="folder" size={22} color={theme.colors.mutedForeground} />
              </View>
              <Text style={styles.emptyTitle}>No recipes yet</Text>
              <Text style={styles.emptyBody}>
                Add a recipe to start building folders.
              </Text>
              {isPublic ? (
                <Text style={styles.publicHint}>Sign in to sync folders across devices.</Text>
              ) : null}
              <Pressable
                onPress={() =>
                  router.push(
                    isPublic
                      ? '/(public)/recipes/create'
                      : resolvedMode === 'dev'
                        ? '/(dev)/recipes/create'
                        : '/(auth)/recipes/create'
                  )
                }
                style={styles.emptyCta}
                accessibilityRole="button"
                accessibilityLabel="Create your first recipe"
              >
                <Feather name="plus" size={18} color={theme.colors.primaryForeground} />
                <Text style={styles.emptyCtaText}>Create your first recipe</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item) => item.key}
              numColumns={2}
              columnWrapperStyle={styles.row}
              contentContainerStyle={[styles.grid, { paddingBottom: bottomPadding }]}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                if (item.kind === 'new')
                  return <NewCollectionTile onPress={() => setIsCreateFolderOpen(true)} />

                return (
                  <CollectionTile
                    label={item.label}
                    count={item.count}
                    emoji={item.emoji}
                    onPress={() => {
                      if (item.label === 'Uncategorized') {
                        router.push({
                          pathname: isPublic ? '/(public)/collections/[key]' : '/(auth)/collections/[key]',
                          params: {
                            key: 'uncategorized',
                            returnTo: returnToParam,
                          },
                        })
                        return
                      }

                      router.push({
                        pathname: isPublic ? '/(public)/collections/[key]' : '/(auth)/collections/[key]',
                        params: {
                          key: encodeURIComponent(item.label),
                          returnTo: returnToParam,
                        },
                      })
                    }}
                  />
                )
              }}
            />
          )}
          {isPublic && recipeSegment !== 'documents' && recipeData.length > 0 ? (
            <Text style={styles.publicHint}>Sign in to sync folders across devices.</Text>
          ) : null}
        </>
      ) : segment === 'notes' ? (
        <NotesSegment
          bottomPadding={bottomPadding}
          mode={isPublic ? 'public' : resolvedMode}
        />
      ) : (
        <ShoppingSegment
          bottomPadding={bottomPadding}
          mode={isPublic ? 'public' : resolvedMode}
        />
      )}

      <Modal
        visible={isCreateFolderOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreateFolderOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create folder</Text>
            <Text style={styles.modalSubtitle}>Add an emoji and a title.</Text>
            {isPublic ? (
              <Text style={styles.modalHelper}>
                Folders are saved on this device.
              </Text>
            ) : null}

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Emoji</Text>
              <TextInput
                value={newFolderEmoji}
                onChangeText={setNewFolderEmoji}
                placeholder="e.g. 📁"
                placeholderTextColor={styles.modalPlaceholder.color}
                style={styles.modalInput}
                autoCapitalize="none"
                editable={!isCreatingFolder}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Folder name</Text>
              <TextInput
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="e.g. Weeknight dinners"
                placeholderTextColor={styles.modalPlaceholder.color}
                style={styles.modalInput}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleCreateFolder}
                editable={!isCreatingFolder}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsCreateFolderOpen(false)}
                style={[styles.modalButton, styles.modalButtonGhost]}
                disabled={isCreatingFolder}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextGhost]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateFolder}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                disabled={isCreatingFolder}
              >
                <Text style={styles.modalButtonText}>{isCreatingFolder ? 'Creating…' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  screenContent: { flex: 1 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },

  headerText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },

  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.hero,
    lineHeight: theme.lineHeight.hero,
    color: theme.colors.foreground,
  },

  subtitle: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  fab: {
    width: 54,
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    ...theme.shadows.soft,
  },

  helperText: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    maxWidth: 320,
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    marginBottom: theme.spacing.lg,
  },
  successContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  successIcon: {
    color: theme.colors.primary,
  },
  successText: {
    flex: 1,
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  successClose: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCloseIcon: {
    color: theme.colors.foreground,
  },

  grid: {
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
  publicHint: {
    marginTop: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.primary,
  },
  emptyCtaText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.primaryForeground,
  },

  row: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  modalSubtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  modalHelper: {
    marginTop: -theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  modalField: {
    gap: theme.spacing.xs,
  },
  modalLabel: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  modalPlaceholder: {
    color: theme.colors.mutedForeground,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  modalButtonGhost: {
    backgroundColor: theme.colors.creamDark,
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.primaryForeground,
  },
  modalButtonTextGhost: {
    color: theme.colors.foreground,
  },
}))
