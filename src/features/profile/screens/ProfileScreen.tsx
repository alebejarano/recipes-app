import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { createThemedStyles } from '@/styles/createStyles';

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
  const bottomPadding = useTabBarBottomPadding(24);

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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      keyboardShouldPersistTaps="handled"
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

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = createThemedStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
}));
