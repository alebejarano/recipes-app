import { Feather } from '@expo/vector-icons'
import React, { useEffect } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useTransientSnackbarStore } from '@/features/feedback/store/useTransientSnackbarStore'
import { createThemedStyles } from '@/styles/createStyles'

const DISPLAY_MS = 2600

export default function GlobalSnackbar() {
  const insets = useSafeAreaInsets()
  const notice = useTransientSnackbarStore((state) => state.notice)
  const clear = useTransientSnackbarStore((state) => state.clear)

  useEffect(() => {
    if (!notice) return
    const timeout = setTimeout(() => clear(), DISPLAY_MS)
    return () => clearTimeout(timeout)
  }, [clear, notice])

  if (!notice) return null

  return (
    <View pointerEvents="none" style={[styles.container, { bottom: Math.max(insets.bottom, 12) + 12 }]}>
      <View style={styles.snackbar}>
        <Feather name="check-circle" size={16} color={styles.icon.color} />
        <Text style={styles.text}>{notice.message}</Text>
      </View>
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  container: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 1000,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.foreground,
  },
  icon: {
    color: theme.colors.background,
  },
  text: {
    flex: 1,
    ...theme.textVariants.labelSmall,
    color: theme.colors.background,
  },
}))
