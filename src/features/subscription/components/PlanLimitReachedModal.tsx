import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

import { i18n } from '@/localization/i18n'
import { createThemedStyles } from '@/styles/createStyles'

export type PlanLimitReachedType = 'recipes' | 'storage'

type PlanLimitReachedModalProps = {
  visible: boolean
  type: PlanLimitReachedType
  onClose: () => void
  onPrimary: () => void
  onSecondary: () => void
}

export default function PlanLimitReachedModal({
  visible,
  type,
  onClose,
  onPrimary,
  onSecondary,
}: PlanLimitReachedModalProps) {
  const isRecipeLimit = type === 'recipes'

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('subscription.currentPlan.limitModal.close')}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          >
            <Feather name="x" size={16} style={styles.closeIcon} />
          </Pressable>

          <Text style={styles.title}>
            {isRecipeLimit
              ? i18n.t('subscription.currentPlan.limitModal.recipeTitle')
              : i18n.t('subscription.currentPlan.limitModal.storageTitle')}
          </Text>

          <Text style={styles.body}>
            {isRecipeLimit
              ? i18n.t('subscription.currentPlan.limitModal.recipeBody')
              : i18n.t('subscription.currentPlan.limitModal.storageBody')}
          </Text>

          <View style={styles.actions}>
            <Pressable onPress={onPrimary} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>{i18n.t('subscription.currentPlan.limitModal.unlock')}</Text>
            </Pressable>
            <Pressable onPress={onSecondary} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
              <Text style={styles.secondaryButtonText}>
                {isRecipeLimit
                  ? i18n.t('subscription.currentPlan.limitModal.manageRecipes')
                  : i18n.t('subscription.currentPlan.limitModal.reviewImports')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            {isRecipeLimit
              ? i18n.t('subscription.currentPlan.limitModal.recipeFooter')
              : i18n.t('subscription.currentPlan.limitModal.storageFooter')}
          </Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = createThemedStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 28,
    height: 28,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: theme.colors.muted,
  },
  closeIcon: {
    color: theme.colors.mutedForeground,
  },
  title: {
    marginTop: theme.spacing.sm,
    ...theme.textVariants.title,
    color: theme.colors.foreground,
  },
  body: {
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
  },
  actions: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  primaryButtonText: {
    ...theme.textVariants.emphasis,
    color: theme.colors.accentForeground,
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  secondaryButtonText: {
    ...theme.textVariants.label,
    color: theme.colors.foreground,
  },
  footer: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.xs,
    color: theme.colors.mutedForeground,
  },
  pressed: {
    opacity: 0.9,
  },
}))
