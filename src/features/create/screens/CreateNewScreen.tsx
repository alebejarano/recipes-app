import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { createThemedStyles } from '@/styles/createStyles'

import { useShoppingListStatus } from '@/features/shopping-list/hooks/useShoppingListStatus'
import { ensureShoppingList } from '@/features/shopping-list/storage/shoppingListStorage'
import CreateActionCard from '../components/CreateActionCard'

export default function CreateNewScreen() {
  const { isLoading, hasShoppingList, refresh } = useShoppingListStatus()
  const [isCreatingList, setIsCreatingList] = useState(false)

  const handleCreateRecipe = useCallback(() => {
    console.log('testing in dev')
    router.push({
    pathname: '/(dev)/recipes/create',
    params: { variant: 'app' },
    })
  }, [])

  const handleCreateNote = useCallback(() => {
    router.push('/(dev)/notes/create')
  }, [])

  const handleShoppingList = useCallback(async () => {
    if (hasShoppingList) return

    setIsCreatingList(true)
    try {
      await ensureShoppingList()
      await refresh()
      router.push('/(dev)/shopping-list')
    } finally {
      setIsCreatingList(false)
    }
  }, [hasShoppingList, refresh])

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
            tone="sage"
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
            title="Shopping List"
            subtitle={hasShoppingList ? 'Already created' : 'Plan your grocery run'}
            tone={hasShoppingList ? 'neutral' : 'neutral'}
            disabled={hasShoppingList || isLoading || isCreatingList}
            onPress={handleShoppingList}
            icon={
              isCreatingList ? (
                <ActivityIndicator />
              ) : hasShoppingList ? (
                <Feather name="check" size={22} color={styles.icon.color} />
              ) : (
                <Feather name="shopping-cart" size={22} color={styles.icon.color} />
              )
            }
          />
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
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
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeIcon: {
    color: theme.colors.mutedForeground,
  },

  cards: {
    gap: theme.spacing.lg,
  },

  icon: {
    color: theme.colors.foreground,
  },
}))
