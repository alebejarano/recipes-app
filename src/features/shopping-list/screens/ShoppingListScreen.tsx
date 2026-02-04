import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
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

import { useShoppingListStore } from '@/features/shopping-list/store/useShoppingListStore'

const QUICK_ADD_ITEMS = ['Milk', 'Eggs', 'Bread', 'Butter', 'Cheese', 'Chicken', 'Rice', 'Onions']

export default function ShoppingListScreen() {
  const inputRef = useRef<TextInput | null>(null)
  const [newItem, setNewItem] = useState('')

  // ----- store -----
  const hydrate = useShoppingListStore((s) => s.hydrate)
  const isHydrated = useShoppingListStore((s) => s.isHydrated)
  const isHydrating = useShoppingListStore((s) => s.isHydrating)

  const isCreating = useShoppingListStore((s) => s.isCreating)
  const isComplete = useShoppingListStore((s) => s.isComplete)

  const items = useShoppingListStore((s) => s.items)
  const normalizedNames = useShoppingListStore((s) => s.normalizedNames)

  const addItem = useShoppingListStore((s) => s.addItem)
  const removeItem = useShoppingListStore((s) => s.removeItem)
  const toggleItemByName = useShoppingListStore((s) => s.toggleItemByName)
  const setChecked = useShoppingListStore((s) => s.setChecked)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const canAddTyped = newItem.trim().length > 0

  const onAdd = async (name?: string) => {
    const raw = (name ?? newItem).trim()
    if (!raw) return

    await addItem(raw)
    setNewItem('')
    Keyboard.dismiss()
  }

  const onDone = () => {
    // If you want a success overlay before leaving:
    // setCompleteTemporarily()
    router.back()
  }

  // ---------- COMPLETE STATE (overlay) ----------
  if (isComplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlayCenter}>
          <View style={styles.completeCircle}>
            <Feather name="shopping-cart" size={34} style={styles.completeIcon} />
          </View>

          <Text style={styles.completeTitle}>List Updated!</Text>
          <Text style={styles.completeSubtitle}>{items.length} items in your list</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ---------- CREATING STATE (overlay) ----------
  if (isCreating) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlayCenter}>
          <ActivityIndicator size="large" color={styles.spinner.color} />
          <Text style={styles.savingTitle}>Creating list...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const isLoading = !isHydrated || isHydrating

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

          <View style={styles.headerRightSpacer} />
        </View>

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
                  onSubmitEditing={() => onAdd()}
                  style={styles.input}
                />
              </View>

              <Pressable
                onPress={() => onAdd()}
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
                    onPress={() => toggleItemByName(label)}
                    accessibilityRole="button"
                    accessibilityLabel={isAdded ? `Remove ${label}` : `Add ${label}`}
                    style={({ pressed }) => [
                      styles.quickChip,
                      isAdded && styles.quickChipAdded,
                      pressed && styles.quickChipPressed,
                    ]}
                  >
                    {isAdded ? <Feather name="check" size={14} color={theme.colors.sage} /> : null}
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

            {isLoading ? (
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
                    {/* NEW: check toggle */}
                    <Pressable
                      onPress={() => setChecked(item.id, !item.checked)}
                      accessibilityRole="button"
                      accessibilityLabel={item.checked ? `Uncheck ${item.name}` : `Check ${item.name}`}
                      style={({ pressed }) => [styles.checkButton, pressed && styles.checkButtonPressed]}
                      hitSlop={8}
                    >
                      {item.checked ? (
                        <Feather name="check-circle" size={18} color={theme.colors.sage} />
                      ) : (
                        <Feather name="circle" size={18} color={theme.colors.mutedForeground} />
                      )}
                    </Pressable>

                    <Text
                      style={[styles.listRowText, item.checked && styles.listRowTextChecked]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <Pressable
                      onPress={() => removeItem(item.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.name}`}
                      style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                      hitSlop={8}
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
          <Button size="xl" variant="primary" disabled={!isHydrated} onPress={onDone}>
            Done
          </Button>

          {/* Optional: if you want a manual “save/confirm” UX still:
          <Button
            size="xl"
            variant="primary"
            disabled={items.length === 0 || isLoading}
            onPress={() => setCompleteTemporarily()}
          >
            Save ({items.length})
          </Button>
          */}
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

  container: { flex: 1 },

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

  headerIconPressed: { backgroundColor: theme.colors.muted },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },

  headerRightSpacer: { width: 40 },

  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.xl,
  },

  section: { gap: theme.spacing.sm },

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

  addRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },

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

  placeholder: { color: theme.colors.mutedForeground },

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

  addButtonDisabled: { opacity: 0.6 },

  addButtonPressed: { opacity: 0.95, transform: [{ scale: 0.99 }] },

  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },

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

  quickChipPressed: { opacity: 0.95, transform: [{ scale: 0.99 }] },

  quickChipAdded: { backgroundColor: theme.colors.sageLight, borderColor: theme.colors.sageLight },

  quickChipText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  quickChipTextAdded: { color: theme.colors.foreground },

  listHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

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

  emptyIcon: { color: theme.colors.mutedForeground, opacity: 0.4 },

  emptyText: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  list: { gap: theme.spacing.sm },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // NEW
  checkButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },

  // NEW
  checkButtonPressed: {
    backgroundColor: theme.colors.muted,
  },

  listRowText: {
    flex: 1,
    marginRight: theme.spacing.md,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.foreground,
  },

  // NEW
  listRowTextChecked: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  removeButtonPressed: { backgroundColor: theme.colors.muted },

  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },

  overlayCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  spinner: { color: theme.colors.primary },

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

  completeIcon: { color: theme.colors.sage },

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
