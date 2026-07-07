import Button from '@/components/Button';
import { useTranslation } from '@/localization';
import { createThemedStyles } from '@/styles/createStyles';
import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

type ChooseAddMethodScreenProps = {
  onSelectScratch: () => void;
  onSelectFile: () => void;
};

export default function ChooseAddMethodScreen({
  onSelectScratch,
  onSelectFile,
}: ChooseAddMethodScreenProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('onboarding.chooseMethod.title')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.chooseMethod.subtitle')}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          onPress={onSelectScratch}
          size="xl"
          variant="primary"
          icon={<Feather name="edit-3" size={20} style={styles.primaryIcon} />}
        >
          {t('onboarding.chooseMethod.scratch')}
        </Button>

        <Button
          onPress={onSelectFile}
          size="xl"
          variant="secondary"
          icon={<Ionicons name="document-outline" size={20} style={styles.secondaryIcon} />}
        >
          {t('onboarding.chooseMethod.file')}
        </Button>
      </View>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    gap: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  title: {
    textAlign: 'center',
    ...theme.textVariants.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    ...theme.textVariants.body,
    color: theme.colors.mutedForeground,
    maxWidth: 320,
  },
  actions: {
    width: '100%',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  primaryIcon: {
    color: theme.colors.primaryForeground,
  },
  secondaryIcon: {
    color: theme.colors.foreground,
  },
}));
