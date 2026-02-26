import React, { useState } from 'react'

import Screen from '@/components/Screen'
import { createThemedStyles } from '@/styles/createStyles'

import ProfileHeader from '@/features/profile/components/ProfileHeader'
import SettingsSection from '@/features/profile/components/SettingsSection'

export default function PushSettingsScreen() {
  const [recipeReminders, setRecipeReminders] = useState(true)
  const [activityAlerts, setActivityAlerts] = useState(false)

  return (
    <Screen scroll contentStyle={styles.content}>
      <ProfileHeader title="Push Settings" />

      <SettingsSection
        title="Notifications"
        items={[
          {
            id: 'recipe-reminders',
            type: 'toggle',
            icon: 'bell',
            title: 'Recipe reminders',
            subtitle: 'Get notified about your cooking plans',
            value: recipeReminders,
            onValueChange: setRecipeReminders,
          },
          {
            id: 'activity-alerts',
            type: 'toggle',
            icon: 'activity',
            title: 'Product updates',
            subtitle: 'Important app improvements and releases',
            value: activityAlerts,
            onValueChange: setActivityAlerts,
          },
        ]}
      />
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.lg,
  },
}))
