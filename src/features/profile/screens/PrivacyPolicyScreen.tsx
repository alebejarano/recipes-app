import { router } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { createThemedStyles } from '@/styles/createStyles'

type PolicyGroup = {
    heading: string
    paragraphs: readonly string[]
    bullets?: readonly string[]
}

type PolicySection = {
    title: string
    paragraphs?: readonly string[]
    details?: readonly string[]
    groups?: readonly PolicyGroup[]
    bullets?: readonly string[]
    footer?: string
}

const POLICY_SECTIONS: readonly PolicySection[] = [
    {
        title: '1. Introduction',
        paragraphs: [
            'This Privacy Policy explains how information is collected, used, and protected when you use this application.',
            'The application is designed to respect user privacy and collect only the minimum information necessary to operate and improve the service.',
            'The data controller responsible for processing personal data is:',
        ],
        details: [
            'Name: Anthony Lajusticia',
            'Location: Spain',
            'Contact: hello@dropsauce.app',
        ],
        footer:
            'This policy complies with the General Data Protection Regulation (GDPR) and the Organic Law on Data Protection and Digital Rights Guarantee (LOPDGDD).',
    },
    {
        title: '2. Information We Collect',
        groups: [
            {
                heading: 'Account Information',
                paragraphs: [
                    'If you choose to create an account, we collect your email address and name to create and manage your account.',
                    'This information is used only to operate the service, manage your account, and communicate with you about account or app-functioning matters such as password reset emails, confirmation links, and important service updates.',
                ],
            },
            {
                heading: 'Anonymous Onboarding Feedback',
                paragraphs: [
                    'During onboarding, users may be asked what brings them to the app or what they hope to use it for.',
                    'Anonymous onboarding responses may be processed through our analytics provider to understand general user needs and improve the application.',
                ],
                bullets: [
                    'is collected anonymously',
                    'is not linked to any personal identifier',
                    'is used only to understand user needs and improve the application.',
                ],
            },
            {
                heading: 'Local Data Storage',
                paragraphs: [
                    'If you use the app without creating an account, your recipes and related information are stored locally on your device.',
                    'This information is not transmitted to our servers.',
                ],
            },
        ],
    },
    {
        title: '3. How We Use Information',
        bullets: [
            'Create and manage user accounts',
            'Provide access to the application',
            'Improve the app and develop new features',
            'Understand general user interests through anonymous onboarding responses',
            'Communicate account, security, and service updates needed for the app to function',
            'Send optional product or marketing emails only if you have actively opted in',
        ],
    },
    {
        title: '4. Email Communications',
        paragraphs: [
            'If you create an account, we may send necessary service emails for app-functioning purposes, such as account confirmation, password reset, email change confirmation, security, and important service messages.',
            'Marketing and product update emails are off by default. You may choose to opt in from your profile settings to receive emails about:',
        ],
        bullets: [
            'product updates',
            'new features',
            'occasional marketing communications',
        ],
        footer:
            'These emails are sent only if you have provided consent. You can unsubscribe at any time using the link included in each email or by contacting us.',
    },
    {
        title: '5. Legal Basis for Processing',
        paragraphs: ['Under the GDPR, personal data is processed on the following legal bases:'],
        groups: [
            {
                heading: 'Contract',
                paragraphs: ['To provide and manage user accounts and send necessary account or service emails.'],
            },
            {
                heading: 'Consent',
                paragraphs: ['For sending optional email communications.'],
            },
            {
                heading: 'Legitimate interest',
                paragraphs: [
                    'To improve the application through anonymous feedback and product improvement.',
                ],
            },
        ],
    },
    {
        title: '6. Data Storage and Security',
        paragraphs: [
            'Reasonable technical and organizational measures are implemented to protect personal data against unauthorized access, loss, or misuse.',
            'Only the minimum necessary data is collected and processed.',
        ],
    },
    {
        title: '7. Data Retention',
        paragraphs: [
            'Email addresses associated with accounts are retained for as long as the account remains active.',
            'Anonymous onboarding responses may be retained for analytical purposes but cannot be linked to any individual user.',
            'Users may request deletion of their account and associated data at any time.',
        ],
    },
    {
        title: '8. User Rights',
        paragraphs: ['Under the GDPR, users have the right to:'],
        bullets: [
            'Access their personal data',
            'Request correction of inaccurate data',
            'Request deletion of their data',
            'Restrict or object to certain processing',
            'Withdraw consent at any time',
        ],
        footer:
            'Requests may be made by contacting: hello@dropsauce.app. Users also have the right to lodge a complaint with their local data protection authority.',
    },
    {
        title: '9. Changes to This Policy',
        paragraphs: [
            'This Privacy Policy may be updated from time to time.',
            'When changes occur, the updated version will be published within the application or on the website.',
        ],
    },
]

export default function PrivacyPolicyScreen() {
    return (
        <ProfileSubpageLayout
            title="Privacy Policy"
            subtitle="Last updated: March 9, 2026"
            onBack={() => router.back()}
        >
            <Text style={styles.intro}>
                This page explains what data the app collects, why it is processed, and how it is
                protected.
            </Text>

            {POLICY_SECTIONS.map((section) => (
                <View key={section.title} style={styles.card}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>

                    {section.paragraphs?.map((paragraph) => (
                        <Text key={paragraph} style={styles.body}>
                            {paragraph}
                        </Text>
                    ))}

                    {section.details?.map((detail) => (
                        <Text key={detail} style={styles.detail}>
                            {detail}
                        </Text>
                    ))}

                    {section.groups?.map((group) => (
                        <View key={group.heading} style={styles.group}>
                            <Text style={styles.groupTitle}>{group.heading}</Text>
                            {group.paragraphs.map((paragraph) => (
                                <Text key={paragraph} style={styles.body}>
                                    {paragraph}
                                </Text>
                            ))}
                            {group.bullets?.map((bullet) => (
                                <Text key={bullet} style={styles.bullet}>
                                    • {bullet}
                                </Text>
                            ))}
                        </View>
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
    group: {
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    groupTitle: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.foreground,
    },
    body: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.lg,
        color: theme.colors.mutedForeground,
    },
    detail: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.foreground,
    },
    bullet: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.lg,
        color: theme.colors.mutedForeground,
    },
}))
