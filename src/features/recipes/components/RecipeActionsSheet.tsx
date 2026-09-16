import React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'

type RecipeActionsSheetProps = {
  visible: boolean
  title: string
  editLabel: string
  deleteLabel: string
  cancelLabel: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function RecipeActionsSheet({
  visible,
  title,
  editLabel,
  deleteLabel,
  cancelLabel,
  onClose,
  onEdit,
  onDelete,
}: RecipeActionsSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} accessibilityRole="button" accessibilityLabel={cancelLabel} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onEdit} style={styles.action} accessibilityRole="button">
            <Text style={styles.actionText}>{editLabel}</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.action} accessibilityRole="button">
            <Text style={styles.deleteText}>{deleteLabel}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancelAction} accessibilityRole="button">
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = createThemedStyles((theme) => ({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.overlay,
  },
  dismissArea: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  card: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 420,
    paddingBottom: theme.spacing.lg,
    borderRadius: theme.radii.xxl,
    backgroundColor: theme.colors.card,
  },
  title: { ...theme.textVariants.subtitle, color: theme.colors.foreground, marginBottom: theme.spacing.xs },
  action: { minHeight: 52, justifyContent: 'center', alignItems: 'center', borderRadius: theme.radii.lg, backgroundColor: theme.colors.secondary },
  actionText: { ...theme.textVariants.emphasis, color: theme.colors.foreground },
  deleteText: { ...theme.textVariants.emphasis, color: theme.colors.destructive },
  cancelAction: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  cancelText: { ...theme.textVariants.emphasis, color: theme.colors.primary },
}))
