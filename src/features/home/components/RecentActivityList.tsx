import { Feather } from '@expo/vector-icons'
import React from 'react'
import { View } from 'react-native'

import ActionCard from '@/features/home/components/ActionCard'
import type { HomeActivityItem } from '@/features/home/utils/homeState'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'
import { theme } from '@/styles/theme'

type Props = {
  items: HomeActivityItem[]
  formatMeta: (timestamp: string) => string
  onPressItem: (item: HomeActivityItem) => void
}

function getIcon(type: HomeActivityItem['type']) {
  if (type === 'note') return <Feather name="file-text" size={22} color={theme.colors.primaryDark} />
  if (type === 'import') return <Feather name="upload" size={22} color={theme.colors.primaryDark} />
  if (type === 'shopping-list') return <Feather name="shopping-cart" size={22} color={theme.colors.primaryDark} />
  return <Feather name="book-open" size={22} color={theme.colors.primaryDark} />
}

function isSupportedActivity(item: HomeActivityItem) {
  return item.type === 'recipe'
    || item.type === 'note'
    || item.type === 'import'
    || item.type === 'shopping-list'
}

export default function RecentActivityList({ items, formatMeta, onPressItem }: Props) {
  const { t } = useTranslation()
  const supportedItems = items.filter(isSupportedActivity)

  if (supportedItems.length === 0) return null

  return (
    <View style={styles.list} accessibilityRole="list" accessibilityLabel={t('home.activity.a11yLabel')}>
      {supportedItems.map((item) => (
        <ActionCard
          key={item.id}
          title={item.title}
          meta={formatMeta(item.timestamp)}
          leftIcon={getIcon(item.type)}
          noTopMargin
          onPress={() => onPressItem(item)}
          accessibilityLabel={t('home.activity.openA11y', { type: t(`home.activity.types.${item.type}`), title: item.title })}
        />
      ))}
    </View>
  )
}

const styles = createThemedStyles((theme) => ({
  list: {
    gap: theme.spacing.sm,
  },
}))
