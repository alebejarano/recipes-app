import Button from '@/components/Button';
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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose how to add your first recipe</Text>
        <Text style={styles.subtitle}>
          Start from a blank recipe or import a file you already have.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          onPress={onSelectScratch}
          size="xl"
          variant="primary"
          icon={<Feather name="edit-3" size={20} style={styles.primaryIcon} />}
        >
          Create from scratch
        </Button>

        <Button
          onPress={onSelectFile}
          size="xl"
          variant="secondary"
          icon={<Ionicons name="document-outline" size={20} style={styles.secondaryIcon} />}
        >
          Import from file
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
