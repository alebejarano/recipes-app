import { router } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { createThemedStyles } from '@/styles/createStyles'

type TermsSection = {
    title: string
    paragraphs?: readonly string[]
    bullets?: readonly string[]
    footer?: string
}

const TERMS_SECTIONS: readonly TermsSection[] = [
    {
        title: '1. Introduction',
        paragraphs: [
            'These Terms of Service govern your use of this application.',
            'By accessing or using the app, you agree to these Terms.',
            'If you do not agree with the Terms, you should not use the service.',
        ],
    },
    {
        title: '2. Description of the Service',
        paragraphs: [
            'The application provides tools for saving, organizing, and managing recipes and cooking-related content.',
            'Features may change or evolve over time as the product develops.',
        ],
    },
    {
        title: '3. Accounts',
        paragraphs: ['Some features may require creating an account.', 'Users are responsible for:'],
        bullets: [
            'providing accurate information',
            'maintaining the confidentiality of their account',
            'all activity occurring under their account.',
        ],
        footer: 'We reserve the right to suspend or terminate accounts that violate these Terms.',
    },
    {
        title: '4. Acceptable Use',
        paragraphs: ['You agree not to:'],
        bullets: [
            'misuse the application',
            'attempt to disrupt the service',
            'attempt unauthorized access to systems or data',
            'use the service for unlawful purposes.',
        ],
    },
    {
        title: '5. User Content',
        paragraphs: [
            'Users may create or store content within the application.',
            'You retain ownership of the content you create.',
            'However, you are responsible for ensuring that your content does not violate applicable laws or third-party rights.',
        ],
    },
    {
        title: '6. Availability of the Service',
        paragraphs: [
            'The service is provided "as is".',
            'While we aim to provide a reliable experience, uninterrupted availability cannot be guaranteed.',
            'Features may be modified, suspended, or discontinued.',
        ],
    },
    {
        title: '7. Limitation of Liability',
        paragraphs: [
            'To the maximum extent permitted by law, the application and its owner shall not be liable for any indirect, incidental, or consequential damages resulting from the use of the service.',
        ],
    },
    {
        title: '8. Termination',
        paragraphs: [
            'Users may stop using the service at any time.',
            'Accounts may be terminated if these Terms are violated.',
        ],
    },
    {
        title: '9. Governing Law',
        paragraphs: ['These Terms are governed by the laws of Spain.'],
    },
    {
        title: '10. Contact',
        paragraphs: ['For questions regarding these Terms, you may contact:'],
        footer: '[your email]',
    },
]

export default function TermsOfServiceScreen() {
    return (
        <ProfileSubpageLayout
            title="Terms of Service"
            subtitle="Last updated: March 9, 2026"
            onBack={() => router.back()}
        >
            <Text style={styles.intro}>
                These terms explain the rules for using the app and the basic responsibilities for
                both the user and the service owner.
            </Text>

            {TERMS_SECTIONS.map((section) => (
                <View key={section.title} style={styles.card}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>

                    {section.paragraphs?.map((paragraph) => (
                        <Text key={paragraph} style={styles.body}>
                            {paragraph}
                        </Text>
                    ))}

                    {section.bullets?.map((bullet) => (
                        <Text key={bullet} style={styles.bullet}>
                            • {bullet}
                        </Text>
                    ))}

                    {section.footer ? <Text style={styles.body}>{section.footer}</Text> : null}
                </View>
            ))}
        </ProfileSubpageLayout>
    )
}

const styles = createThemedStyles((theme) => ({
    intro: {
        marginTop: -theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.mutedForeground,
    },
    card: {
        borderRadius: theme.radii.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    sectionTitle: {
        fontFamily: theme.fontFamily.semibold,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
        color: theme.colors.foreground,
    },
    body: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.lg,
        color: theme.colors.mutedForeground,
    },
    bullet: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.lg,
        color: theme.colors.mutedForeground,
    },
}))
