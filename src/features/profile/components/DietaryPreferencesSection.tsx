import React from 'react';
import { View } from 'react-native';

import { useTranslation } from '@/localization';
import { createThemedStyles } from '@/styles/createStyles';

import DietaryChip from '@/features/profile/components/DietaryChip';
import SectionHeader from '@/features/profile/components/SectionHeader';
import type { DietaryId, DietaryOption } from '@/features/profile/data/profileSettingsData';

type Props = {
  title: string;
  optional?: boolean;
  options: DietaryOption[];
  value: DietaryId[];
  onToggle: (id: DietaryId) => void;
};

export default function DietaryPreferencesSection({
  title,
  optional = false,
  options,
  value,
  onToggle,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <SectionHeader title={title} rightPillText={optional ? t('profile.optional') : undefined} />

      <View style={styles.grid}>
        {options.map((opt) => (
          <View key={opt.id}>
            <DietaryChip
              label={opt.label}
              icon={opt.icon}
              selected={value.includes(opt.id)}
              onPress={() => onToggle(opt.id)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  wrap: {
    marginBottom: theme.spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
}));
