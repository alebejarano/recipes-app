import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    ActivityIndicator,
    Keyboard,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button from '@/components/Button'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

import type { ShoppingItem } from '../storage/shoppingListItemsStorage'
import { getShoppingListItems, setShoppingListItems } from '../storage/shoppingListItemsStorage'

const QUICK_ADD_ITEMS = [
  'Milk',
  'Eggs',
  'Bread',
  'Butter',
  'Cheese',
  'Chicken',
  'Rice',
  'Onions',
]

export default function ShoppingListScreen() {
  const inputRef = useRef<TextInput | null>(null)

  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newItem, setNewItem] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  // Load persisted items (if any)
  useEffect(() => {
    let mounted = true

    ;(async () => {
      const stored = await getShoppingListItems()
      if (mounted) {
        setItems(stored)
        setIsBootstrapping(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const normalizedNames = useMemo(() => {
    return new Set(items.map((i) => i.name.trim().toLowerCase()))
  }, [items])

  const canAddTyped = newItem.trim().length > 0

  const addItem = useCallback(
    (name?: string) => {
      const raw = (name ?? newItem).trim()
      if (!raw) return

      const normalized = raw.toLowerCase()
      if (normalizedNames.has(normalized)) {
        setNewItem('')
        return
      }

      const next: ShoppingItem = {
        id: String(Date.now()),
        name: raw,
        checked: false,
      }

      setItems((prev) => [...prev, next])
      setNewItem('')

      // Keep the UX snappy: dismiss keyboard after adding via the "+" button
      Keyboard.dismiss()
    },
    [newItem, normalizedNames],
  )

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const handleSave = useCallback(async () => {
    if (items.length === 0) return

    setIsSaving(true)

    // Simulate save (matches your web code); replace later with real persistence/api
    await new Promise((resolve) => setTimeout(resolve, 900))

    // Persist locally so the list survives reloads
    await setShoppingListItems(items)

    setIsSaving(false)
    setIsComplete(true)

    // Brief success display then keep user on the list (or router.back() if you prefer)
    setTimeout(() => {
      setIsComplete(false)
    }, 1000)
  }, [items])

  // ---------- COMPLETE STATE (overlay) ----------
  if (isComplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlayCenter}>
          <View style={styles.completeCircle}>
            <Feather name="shopping-cart" size={34} style={styles.completeIcon} />
          </View>

          <Text style={styles.completeTitle}>List Created!</Text>
          <Text style={styles.completeSubtitle}>{items.length} items added to your list</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ---------- SAVING STATE (overlay) ----------
  if (isSaving) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlayCenter}>
          <ActivityIndicator size="large" color={styles.spinner.color} />
          <Text style={styles.savingTitle}>Creating list...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ---------- FORM STATE ----------
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconPressed]}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.foreground} />
          </Pressable>

          <Text style={styles.headerTitle}>Shopping List</Text>

          {/* Spacer to balance header */}
          <View style={styles.headerRightSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Add Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Items</Text>

            <View style={styles.addRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={inputRef}
                  value={newItem}
                  onChangeText={setNewItem}
                  placeholder="Type an item..."
                  placeholderTextColor={styles.placeholder.color}
                  returnKeyType="done"
                  onSubmitEditing={() => addItem()}
                  style={styles.input}
                />
              </View>

              <Pressable
                onPress={() => addItem()}
                disabled={!canAddTyped}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canAddTyped }}
                style={({ pressed }) => [
                  styles.addButton,
                  !canAddTyped && styles.addButtonDisabled,
                  pressed && canAddTyped && styles.addButtonPressed,
                ]}
              >
                <Feather name="plus" size={20} color={theme.colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* Quick add */}
          <View style={styles.section}>
            <Text style={styles.sectionLabelMuted}>Quick add</Text>

            <View style={styles.quickWrap}>
              {QUICK_ADD_ITEMS.map((label) => {
                const isAdded = normalizedNames.has(label.toLowerCase())

                return (
                  <Pressable
                    key={label}
                    onPress={() => !isAdded && addItem(label)}
                    disabled={isAdded}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isAdded }}
                    style={({ pressed }) => [
                      styles.quickChip,
                      isAdded && styles.quickChipAdded,
                      pressed && !isAdded && styles.quickChipPressed,
                    ]}
                  >
                    {isAdded ? (
                      <Feather name="check" size={14} color={theme.colors.sage} />
                    ) : null}
                    <Text style={[styles.quickChipText, isAdded && styles.quickChipTextAdded]}>
                      {label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Your List */}
          <View style={styles.section}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.sectionTitle}>Your List</Text>
              {items.length > 0 && <Text style={styles.countText}>{items.length} items</Text>}
            </View>

            {isBootstrapping ? (
              <View style={styles.emptyState}>
                <ActivityIndicator />
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="shopping-cart" size={36} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>Add items to get started</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {items.map((item) => (
                  <View key={item.id} style={styles.listRow}>
                    <Text style={styles.listRowText} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <Pressable
                      onPress={() => removeItem(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.name}`}
                      style={({ pressed }) => [
                        styles.removeButton,
                        pressed && styles.removeButtonPressed,
                      ]}
                    >
                      <Feather name="x" size={16} color={theme.colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            size="xl"
            variant="primary"
            disabled={items.length === 0}
            onPress={handleSave}
          >
            Create List ({items.length} items)
          </Button>
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
  },

  header: {
    height: 56,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },

  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },

  headerIconPressed: {
    backgroundColor: theme.colors.muted,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },

  headerRightSpacer: {
    width: 40,
  },

  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xl,
  },

  section: {
    gap: theme.spacing.sm,
  },

  sectionTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },

  sectionLabelMuted: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },

  inputWrapper: {
    flex: 1,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },

  input: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },

  placeholder: {
    color: theme.colors.mutedForeground,
  },

  addButton: {
    width: 52,
    height: 52,
    borderRadius: theme.radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  addButtonDisabled: {
    opacity: 0.6,
  },

  addButtonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },

  quickWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },

  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  quickChipPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },

  quickChipAdded: {
    backgroundColor: theme.colors.sageLight,
    borderColor: theme.colors.sageLight,
  },

  quickChipText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  quickChipTextAdded: {
    color: theme.colors.foreground,
  },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  countText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.xs,
    color: theme.colors.mutedForeground,
  },

  emptyState: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },

  emptyIcon: {
    color: theme.colors.mutedForeground,
    opacity: 0.4,
  },

  emptyText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  list: {
    gap: theme.spacing.sm,
  },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  listRowText: {
    flex: 1,
    marginRight: theme.spacing.md,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeButtonPressed: {
    backgroundColor: theme.colors.muted,
  },

  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },

  // Overlays
  overlayCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  spinner: {
    color: theme.colors.primary,
  },

  savingTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },

  completeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completeIcon: {
    color: theme.colors.sage,
  },

  completeTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.foreground,
  },

  completeSubtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
}))
