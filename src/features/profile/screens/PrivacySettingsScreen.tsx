import React from 'react';

import Screen from '@/components/Screen';
import { createThemedStyles } from '@/styles/createStyles';

import ProfileHeader from '@/features/profile/components/ProfileHeader';
import SettingsSection from '@/features/profile/components/SettingsSection';

import { usePdfUsageSummary } from '@/features/recipes/hooks/useRecipePdfAttachments';

export default function PrivacySettingsScreen() {
  const pdfUsageQuery = usePdfUsageSummary();

  const totalBytes = pdfUsageQuery.data?.totalBytes ?? 0;
  const maxBytes = 50 * 1024 * 1024;
  const usedMB = totalBytes / (1024 * 1024);
  const maxMB = maxBytes / (1024 * 1024);
  const usageLabel = `${usedMB.toFixed(1)} / ${maxMB.toFixed(0)} MB`;

  return (
    <Screen scroll contentStyle={styles.content}>
      <ProfileHeader
        title="Privacy & Security"
      />

      <SettingsSection
        title="Storage"
        subtitle="PDF storage usage"
        rightPillText={usageLabel}
        items={[
          {
            id: 'pdf-usage',
            type: 'toggle',
            icon: 'hard-drive',
            title: 'Recipe PDFs',
            subtitle: 'Free plan cap: 5 PDFs • 50 MB total',
            value: true,
            onValueChange: () => {},
            disabled: true,
          },
        ]}
      />
    </Screen>
  );
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.lg,
  },
}));
