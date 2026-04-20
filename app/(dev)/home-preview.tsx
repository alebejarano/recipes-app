import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import TabScreenPreview from '@/components/TabScreenPreview';
import HomeScreen from '@/features/home/screens/HomeScreen';
import { createThemedStyles } from '@/styles/createStyles';

type HomeScenario = 'empty' | 'few' | 'many';

const scenarios: { key: HomeScenario; title: string; body: string }[] = [
  {
    key: 'empty',
    title: '0 recipes',
    body: 'Simulates a brand-new user with an empty home screen.',
  },
  {
    key: 'few',
    title: 'Very little',
    body: 'Shows the transitional state with only a couple of recipes.',
  },
  {
    key: 'many',
    title: 'A lot',
    body: 'Shows the more mature state with notes and shopping activity.',
  },
];

export default function HomePreviewScreen() {
  const [scenario, setScenario] = React.useState<HomeScenario>('empty');

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.controlsSafeArea}>
        <View style={styles.controlsContent}>
          <Text style={styles.title}>Home preview</Text>
          <Text style={styles.body}>Switch between mock library sizes without touching your real data.</Text>

          <View style={styles.buttonGroup}>
            {scenarios.map((item) => (
              <Button
                key={item.key}
                size="md"
                variant={scenario === item.key ? 'primary' : 'secondary'}
                style={styles.scenarioButton}
                onPress={() => setScenario(item.key)}
              >
                {item.title}
              </Button>
            ))}
          </View>

          <Text style={styles.caption}>{scenarios.find((item) => item.key === scenario)?.body}</Text>

          <Button
            size="md"
            variant="ghost"
            onPress={() => {
              router.back();
            }}
          >
            Back
          </Button>
        </View>
      </SafeAreaView>

      <TabScreenPreview style={styles.preview}>
        <HomeScreen mode="dev" devScenario={scenario} />
      </TabScreenPreview>
    </View>
  );
}

const styles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  controlsSafeArea: {
    backgroundColor: theme.colors.background,
  },
  controlsContent: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
    color: theme.colors.foreground,
  },
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.base,
    color: theme.colors.mutedForeground,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  scenarioButton: {
    flex: 1,
    width: 'auto',
  },
  caption: {
    fontFamily: theme.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.sm,
    color: theme.colors.mutedForeground,
  },
  preview: {
    flex: 1,
  },
}));
