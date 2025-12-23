import IllustrationHero from '@/components/IllustrationHero';
import welcomeKitchenIllustration from '@assets/illustrations/welcome-kitchen.png';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

export default function GetStartedScreen() {
  const router = useRouter();

  const handleCreateAccount = () => {
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  // Optional: if you still want users to be able to restart onboarding manually
  // const handleRestartOnboarding = () => router.push('/onboarding');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header / Icon */}
        <View style={styles.header}>
          <View style={styles.iconWrapper}>
            <IllustrationHero
                    source={welcomeKitchenIllustration}
                    maxWidth={360}
                    maxHeight={320}
                    aspectRatio={4 / 3}
                    resizeMode="contain" 
                />
          </View>

          <Text style={styles.title}>Save your recipes and notes</Text>

          <Text style={styles.subtitle}>
            Create an account to keep your recipes, personal notes, and favorites
            in one place—available whenever you come back.
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>With an account you can:</Text>

          <View style={styles.bullets}>
            <Bullet text="Save recipes and organize them into collections" />
            <Bullet text="Add notes, substitutions, and personal tweaks" />
            <Bullet text="Access everything across devices" />
          </View>

          <Button
            onPress={handleCreateAccount}
            size="lg"
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
          >
            Create an account
          </Button>

          <Button
            onPress={handleLogin}
            variant="secondary"
            size="lg"
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
          >
            I already have an account
          </Button>

          <Text style={styles.microCopy}>
            You can start free. Upgrade later if you need more features.
          </Text>

          {/* If you want a tiny third option, keep it subtle (text-only style in your Button, if you have it). */}
          {/* 
          <Button
            onPress={handleRestartOnboarding}
            variant="ghost"
            size="lg"
            style={styles.ghostButton}
            textStyle={styles.ghostButtonText}
          >
            Restart onboarding
          </Button>
          */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletIconWrapper}>
        <Feather name="check" size={16} style={styles.bulletIcon} />
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = createThemedStyles(theme => ({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },

  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.display,
    lineHeight: theme.lineHeight.display,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
    maxWidth: 380,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.radii.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  cardTitle: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },

  bullets: {
    marginBottom: theme.spacing.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  bulletIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  bulletIcon: {
    color: theme.colors.sage,
  },
  bulletText: {
    flex: 1,
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },

  primaryButton: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  primaryButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.primaryForeground,
  },

  secondaryButton: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
    marginBottom: theme.spacing.md,
  },
  secondaryButtonText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: theme.fontSize.base,
    color: theme.colors.secondaryForeground,
  },

  microCopy: {
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.xs,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },

  // ghostButton: { width: '100%', borderRadius: 999, marginTop: theme.spacing.sm },
  // ghostButtonText: { fontFamily: theme.fontFamily.medium, fontSize: theme.fontSize.base, color: theme.colors.sage },
}));
