import { Feather } from '@expo/vector-icons'
import React from 'react'
import { Pressable, Text, View } from 'react-native'

import { createThemedStyles } from '@/styles/createStyles'
import type { RecipeMealTime } from '@/features/recipes/types/mealTimes'

const MEAL_TIME_COPY: Record<
  RecipeMealTime,
  { label: string; icon: React.ComponentProps<typeof Feather>['name'] }
> = {
  breakfast: { label: 'Breakfast', icon: 'sunrise' },
  lunch: { label: 'Lunch', icon: 'sun' },
  snack: { label: 'Snack', icon: 'coffee' },
  dinner: { label: 'Dinner', icon: 'moon' },
}

type Props = {
  mealTime: RecipeMealTime
  selected?: boolean
  onPress?: () => void
}

export default function MealTimeChip({
  mealTime,
  selected = true,
  onPress,
}: Props) {
  const content = (
    <>
      <View style={[styles.iconWrap, selected ? styles.iconWrapSelected : styles.iconWrapIdle]}>
        <Feather
          name={MEAL_TIME_COPY[mealTime].icon}
          size={12}
          style={selected ? styles.iconSelected : styles.iconIdle}
        />
      </View>
      <Text style={[styles.text, selected ? styles.textSelected : styles.textIdle]}>
        {MEAL_TIME_COPY[mealTime].label}
      </Text>
    </>
  )

  if (!onPress) {
    return <View style={[styles.base, styles.selected]}>{content}</View>
  }

  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, selected ? styles.selected : styles.idle]}
      accessibilityRole="button"
    >
      {content}
    </Pressable>
  )
}

const styles = createThemedStyles((theme) => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
  },
  idle: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  selected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primarySoft,
  },
  iconWrap: {
    width: 20,
    height: 20,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapIdle: {
    backgroundColor: theme.colors.muted,
  },
  iconWrapSelected: {
    backgroundColor: theme.colors.card,
  },
  text: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.sm,
  },
  textIdle: {
    color: theme.colors.foreground,
  },
  textSelected: {
    color: theme.colors.primaryDark,
  },
  iconIdle: {
    color: theme.colors.mutedForeground,
  },
  iconSelected: {
    color: theme.colors.primaryDark,
  },
}))
