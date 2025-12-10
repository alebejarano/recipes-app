// src/features/onboarding/screens/ImportSourcesScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';

import Button from '@/components/Button';
import { createThemedStyles } from '@/styles/createStyles';

interface ImportSourcesScreenProps {
    onContinue: (selected: string[]) => void;
}

type SourceId = 'instagram' | 'websites' | 'youtube' | 'screenshots' | 'documents';

type Source = {
    id: SourceId;
    label: string;
    description: string;
    icon: (style: any) => React.ReactNode;
};

const sources: Source[] = [
    {
        id: 'instagram',
        label: 'Instagram',
        description: 'Saved posts & reels',
        icon: style => <Ionicons name="logo-instagram" size={20} style={style} />,
    },
    {
        id: 'websites',
        label: 'Websites',
        description: 'Any recipe URL',
        icon: style => <Feather name="globe" size={20} style={style} />,
    },
    {
        id: 'youtube',
        label: 'YouTube',
        description: 'Cooking videos',
        icon: style => <FontAwesome5 name="youtube" size={18} style={style} />,
    },
    {
        id: 'screenshots',
        label: 'Screenshots',
        description: 'Photos from camera roll',
        icon: style => <Feather name="camera" size={20} style={style} />,
    },
    {
        id: 'documents',
        label: 'PDFs or Notes',
        description: 'Files & documents',
        icon: style => <Feather name="file-text" size={18} style={style} />,
    },
];

export default function ImportSourcesScreen({
                                                onContinue,
                                            }: ImportSourcesScreenProps) {
    // Map circle background styles by source id
    const circleStyles: Record<SourceId, any> = {
        instagram: styles.iconCircleInstagram,
        websites: styles.iconCircleWeb,
        youtube: styles.iconCircleYoutube,
        screenshots: styles.iconCircleScreenshots,
        documents: styles.iconCircleDocuments,
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Ways you can save recipes</Text>
                        <Text style={styles.subtitle}>
                            Import from anywhere—we&apos;ll organize everything.
                        </Text>
                    </View>

                    {/* Sources list */}
                    <ScrollView
                        contentContainerStyle={styles.sourcesList}
                        showsVerticalScrollIndicator={false}
                    >
                        {sources.map(source => (
                            <View key={source.id} style={styles.sourceRow}>
                                <View
                                    style={[
                                        styles.iconCircleBase,
                                        circleStyles[source.id],
                                    ]}
                                >
                                    {source.icon(styles.iconColor)}
                                </View>
                                <View>
                                    <Text style={styles.sourceLabel}>
                                        {source.label}
                                    </Text>
                                    <Text style={styles.sourceDescription}>
                                        {source.description}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Continue button */}
                <View style={styles.footer}>
                    <Button
                        onPress={() => onContinue([])}
                        size="xl"
                        variant="primary"
                    >
                        Continue
                    </Button>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = createThemedStyles(theme => ({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
    },
    content: {
        flex: 1,
    },

    header: {
        marginBottom: theme.spacing.lg,
        alignItems: 'center',
    },
    title: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.display,
        lineHeight: theme.lineHeight.display,
        color: theme.colors.foreground,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
        textAlign: 'center',
    },

    sourcesList: {
        paddingBottom: theme.spacing.xl,
    },

    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },

    iconCircleBase: {
        width: 40,
        height: 40,
        borderRadius: theme.radii.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    iconColor: {
        color: theme.colors.cardForeground,
    },

    // Circle background colors (approximate your design)
    iconCircleInstagram: {
        backgroundColor: '#C942E0', // pseudo gradient mid-tone
    },
    iconCircleWeb: {
        backgroundColor: theme.colors.primary,
    },
    iconCircleYoutube: {
        backgroundColor: '#EA4335',
    },
    iconCircleScreenshots: {
        backgroundColor: theme.colors.terracotta,
    },
    iconCircleDocuments: {
        backgroundColor: theme.colors.sageDark,
    },

    sourceLabel: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.foreground,
    },
    sourceDescription: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.sm,
        color: theme.colors.mutedForeground,
    },

    footer: {
        marginTop: theme.spacing.lg,
    },
}));
