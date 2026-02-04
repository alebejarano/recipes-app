import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { createThemedStyles } from '@/styles/createStyles';

import ProfileHeader from '@/features/profile/components/ProfileHeader';
import SettingsSection from '@/features/profile/components/SettingsSection';
import type { SettingsRowItem } from '@/features/profile/components/SettingsRow';

import { useAnalyticsConsent } from '@/features/analytics/context/AnalyticsConsentContext';
import { usePdfUsageSummary } from '@/features/recipes/hooks/useRecipePdfAttachments';

export default function PrivacySettingsScreen() {
  const {
    analyticsEnabled,
    sessionReplayEnabled,
    setAnalyticsEnabled,
    setSessionReplayEnabled,
  } = useAnalyticsConsent();
  const pdfUsageQuery = usePdfUsageSummary();

  const items = useMemo<SettingsRowItem[]>(
    () => [
      {
        id: 'analytics',
        type: 'toggle',
        icon: 'bar-chart-2',
        title: 'Usage analytics',
        subtitle: 'Help improve the app with anonymized usage data.',
        value: analyticsEnabled,
        onValueChange: setAnalyticsEnabled,
      },
      {
        id: 'session-replay',
        type: 'toggle',
        icon: 'video',
        title: 'Session replay',
        subtitle: analyticsEnabled
          ? 'Allow session recordings to diagnose issues.'
          : 'Enable analytics to allow session recordings.',
        value: analyticsEnabled && sessionReplayEnabled,
        onValueChange: setSessionReplayEnabled,
        disabled: !analyticsEnabled,
      },
    ],
    [analyticsEnabled, sessionReplayEnabled, setAnalyticsEnabled, setSessionReplayEnabled]
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
        subtitle="Control analytics and session replay."
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
        <Text style={styles.note}>
          Turning off analytics stops event collection on this device. Session replay is only
          captured when analytics is enabled.
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
}));
