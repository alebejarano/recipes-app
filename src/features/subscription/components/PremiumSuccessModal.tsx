import React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'

type PremiumSuccessModalProps = {
  visible: boolean
  onClose: () => void
}

const unlockedItems = [
  'Sync recipes and notes across your devices',
  'Back up your kitchen securely in the cloud',
  'Save unlimited recipes and imports',
  'Keep cooking offline with cloud recovery',
]

export default function PremiumSuccessModal({ visible, onClose }: PremiumSuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.confetti}>🎉 ✨ 🎊</Text>
          <Text style={styles.title}>You&apos;re Premium!</Text>
          <Text style={styles.subtitle}>Upgrade confirmed. Your kitchen is now synced and protected.</Text>

          <Text style={styles.listTitle}>Now you can:</Text>
          <View style={styles.list}>
            {unlockedItems.map((item) => (
              <View key={item} style={styles.row}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = createThemedStyles((theme) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  confetti: {
    textAlign: 'center',
    fontSize: theme.fontSize['2xl'],
    lineHeight: theme.lineHeight['2xl'],
  },
  title: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.bold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  listTitle: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.foreground,
  },
  list: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  bullet: {
    marginTop: 1,
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.primary,
  },
  itemText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.foreground,
  },
  closeButton: {
    marginTop: theme.spacing.md,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.xl,
  },
  closeButtonText: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.primaryForeground,
  },
  pressed: {
    opacity: 0.88,
  },
}))
