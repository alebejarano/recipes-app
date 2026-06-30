import { Feather } from '@expo/vector-icons'
import React, { type ReactNode } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import Screen from '@/components/Screen'
import { useLargeScreenLayout } from '@/hooks/useLargeScreenLayout'
import { createThemedStyles } from '@/styles/createStyles'
import { layout } from '@/styles/layout'

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
  const largeScreen = useLargeScreenLayout({ maxContentWidth: layout.formContentMaxWidth })

  return (
    <Screen
      scroll
      bottomPadding={bottomPadding}
      contentStyle={styles.content}
      keyboardAware={keyboardAware}
    >
      <View style={largeScreen.contentWidthStyle}>
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
      </View>
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  backIcon: {
    color: theme.colors.mutedForeground,
  },
  backText: {
    marginLeft: theme.spacing.xs,
    ...theme.textVariants.body,
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
    ...theme.textVariants.display,
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
