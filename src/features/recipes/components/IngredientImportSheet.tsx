import { Feather } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'

import Button from '@/components/Button'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type IngredientImportSheetProps = {
  visible: boolean
  ingredients: string[]
  isSubmitting?: boolean
  onClose: () => void
  onAddAll: () => void
  onAddSelected: (ingredients: string[]) => void
}

export default function IngredientImportSheet({
  visible,
  ingredients,
  isSubmitting = false,
  onClose,
  onAddAll,
  onAddSelected,
}: IngredientImportSheetProps) {
  const { t } = useTranslation()
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([])

  useEffect(() => {
    if (visible) {
      setSelectedIndexes([])
    }
  }, [visible])

  const selectedIngredients = useMemo(
    () => selectedIndexes.map((index) => ingredients[index]).filter(Boolean),
    [ingredients, selectedIndexes]
  )

  const toggleIngredient = (index: number) => {
    setSelectedIndexes((prev) => (
      prev.includes(index) ? prev.filter((value) => value !== index) : [...prev, index]
    ))
  }

  const hasIngredients = ingredients.length > 0
  const canAddSelected = hasIngredients && selectedIngredients.length > 0 && !isSubmitting
  const canAddAll = hasIngredients && !isSubmitting

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('recipes.ingredientImportSheet.title')}</Text>
          <Text style={styles.subtitle}>{t('recipes.ingredientImportSheet.subtitle')}</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {hasIngredients ? (
              ingredients.map((ingredient, index) => {
                const selected = selectedIndexes.includes(index)
                return (
                  <Pressable
                    key={`${ingredient}-${index}`}
                    onPress={() => toggleIngredient(index)}
                    accessibilityRole="button"
                    accessibilityLabel={selected
                      ? t('recipes.ingredientImportSheet.unselectA11y', { ingredient })
                      : t('recipes.ingredientImportSheet.selectA11y', { ingredient })}
                    style={({ pressed }) => [
                      styles.row,
                      selected && styles.rowSelected,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <Feather
                      name={selected ? 'check-circle' : 'circle'}
                      size={18}
                      color={selected ? styles.iconSelected.color : styles.icon.color}
                    />
                    <Text style={styles.rowText}>{ingredient}</Text>
                  </Pressable>
                )
              })
            ) : (
              <Text style={styles.emptyText}>{t('recipes.ingredientImportSheet.empty')}</Text>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              size="lg"
              variant="primary"
              loading={isSubmitting}
              disabled={!canAddAll}
              onPress={onAddAll}
            >
              {t('recipes.ingredientImportSheet.addAll')}
            </Button>

            <Button
              size="lg"
              variant="secondary"
              disabled={!canAddSelected}
              onPress={() => onAddSelected(selectedIngredients)}
            >
              {t('recipes.ingredientImportSheet.addSelected', { count: selectedIngredients.length })}
            </Button>

            <Button
              size="md"
              variant="ghost"
              disabled={isSubmitting}
              onPress={onClose}
            >
              {t('recipes.ingredientImportSheet.cancel')}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = createThemedStyles((theme) => ({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: theme.colors.overlay,
  },
  sheet: {
    borderTopLeftRadius: theme.radii.xxl,
    borderTopRightRadius: theme.radii.xxl,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomWidth: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.textVariants.heading,
    color: theme.colors.foreground,
  },
  subtitle: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  list: {
    marginTop: theme.spacing.xs,
    maxHeight: 300,
  },
  listContent: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.muted,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  rowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primarySoft,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowText: {
    flex: 1,
    ...theme.textVariants.body,
    color: theme.colors.foreground,
  },
  icon: {
    color: theme.colors.mutedForeground,
  },
  iconSelected: {
    color: theme.colors.primary,
  },
  emptyText: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  actions: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
}))
