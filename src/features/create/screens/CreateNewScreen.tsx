import { Feather } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { useLargeScreenLayout } from '@/hooks/useLargeScreenLayout'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

import {
  ensureShoppingList,
  getShoppingList,
} from '@/features/shopping-list/storage/shoppingListStorage'
import CreateActionCard from '../components/CreateActionCard'

type CreateNewScreenProps = {
  group?: 'auth' | 'public'
}

export default function CreateNewScreen({ group = 'auth' }: CreateNewScreenProps) {
  const largeScreen = useLargeScreenLayout({ maxContentWidth: layout.formContentMaxWidth })
  const [isLoading, setIsLoading] = useState(true)
  const [hasShoppingList, setHasShoppingList] = useState(false)
  const [isCreatingList, setIsCreatingList] = useState(false)

  const refreshShoppingListStatus = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await getShoppingList()
      setHasShoppingList(Boolean(list))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Keep status in sync when navigating back to this screen
  useFocusEffect(
    useCallback(() => {
      refreshShoppingListStatus()
    }, [refreshShoppingListStatus])
  )

  const handleCreateRecipe = useCallback(() => {
    if (group === 'public') {
      router.push('/(public)/recipes/create')
      return
    }

    router.push({
      pathname: '/(auth)/recipes/create',
      params: { variant: 'app' },
    })
  }, [group])

  const handleCreateNote = useCallback(() => {
    router.push(
      group === 'public'
        ? '/(public)/notes/create'
        : '/(auth)/notes/create'
    )
  }, [group])

  const handleShoppingList = useCallback(async () => {
    if (hasShoppingList) {
      router.push(
        group === 'public'
          ? '/(public)/shopping-list'
          : '/(auth)/shopping-list'
      )
      return
    }

    setIsCreatingList(true)
    try {
      await ensureShoppingList()
      await refreshShoppingListStatus()
      router.push(
        group === 'public'
          ? '/(public)/shopping-list'
          : '/(auth)/shopping-list'
      )
    } finally {
      setIsCreatingList(false)
    }
  }, [group, hasShoppingList, refreshShoppingListStatus])

  const shoppingSubtitle = useMemo(() => {
    if (isLoading) return 'Checking…'
    return hasShoppingList ? 'Tap to view or edit.' : 'Plan your grocery run'
  }, [hasShoppingList, isLoading])

  const shoppingTitle = useMemo(() => {
    return hasShoppingList ? 'Shopping List already created' : 'Shopping List'
  }, [hasShoppingList])

  const shoppingDisabled = isLoading || isCreatingList

  const shoppingIcon = useMemo(() => {
    if (isCreatingList) return <ActivityIndicator />
    if (hasShoppingList) return <Feather name="check" size={22} color={styles.icon.color} />
    return <Feather name="shopping-cart" size={22} color={styles.icon.color} />
  }, [hasShoppingList, isCreatingList])

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, largeScreen.pagePaddingStyle]}>
        <View style={largeScreen.contentWidthStyle}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Create New</Text>

          <Button
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            style={styles.closeButton}
            icon={<Feather name="x" size={18} style={styles.closeIcon} />}
          >
            {/* no label */}
          </Button>
        </View>

        <View style={styles.cards}>
          <CreateActionCard
            title="Add Recipe"
            subtitle="Save your favorite dishes"
            tone="primary"
            onPress={handleCreateRecipe}
            icon={<Feather name="coffee" size={22} color={styles.icon.color} />}
          />

          <CreateActionCard
            title="Create Note"
            subtitle="Jot down cooking tips & ideas"
            tone="peach"
            onPress={handleCreateNote}
            icon={<Feather name="file-text" size={22} color={styles.icon.color} />}
          />

          <CreateActionCard
            title={shoppingTitle}
            subtitle={shoppingSubtitle}
            tone="neutral"
            disabled={shoppingDisabled}
            onPress={handleShoppingList}
            icon={shoppingIcon}
          />
        </View>
        </View>
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
    paddingHorizontal: layout.screenPadding,
    paddingTop: layout.screenPadding,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },

  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },

  closeButton: {
    paddingHorizontal: 0,
    width: 44,
    height: 44,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeIcon: {
    color: theme.colors.mutedForeground,
  },

  cards: {
    gap: layout.sectionGap,
  },

  icon: {
    color: theme.colors.foreground,
  },
}))
