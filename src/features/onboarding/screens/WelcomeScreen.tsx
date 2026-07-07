import Button from '@/components/Button';
import IllustrationHero from '@/components/IllustrationHero';
import { useTranslation } from '@/localization';
import { createThemedStyles } from '@/styles/createStyles';
import welcomeIllustration from '@assets/illustrations/welcome-illustration.png';
import React from 'react';
import { Text, View } from 'react-native';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.heroBlock}>
        <IllustrationHero
          source={welcomeIllustration}
          maxWidth={360}
          maxHeight={320}
          aspectRatio={4 / 3}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>
          {t('onboarding.welcome.titleLead')}{'\n'}
          <Text style={styles.titleHighlight}>{t('onboarding.welcome.titleHighlight')}</Text>
        </Text>

        <Text style={styles.subtitle}>
          {t('onboarding.welcome.subtitle')}
        </Text>
      </View>

      <View style={styles.buttonWrapper}>
        <Button variant="primary" size="xl" onPress={onContinue}>
          {t('onboarding.welcome.cta')}
        </Button>
      </View>
    </View>
  );
}

const styles = createThemedStyles(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBlock: {
    marginTop: theme.spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  title: {
    textAlign: 'center',
    ...theme.textVariants.hero,
    color: theme.colors.foreground,
  },
  titleHighlight: {
    color: theme.colors.primary,
    fontFamily: theme.fontFamily.semibold,
  },
  subtitle: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    lineHeight: theme.lineHeight.lg,
    color: theme.colors.mutedForeground,
    maxWidth: 320,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 320,
  },
}));
