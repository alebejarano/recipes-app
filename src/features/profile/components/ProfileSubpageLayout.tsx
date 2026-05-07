import { Feather } from '@expo/vector-icons'
import React, { type ReactNode } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import Screen from '@/components/Screen'
import { createThemedStyles } from '@/styles/createStyles'

type ProfileSubpageLayoutProps = {
  title: string
  subtitle?: string
  onBack: () => void
  children: ReactNode
  bottomPadding?: number
  headerRight?: ReactNode
  keyboardAware?: boolean
}

export default function ProfileSubpageLayout({
  title,
  subtitle,
  onBack,
  children,
  bottomPadding,
  headerRight,
  keyboardAware,
}: ProfileSubpageLayoutProps) {
  return (
    <Screen
      scroll
      bottomPadding={bottomPadding}
      contentStyle={styles.content}
      keyboardAware={keyboardAware}
    >
      <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.75}>
        <Feather name="chevron-left" size={18} style={styles.backIcon} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.pageTitle}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
      </View>

      {children}
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  backRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    color: theme.colors.mutedForeground,
  },
  backText: {
    marginLeft: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  header: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerTitleWrap: {
    flex: 1,
  },
  pageTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
  },
  headerRight: {
    alignSelf: 'center',
  },
}))
