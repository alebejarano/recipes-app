import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'

import { formatRelativeDay } from '@/features/home/utils/homeFormatters'
import { useRecipeDocuments } from '@/features/recipes/hooks/useRecipeDocuments'
import { getSafeReturnTo } from '@/lib/navigation'
import { getUserFacingErrorMessage } from '@/lib/userFacingError'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

export default function RecipeDocumentsSegment({
  bottomPadding,
  mode = 'auth',
  sortBy = 'recent',
}: {
  bottomPadding: number
  mode?: 'auth' | 'public'
  sortBy?: 'recent' | 'largest' | 'oldest'
}) {
  const { t } = useTranslation()
  const isPublic = mode === 'public'
  const createPath = isPublic ? '/(public)/recipes/create' : '/(auth)/recipes/create'
  const documentDetailPath = isPublic ? '/(public)/recipes/documents/[id]' : '/(auth)/recipes/documents/[id]'
  const docsQuery = useRecipeDocuments(mode)
  const returnTo = getSafeReturnTo(
    mode === 'public'
        ? '/(public)/(tabs)/collections?segment=recipes&recipesSegment=documents'
        : '/(auth)/(tabs)/collections?segment=recipes&recipesSegment=documents'
  )
  const returnToParam = typeof returnTo === 'string' ? returnTo : undefined

  const data = useMemo(
    () =>
      (docsQuery.data ?? []).map((doc) => ({
        id: doc.id,
        title: doc.title?.trim() || t('collections.documentsSegment.fallbackTitle'),
        createdAt: doc.createdAt,
        relativeDate: formatRelativeDay(doc.createdAt),
        fileSize: doc.fileSize,
      })),
    [docsQuery.data, t]
  )
  const sortedData = useMemo(() => {
    const next = [...data]
    if (sortBy === 'largest') {
      next.sort((a, b) => b.fileSize - a.fileSize)
      return next
    }
    if (sortBy === 'oldest') {
      next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      return next
    }
    next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return next
  }, [data, sortBy])

  return (
    <View style={styles.wrap}>
      <Text style={styles.helper}>{t('collections.documentsSegment.helper')}</Text>

      {docsQuery.isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={styles.loadingText.color} />
          <Text style={styles.loadingText}>{t('collections.documentsSegment.loading')}</Text>
        </View>
      ) : docsQuery.isError ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="alert-circle" size={22} color={theme.colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>{t('collections.documentsSegment.loadFailedTitle')}</Text>
          <Text style={styles.emptyBody}>
            {getUserFacingErrorMessage(docsQuery.error, t('collections.documentsSegment.loadFailedBody'))}
          </Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Feather name="file-text" size={22} color={theme.colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>{t('collections.documentsSegment.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('collections.documentsSegment.emptyBody')}</Text>
          <Pressable
            onPress={() =>
              router.push({
                pathname: createPath,
                params: { entry: 'pdf', returnTo: returnToParam },
              })
            }
            style={styles.emptyCta}
            accessibilityRole="button"
            accessibilityLabel={t('collections.documentsSegment.importA11y')}
          >
            <Feather name="upload" size={18} color={theme.colors.primaryForeground} />
            <Text style={styles.emptyCtaText}>{t('collections.documentsSegment.import')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={sortedData}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          onEndReached={() => {
            if (docsQuery.hasNextPage && !docsQuery.isFetchingNextPage) {
              void docsQuery.fetchNextPage()
            }
          }}
          onEndReachedThreshold={0.4}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: documentDetailPath,
                  params: { id: item.id, returnTo: returnToParam },
                })
              }
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel={t('collections.documentsSegment.openA11y', { title: item.title })}
            >
              <View style={styles.iconWrap}>
                <Feather name="file-text" size={18} color={theme.colors.mutedForeground} />
              </View>

              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowDate}>{item.relativeDate}</Text>
              </View>
            </Pressable>
          )}
          ListFooterComponent={
            <View>
              {docsQuery.isFetchingNextPage ? (
                <View style={styles.loadingMoreState}>
                  <ActivityIndicator size="small" color={styles.loadingText.color} />
                  <Text style={styles.loadingText}>{t('collections.documentsSegment.loadingMore')}</Text>
                </View>
              ) : null}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: createPath,
                    params: { entry: 'pdf', returnTo: returnToParam },
                  })
                }
                style={styles.newItem}
                accessibilityRole="button"
                accessibilityLabel={t('collections.documentsSegment.importA11y')}
              >
                <Feather name="upload" size={18} color={theme.colors.mutedForeground} />
                <Text style={styles.newItemText}>{t('collections.documentsSegment.import')}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  wrap: { flex: 1 },

  helper: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    maxWidth: 320,
  },

  listContent: { paddingTop: 0 },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  loadingMoreState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.lg,
  },
  loadingText: {
    ...theme.textVariants.label,
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
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },
  emptyBody: {
    ...theme.textVariants.body,
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
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.primary,
  },
  emptyCtaText: {
    ...theme.textVariants.label,
    color: theme.colors.primaryForeground,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },

  rowText: { flex: 1 },

  rowTitle: {
    ...theme.textVariants.subtitle,
    color: theme.colors.foreground,
  },

  rowDate: {
    marginTop: theme.spacing.xxs,
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },

  newItem: {
    marginTop: theme.spacing.lg,
    height: 64,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },

  newItemText: {
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
  },
}))
