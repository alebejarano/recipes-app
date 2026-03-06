import React, { useState } from 'react'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import SettingsSection from '@/features/profile/components/SettingsSection'

type EmailSettingsScreenProps = {
  onBack: () => void
}

export default function EmailSettingsScreen({ onBack }: EmailSettingsScreenProps) {
  const [newsletter, setNewsletter] = useState(true)
  const [tips, setTips] = useState(true)

  return (
    <ProfileSubpageLayout title="Email Settings" onBack={onBack}>
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
    </ProfileSubpageLayout>
  )
}
