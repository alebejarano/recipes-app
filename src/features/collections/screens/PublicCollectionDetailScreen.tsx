import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
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
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import { useTranslation } from '@/localization'
import {
  getCategorizingFolders,
  isFavoritesFolderName,
  recipeMatchesCollection,
} from '@/features/collections/utils/collections'
import {
  useDeleteLocalFolder,
  useLocalFoldersList,
  useUpdateLocalFolder,
} from '@/features/folders/hooks/useLocalFolders'
import RecipeRow from '@/features/recipes/components/RecipeRow'
import { useLocalRecipesList } from '@/features/recipes/hooks/useLocalRecipes'
import { getSafeReturnTo } from '@/lib/navigation'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

function isUncategorizedKey(key: string) {
  return key === 'uncategorized'
}

function decodeKey(key: string) {
  try {
    return decodeURIComponent(key)
  } catch {
    return key
  }
}

export default function PublicCollectionDetailScreen({
  keyParam,
  returnToParam,
}: {
  keyParam?: string | string[]
  returnToParam?: string
}) {
  const { t } = useTranslation()
  const rawKey = keyParam ?? ''
  const key = decodeKey(Array.isArray(rawKey) ? rawKey[0] : rawKey)
  const safeReturnTo = getSafeReturnTo(returnToParam)
  const returnTo = typeof safeReturnTo === 'string' ? safeReturnTo : undefined
  const showSnackbar = useTransientSnackbarStore((state) => state.show)

  const isUncategorized = isUncategorizedKey(key)
  const title = isUncategorized ? t('collections.uncategorized') : key
  const recipesQuery = useLocalRecipesList()
  const foldersQuery = useLocalFoldersList()
  const updateFolderMutation = useUpdateLocalFolder()
  const deleteFolderMutation = useDeleteLocalFolder()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState(title)
  const [editEmoji, setEditEmoji] = useState('')
  const [isSavingFolder, setIsSavingFolder] = useState(false)

  const recipes = useMemo(() => {
    const list = recipesQuery.data ?? []
    if (isUncategorized) {
      return list.filter((r) => getCategorizingFolders(r.folders).length === 0)
    }

    return list.filter((r) => recipeMatchesCollection(r, title))
  }, [isUncategorized, title, recipesQuery.data])

  const subtitle = `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`
  const folder = foldersQuery.data?.find(
    (item) => item.name.trim().toLowerCase() === title.trim().toLowerCase()
  )
  const folderId = folder?.id
  const currentEmoji = folder?.emoji ?? '📁'

  const openEdit = () => {
    if (isUncategorized) return
    setEditName(folder?.name ?? title)
    setEditEmoji(currentEmoji)
    setIsEditOpen(true)
  }

  const handleSaveFolder = async () => {
    if (!folderId) return
    const name = editName.trim()
    if (!name) return
    const emoji = editEmoji.trim() || '📁'
    setIsSavingFolder(true)
    try {
      const updated = await updateFolderMutation.mutateAsync({
        id: folderId,
        name,
        emoji,
      })
      await Promise.all([recipesQuery.refetch(), foldersQuery.refetch()])
      setIsEditOpen(false)
      showSnackbar(t('collections.snackbar.folderUpdated'))
      if (updated.name !== title) {
        router.replace({
          pathname: '/(public)/collections/[key]',
          params: {
            key: encodeURIComponent(updated.name),
            returnTo: returnTo ?? '/(public)/(tabs)/collections?segment=recipes',
          },
        })
      }
    } catch {
      // handled by query state
    } finally {
      setIsSavingFolder(false)
    }
  }

  const handleDeleteFolder = () => {
    if (!folderId) return
    const isFavoritesFolder = isFavoritesFolderName(title)
    Alert.alert(
      t('collections.detail.deleteAlertTitle'),
      isFavoritesFolder
        ? t('collections.detail.deleteFavoritesBody')
        : t('collections.detail.deleteBody'),
      [
        { text: t('collections.detail.cancel'), style: 'cancel' },
        {
          text: t('collections.detail.deleteFolder'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFolderMutation.mutateAsync(folderId)
              showSnackbar(t('collections.snackbar.folderDeleted'))
              if (safeReturnTo) {
                router.replace(safeReturnTo)
              } else {
                router.back()
              }
            } catch {
              // handled by query state
            }
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Button
          variant="ghost"
          size="md"
          onPress={() => {
            if (safeReturnTo) {
              router.replace(safeReturnTo)
            } else {
              router.back()
            }
          }}
          style={styles.backButton}
          textStyle={styles.backText}
          icon={<Feather name="arrow-left" size={16} style={styles.backIcon} />}
        >
          {t('collections.detail.back')}
        </Button>

        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          {!isUncategorized && folderId ? (
            <Pressable
              onPress={openEdit}
              accessibilityRole="button"
              accessibilityLabel={t('collections.detail.folderOptionsA11y')}
              style={styles.moreButton}
            >
              <Feather name="more-vertical" size={18} style={styles.moreIcon} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {recipesQuery.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>{t('collections.detail.loading')}</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather
              name={isUncategorized ? 'inbox' : 'folder'}
              size={24}
              color={theme.colors.mutedForeground}
            />
          </View>

          <Text style={styles.emptyTitle}>{t('collections.detail.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {isUncategorized
              ? t('collections.detail.uncategorizedBody')
              : t('collections.detail.folderBody')}
          </Text>

          <View style={styles.emptyCta}>
            <Button
              size="lg"
              onPress={() =>
                router.push({
                  pathname: '/(public)/recipes/create',
                  params: !isUncategorized ? { folder: title, entry: 'scratch' } : undefined,
                })
              }
            >
              {t('collections.detail.addRecipe')}
            </Button>
          </View>

          <Text style={styles.publicHint}>{t('collections.detail.publicHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RecipeRow
              title={item.title}
              folders={item.folders?.map((folder) => folder.name)}
              emoji={item.emoji}
              imageUrl={item.imageUrl}
              onPress={() => {
                router.push({
                  pathname: '/(public)/recipes/[id]',
                  params: {
                    id: item.id,
                    returnTo: returnTo ?? '/(public)/(tabs)/collections?segment=recipes',
                  },
                })
              }}
            />
          )}
        />
      )}

      <Modal
        visible={isEditOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('collections.detail.editTitle')}</Text>
            <Text style={styles.modalSubtitle}>{t('collections.detail.editSubtitle')}</Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('collections.detail.emojiLabel')}</Text>
              <TextInput
                value={editEmoji}
                onChangeText={setEditEmoji}
                placeholder={t('collections.detail.emojiPlaceholder')}
                placeholderTextColor={styles.modalPlaceholder.color}
                style={styles.modalInput}
                autoCapitalize="none"
                editable={!isSavingFolder}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>{t('collections.detail.folderNameLabel')}</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder={t('collections.detail.folderNamePlaceholder')}
                placeholderTextColor={styles.modalPlaceholder.color}
                style={styles.modalInput}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSaveFolder}
                editable={!isSavingFolder}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsEditOpen(false)}
                style={[styles.modalButton, styles.modalButtonGhost]}
                disabled={isSavingFolder}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextGhost]}>
                  {t('collections.detail.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSaveFolder}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                disabled={isSavingFolder}
              >
                <Text style={styles.modalButtonText}>
                  {isSavingFolder ? t('collections.detail.updating') : t('collections.detail.save')}
                </Text>
              </Pressable>
            </View>

            <Pressable onPress={handleDeleteFolder} style={styles.deleteButton}>
              <Text style={styles.deleteText}>{t('collections.detail.deleteFolder')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },

  header: {
    marginBottom: theme.spacing.lg,
  },

  backButton: {
    width: 'auto',
    minHeight: 44,
    paddingHorizontal: theme.spacing.sm,
    alignSelf: 'flex-start',
    marginLeft: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },

  backText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
  },

  backIcon: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.lg,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  titleBlock: {
    gap: theme.spacing.xs,
    flex: 1,
  },

  title: {
    ...theme.textVariants.hero,
    color: theme.colors.foreground,
  },

  subtitle: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  moreIcon: {
    color: theme.colors.mutedForeground,
  },

  list: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },

  emptyTitle: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },

  emptySubtitle: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  emptyCta: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },

  publicHint: {
    marginTop: theme.spacing.sm,
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
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
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  modalSubtitle: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  modalField: {
    gap: theme.spacing.xs,
  },
  modalLabel: {
    ...theme.textVariants.labelSmall,
    color: theme.colors.foreground,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.textVariants.body,
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
    ...theme.textVariants.label,
    color: theme.colors.primaryForeground,
  },
  modalButtonTextGhost: {
    color: theme.colors.foreground,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.destructive,
    backgroundColor: theme.colors.destructive,
    marginTop: theme.spacing.sm,
  },
  deleteText: {
    ...theme.textVariants.label,
    color: theme.colors.destructiveForeground,
  },
}))
