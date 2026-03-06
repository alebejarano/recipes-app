import React, { useState } from 'react'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'

type PushSettingsScreenProps = {
  onBack: () => void
}

export default function PushSettingsScreen({ onBack }: PushSettingsScreenProps) {
  const [recipeReminders, setRecipeReminders] = useState(true)
  const [activityAlerts, setActivityAlerts] = useState(false)

  return (
    <ProfileSubpageLayout title="Push Settings" onBack={onBack}>
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
    </ProfileSubpageLayout>
  )
}
