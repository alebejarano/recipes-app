import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

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
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          >
            <Feather name="x" size={16} style={styles.closeIcon} />
          </Pressable>

          <Text style={styles.title}>
            {isRecipeLimit ? 'Your kitchen is full' : 'Out of storage space 📦'}
          </Text>

          <Text style={styles.body}>
            {isRecipeLimit
              ? 'You’ve reached the Free plan limit of 100 recipes.\nUpgrade to keep saving — plus backup & sync across devices.'
              : 'You’ve used all 50MB of Free storage for photos & PDFs.\nUpgrade to keep adding imports — with cloud backup.'}
          </Text>

          <View style={styles.actions}>
            <Pressable onPress={onPrimary} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Unlock Premium</Text>
            </Pressable>
            <Pressable onPress={onSecondary} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
              <Text style={styles.secondaryButtonText}>
                {isRecipeLimit ? 'Manage recipes' : 'Review imports'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            {isRecipeLimit
              ? 'Nothing will be deleted. Your recipes will be safely imported.'
              : 'Nothing will be deleted. Cancel anytime.'}
          </Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = createThemedStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 16, 10, 0.36)',
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
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.xxl,
    lineHeight: theme.lineHeight.xxl,
    color: theme.colors.foreground,
  },
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
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
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
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
