import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'
import { theme } from '@/styles/theme'

import { useShoppingListStore } from '@/features/shopping-list/store/useShoppingListStore'

const QUICK_ADD_ITEM_KEYS = ['milk', 'eggs', 'bread', 'butter', 'cheese', 'chicken', 'rice', 'onions'] as const
const QUICK_ADD_HISTORY_PREFIX = 'quick-add:'

export default function ShoppingListScreen() {
  const { t } = useTranslation()
  const inputRef = useRef<TextInput | null>(null)
  const [newItem, setNewItem] = useState('')

  // ----- store -----
  const hydrate = useShoppingListStore((s) => s.hydrate)
  const isHydrated = useShoppingListStore((s) => s.isHydrated)
  const isHydrating = useShoppingListStore((s) => s.isHydrating)

  const isCreating = useShoppingListStore((s) => s.isCreating)
  const isComplete = useShoppingListStore((s) => s.isComplete)

  const items = useShoppingListStore((s) => s.items)
  const itemHistory = useShoppingListStore((s) => s.itemHistory)
  const normalizedNames = useShoppingListStore((s) => s.normalizedNames)

  const addItem = useShoppingListStore((s) => s.addItem)
  const removeItem = useShoppingListStore((s) => s.removeItem)
  const toggleItemByName = useShoppingListStore((s) => s.toggleItemByName)
  const setChecked = useShoppingListStore((s) => s.setChecked)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const canAddTyped = newItem.trim().length > 0

  const quickAddItems = useMemo(() => {
    const defaultItems = QUICK_ADD_ITEM_KEYS.map((key) => ({
      key: `${QUICK_ADD_HISTORY_PREFIX}${key}`,
      label: t(`shoppingList.quickAddItems.${key}`),
    }))
    const defaultItemsByKey = new Map(defaultItems.map((item) => [item.key, item]))
    const personalizedItems = itemHistory.map((item) =>
      defaultItemsByKey.get(item.key) ?? { key: item.key, label: item.name },
    )
    const seenKeys = new Set(personalizedItems.map((item) => item.key))
    const seenLabels = new Set(personalizedItems.map((item) => item.label.toLowerCase()))

    return [
      ...personalizedItems,
      ...defaultItems.filter((item) => !seenKeys.has(item.key) && !seenLabels.has(item.label.toLowerCase())),
    ].slice(0, 8)
  }, [itemHistory, t])

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

          <Text style={styles.completeTitle}>{t('shoppingList.updatedTitle')}</Text>
          <Text style={styles.completeSubtitle}>{t('shoppingList.updatedSubtitle', { count: items.length })}</Text>
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
          <Text style={styles.savingTitle}>{t('shoppingList.creating')}</Text>
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
            accessibilityLabel={t('shoppingList.backA11y')}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.headerIconPressed]}
          >
            <Feather name="arrow-left" size={20} color={theme.colors.foreground} />
          </Pressable>

          <Text style={styles.headerTitle}>{t('shoppingList.title')}</Text>

          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Add Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('shoppingList.addItems')}</Text>

            <View style={styles.addRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={inputRef}
                  value={newItem}
                  onChangeText={setNewItem}
                  placeholder={t('shoppingList.addPlaceholder')}
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
            <Text style={styles.sectionLabelMuted}>{t('shoppingList.quickAddTitle')}</Text>

            <View style={styles.quickWrap}>
              {quickAddItems.map(({ key, label }) => {
                const isAdded = normalizedNames.has(label.toLowerCase())

                return (
                  <Pressable
                    key={key}
                    onPress={() => toggleItemByName(label, key)}
                    accessibilityRole="button"
                    accessibilityLabel={isAdded ? t('shoppingList.removeA11y', { name: label }) : t('shoppingList.addA11y', { name: label })}
                    style={({ pressed }) => [
                      styles.quickChip,
                      isAdded && styles.quickChipAdded,
                      pressed && styles.quickChipPressed,
                    ]}
                  >
                    {isAdded ? <Feather name="check" size={14} color={theme.colors.primaryDark} /> : null}
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
              <Text style={styles.sectionTitle}>{t('shoppingList.yourList')}</Text>
              {items.length > 0 && <Text style={styles.countText}>{t('shoppingList.itemsCount', { count: items.length })}</Text>}
            </View>

            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator />
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="shopping-cart" size={36} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>{t('shoppingList.empty')}</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {items.map((item) => (
                  <View key={item.id} style={styles.listRow}>
                    {/* NEW: check toggle */}
                    <Pressable
                      onPress={() => setChecked(item.id, !item.checked)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        item.checked
                          ? t('shoppingList.uncheckA11y', { name: item.name })
                          : t('shoppingList.checkA11y', { name: item.name })
                      }
                      style={({ pressed }) => [styles.checkButton, pressed && styles.checkButtonPressed]}
                      hitSlop={8}
                    >
                      {item.checked ? (
                        <Feather name="check-circle" size={18} color={theme.colors.primary} />
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
            {t('shoppingList.done')}
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
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
  },

  headerIconPressed: { backgroundColor: theme.colors.muted },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...theme.textVariants.emphasis,
    color: theme.colors.foreground,
  },

  headerRightSpacer: { width: 44 },

  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: layout.screenPadding,
    paddingBottom: theme.spacing.xl,
    gap: layout.sectionGap,
  },

  section: { gap: layout.listGap },

  sectionTitle: {
    ...theme.textVariants.label,
    color: theme.colors.foreground,
  },

  sectionLabelMuted: {
    ...theme.textVariants.label,
    color: theme.colors.mutedForeground,
  },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: layout.cardGap },

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
    ...theme.textVariants.body,
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

  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: layout.listGap },

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

  quickChipAdded: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primarySoft },

  quickChipText: {
    ...theme.textVariants.labelSmall,
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
    gap: layout.cardGap,
  },

  emptyIcon: { color: theme.colors.mutedForeground, opacity: 0.4 },

  emptyText: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },

  list: { gap: layout.listGap },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radii.lg,
    paddingHorizontal: layout.cardPadding,
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
    ...theme.textVariants.caption,
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
    ...theme.textVariants.label,
    color: theme.colors.foreground,
  },

  completeCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completeIcon: { color: theme.colors.primary },

  completeTitle: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },

  completeSubtitle: {
    ...theme.textVariants.caption,
    color: theme.colors.mutedForeground,
  },
}))
