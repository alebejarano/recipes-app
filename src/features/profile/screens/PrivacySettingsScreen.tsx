import React from 'react';

import Screen from '@/components/Screen';
import { createThemedStyles } from '@/styles/createStyles';

import ProfileHeader from '@/features/profile/components/ProfileHeader';
import SettingsSection from '@/features/profile/components/SettingsSection';

import { useRecipeDocumentUsageSummary } from '@/features/recipes/hooks/useRecipeDocuments';
import { FREE_PLAN_MAX_IMPORT_TOTAL_BYTES } from '@/features/subscription/constants/limits';

export default function PrivacySettingsScreen() {
  const importsUsageQuery = useRecipeDocumentUsageSummary();

  const totalBytes = importsUsageQuery.data?.totalBytes ?? 0;
  const maxBytes = FREE_PLAN_MAX_IMPORT_TOTAL_BYTES;
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
        subtitle="Imports storage usage"
        rightPillText={usageLabel}
        items={[
          {
            id: 'imports-usage',
            type: 'link',
            icon: 'hard-drive',
            title: 'Recipe Imports',
            subtitle: 'Free plan cap: 10 MB per file • 50 MB total',
            showChevron: false,
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
