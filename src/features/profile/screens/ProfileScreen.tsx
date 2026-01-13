import React, { useMemo, useState } from 'react';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import DietaryPreferencesSection from '@/features/profile/components/DietaryPreferencesSection';
import ProfileHeader from '@/features/profile/components/ProfileHeader';
import ProfileUserCard from '@/features/profile/components/ProfileUserCard';
import SettingsSection from '@/features/profile/components/SettingsSection';

import {
  ACCOUNT_ITEMS,
  DEFAULT_DIETARY_PREFERENCES,
  DIETARY_OPTIONS,
  PREFERENCES_ITEMS,
  SUPPORT_ITEMS,
  type DietaryId,
  type PreferenceToggles,
} from '@/features/profile/data/profileMockData';

export default function ProfileScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl);

  // Mock user (replace later with auth/user context)
  const user = useMemo(
    () => ({ name: 'Amanda', email: 'amanda@email.com' }),
    []
  );

  const [dietary, setDietary] = useState<DietaryId[]>(
    DEFAULT_DIETARY_PREFERENCES
  );

  const [toggles, setToggles] = useState<PreferenceToggles>({
    pushNotifications: true,
    emailUpdates: false,
    // darkMode: false, // TODO later
  });

  const onToggleDietary = (id: DietaryId) => {
    setDietary((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Screen
      scroll
      bottomPadding={bottomPadding}
      contentStyle={styles.content}
    >
      <ProfileHeader
        title="Profile"
        subtitle="Manage your account"
        onPressSettings={() => {
          // TODO: navigate to settings later
        }}
      />

      <ProfileUserCard
        name={user.name}
        email={user.email}
        onPressEdit={() => {
          // TODO: edit profile later
        }}
      />

      <DietaryPreferencesSection
        title="Dietary Preferences"
        optional
        options={DIETARY_OPTIONS}
        value={dietary}
        onToggle={onToggleDietary}
      />

      <SettingsSection
        title="Preferences"
        items={PREFERENCES_ITEMS({
          toggles,
          setToggles,
        })}
      />

      <SettingsSection title="Account" items={ACCOUNT_ITEMS} />

      <SettingsSection title="Support" items={SUPPORT_ITEMS} />
    </Screen>
  );
}

const styles = createThemedStyles((theme) => ({
  // Screen already handles safe-area + top padding + horizontal padding.
  // Keep only page-specific vertical rhythm here.
  content: {
    gap: theme.spacing.xl,
  },
}));
