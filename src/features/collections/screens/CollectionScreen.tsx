// app/(dev)/(tabs)/collections.tsx (or wherever CollectionsScreen lives)

import { Feather } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
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
import SegmentedTabs from '@/features/collections/components/SegmentedTabs'

// NEW: segment pages
import NotesSegment from '@/features/collections/components/NotesSegment'
import ShoppingSegment from '@/features/collections/components/ShoppingSegment'

import type { CollectionItem, SegmentKey } from '@/features/collections/types'
import {
  buildCollectionsForSegment,
  getCollectionsHelperText,
  pickVariant,
} from '@/features/collections/utils/collections'
import { useCreateFolder } from '@/features/folders/hooks/useCreateFolder'
import { useFoldersList } from '@/features/folders/hooks/useFoldersList'
import { useRecipesList } from '@/features/recipes/hooks/useRecipesList'
import { getSafeReturnTo } from '@/lib/navigation'

export default function CollectionsScreen() {
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: SegmentKey }>()
  const [segment, setSegment] = useState<SegmentKey>('recipes')
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderEmoji, setNewFolderEmoji] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)
  const recipesQuery = useRecipesList({ limit: 200 })
  const foldersQuery = useFoldersList()
  const createFolderMutation = useCreateFolder()
  const returnTo = getSafeReturnTo('/(auth)/(tabs)/collections?segment=recipes')
  const returnToParam = typeof returnTo === 'string' ? returnTo : undefined

  useEffect(() => {
    if (segmentParam === 'notes' || segmentParam === 'recipes' || segmentParam === 'shopping') {
      setSegment(segmentParam)
    }
  }, [segmentParam])

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>()
    let uncategorized = 0
    for (const recipe of recipesQuery.data ?? []) {
      const folders = recipe.folders ?? []
      if (folders.length === 0) {
        uncategorized += 1
        continue
      }
      for (const folder of folders) {
        const key = folder.name.toLowerCase()
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
    return { counts, uncategorized }
  }, [recipesQuery.data])

  const collections = useMemo<CollectionItem[]>(() => {
    const base = buildCollectionsForSegment(segment, recipesQuery.data ?? [])
    if (segment !== 'recipes') return base

    const folderItems =
      foldersQuery.data?.map((folder) => ({
        key: folder.name,
        label: folder.name,
        count: folderCounts.counts.get(folder.name.toLowerCase()) ?? 0,
        kind: 'tag' as const,
        emoji: folder.emoji,
      })) ?? []

    const items = [...folderItems]
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
  }, [segment, recipesQuery.data, foldersQuery.data, folderCounts])

  const fabLabel = segment === 'recipes' ? 'Create folder' : 'Create collection'

  const onPressFab = () => {
    if (segment === 'recipes') {
      setIsCreateFolderOpen(true)
      return
    }
    // TODO: open create collection / add recipe flow
  }

  const handleCreateFolder = async () => {
    const name = newFolderName.trim()
    if (!name) return
    const emoji = newFolderEmoji.trim() || '📁'

    try {
      await createFolderMutation.mutateAsync({ name, emoji })
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
  }

  return (
    <Screen scroll={false} contentStyle={styles.screenContent}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>Everything organized in one place</Text>
        </View>

        <Pressable
          onPress={onPressFab}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel={fabLabel}
        >
          <Feather name="plus" size={22} color={theme.colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Segmented control */}
      <SegmentedTabs value={segment} onChange={setSegment} />

      {/* Segment content */}
      {segment === 'recipes' ? (
        <>
          <Text style={styles.helperText}>{getCollectionsHelperText(segment)}</Text>

          {recipesQuery.isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={styles.loadingText.color} />
              <Text style={styles.loadingText}>Loading recipes…</Text>
            </View>
          ) : (recipesQuery.data ?? []).length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="folder" size={22} color={theme.colors.mutedForeground} />
              </View>
              <Text style={styles.emptyTitle}>No recipes yet</Text>
              <Text style={styles.emptyBody}>
                Add a recipe to start building folders.
              </Text>
              <Pressable
                onPress={() => router.push('/(auth)/(tabs)/add-recipe')}
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
              renderItem={({ item, index }) => {
                if (item.kind === 'new')
                  return <NewCollectionTile onPress={() => setIsCreateFolderOpen(true)} />

                return (
                  <CollectionTile
                    label={item.label}
                    count={item.count}
                    variant={pickVariant(item.label, index)}
                    emoji={item.emoji}
                    onPress={() => {
                      if (item.label === 'Uncategorized') {
                        router.push({
                          pathname: '/(auth)/collections/[key]',
                          params: {
                            key: 'uncategorized',
                            returnTo: returnToParam,
                          },
                        })
                        return
                      }

                      router.push({
                        pathname: '/(auth)/collections/[key]',
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
        </>
      ) : segment === 'notes' ? (
        <NotesSegment bottomPadding={bottomPadding} />
      ) : (
        <ShoppingSegment bottomPadding={bottomPadding} />
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

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Emoji</Text>
              <TextInput
                value={newFolderEmoji}
                onChangeText={setNewFolderEmoji}
                placeholder="e.g. 📁"
                placeholderTextColor={styles.modalPlaceholder.color}
                style={styles.modalInput}
                autoCapitalize="none"
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
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsCreateFolderOpen(false)}
                style={[styles.modalButton, styles.modalButtonGhost]}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextGhost]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateFolder}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonText}>Create</Text>
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
    backgroundColor: theme.colors.sage,
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
  emptyCta: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.sage,
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
    borderRadius: theme.radii.xl,
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
    backgroundColor: theme.colors.sage,
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
