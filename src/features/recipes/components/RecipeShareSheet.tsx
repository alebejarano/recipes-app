import React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'

type RecipeShareSheetProps = {
  visible: boolean
  title: string
  body: string
  shareTextLabel: string
  shareFileLabel: string
  cancelLabel: string
  onClose: () => void
  onShareText: () => void
  onShareFile: () => void
}

export default function RecipeShareSheet({
  visible,
  title,
  body,
  shareTextLabel,
  shareFileLabel,
  cancelLabel,
  onClose,
  onShareText,
  onShareFile,
}: RecipeShareSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} accessibilityRole="button" accessibilityLabel={cancelLabel} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable onPress={onShareText} style={styles.action} accessibilityRole="button">
            <Text style={styles.actionText}>{shareTextLabel}</Text>
          </Pressable>
          <Pressable onPress={onShareFile} style={styles.action} accessibilityRole="button">
            <Text style={styles.actionText}>{shareFileLabel}</Text>
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
  title: { ...theme.textVariants.subtitle, color: theme.colors.foreground },
  body: { ...theme.textVariants.body, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs },
  action: { minHeight: 52, justifyContent: 'center', alignItems: 'center', borderRadius: theme.radii.lg, backgroundColor: theme.colors.secondary },
  actionText: { ...theme.textVariants.emphasis, color: theme.colors.foreground },
  cancelAction: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  cancelText: { ...theme.textVariants.emphasis, color: theme.colors.primary },
}))
