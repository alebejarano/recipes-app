import React, { useState } from 'react'

import Screen from '@/components/Screen'
import { createThemedStyles } from '@/styles/createStyles'

import ProfileHeader from '@/features/profile/components/ProfileHeader'
import SettingsSection from '@/features/profile/components/SettingsSection'

export default function EmailSettingsScreen() {
  const [newsletter, setNewsletter] = useState(true)
  const [tips, setTips] = useState(true)

  return (
    <Screen scroll contentStyle={styles.content}>
      <ProfileHeader title="Email Settings" />

      <SettingsSection
        title="Email Updates"
        items={[
          {
            id: 'newsletter',
            type: 'toggle',
            icon: 'mail',
            title: 'Weekly digest',
            subtitle: 'Recipes and curated collections',
            value: newsletter,
            onValueChange: setNewsletter,
          },
          {
            id: 'tips',
            type: 'toggle',
            icon: 'book-open',
            title: 'Cooking tips',
            subtitle: 'Short guides and feature education',
            value: tips,
            onValueChange: setTips,
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
