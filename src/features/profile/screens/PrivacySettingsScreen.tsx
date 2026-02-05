import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { createThemedStyles } from '@/styles/createStyles';

import ProfileHeader from '@/features/profile/components/ProfileHeader';
import type { SettingsRowItem } from '@/features/profile/components/SettingsRow';
import SettingsSection from '@/features/profile/components/SettingsSection';

import { useAnalyticsConsent } from '@/features/analytics/context/AnalyticsConsentContext';
import { usePdfUsageSummary } from '@/features/recipes/hooks/useRecipePdfAttachments';

export default function PrivacySettingsScreen() {
  const {
    analyticsEnabled,
    setAnalyticsEnabled,
  } = useAnalyticsConsent();
  const pdfUsageQuery = usePdfUsageSummary();

  const items = useMemo<SettingsRowItem[]>(
    () => [
      {
        id: 'analytics',
        type: 'toggle',
        icon: 'bar-chart-2',
        title: 'Usage analytics',
        subtitle: 'Help improve the app by sharing anonymized usage data.',
        value: analyticsEnabled,
        onValueChange: setAnalyticsEnabled,
      },
      
    ],
    [analyticsEnabled, setAnalyticsEnabled]
  );

  const totalBytes = pdfUsageQuery.data?.totalBytes ?? 0;
  const maxBytes = 50 * 1024 * 1024;
  const usedMB = totalBytes / (1024 * 1024);
  const maxMB = maxBytes / (1024 * 1024);
  const usageLabel = `${usedMB.toFixed(1)} / ${maxMB.toFixed(0)} MB`;

  return (
    <Screen scroll contentStyle={styles.content}>
      <ProfileHeader
        title="Privacy & Security"
        subtitle="Manage analytics on this device."
      />

      <SettingsSection title="Analytics" items={items} />

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

      <View style={styles.noteWrap}>
        <Text style={styles.noteTitle}>Why we ask this</Text>
        <Text style={styles.note}>
          We collect anonymized information about what brings people to the app to better
          understand which features matter most. This data helps guide future improvements
          and is never linked to your identity.
        </Text>
      </View>

      <View style={styles.noteWrap}>
        <Text style={styles.note}>
          Turning off analytics stops event collection on this device.
        </Text>
      </View>
    </Screen>
  );
}

const styles = createThemedStyles((theme) => ({
  content: {
    gap: theme.spacing.lg,
  },
  noteWrap: {
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  note: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  noteTitle: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.lg,
    color: theme.colors.foreground
  }
}));
