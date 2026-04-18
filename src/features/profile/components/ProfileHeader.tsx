import React from 'react';
import { Text, View } from 'react-native';

import { createThemedStyles } from '@/styles/createStyles';

type Props = {
  title: string
  environmentLabel?: string | null
}

export default function ProfileHeader({ title, environmentLabel }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {environmentLabel ? (
          <View style={styles.environmentPill}>
            <Text style={styles.environmentPillText}>{environmentLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  left: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  environmentPill: {
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  environmentPillText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.xs,
    color: theme.colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
}))
