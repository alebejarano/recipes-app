import { router } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { createThemedStyles } from '@/styles/createStyles'

type NoticeSection = {
    title: string
    paragraphs?: readonly string[]
    details?: readonly string[]
    bullets?: readonly string[]
}

const NOTICE_SECTIONS: readonly NoticeSection[] = [
    {
        title: '1. Service Provider',
        details: [
            'Legal name: Anthony Lajusticia',
            'Trade name: DropSauce',
            'Legal status: Self-employed professional registered in Spain under the Régimen Especial de Trabajadores Autónomos',
            'NIF: Z0570202Z',
            'Business address: [pending]',
            'Residence and place of establishment: Spain',
            'Email: hello@dropsauce.app',
        ],
        paragraphs: [
            'In accordance with Spanish Law 34/2002 on Information Society Services and Electronic Commerce (LSSI-CE), the provider of Dropsauce is:',
            'No prior administrative authorization, regulated-profession registration, or commercial-registry entry applies to the provision of this app unless stated otherwise.',
        ],
    },
    {
        title: '2. Purpose',
        paragraphs: [
            'This Legal Notice identifies the service provider and establishes the general conditions for access to Dropsauce and its public legal pages.',
            'Use of account, cloud, and subscription features is also subject to the Terms of Service and Privacy Policy.',
        ],
    },
    {
        title: '3. Intellectual Property',
        paragraphs: [
            'The Dropsauce software, design, brand, logos, text, and original visual materials are owned by Anthony Lajusticia or used under license and are protected by intellectual-property laws.',
            'No content may be copied, modified, distributed, reverse engineered, or commercially exploited except as permitted by law, an applicable open-source license, or prior written authorization.',
            'Users retain the rights to content they create or upload, subject to the limited permission needed to provide the service as described in the Terms.',
        ],
    },
    {
        title: '4. Responsibility',
        paragraphs: [
            'Reasonable efforts are made to keep the service and legal information accurate, secure, and available. Temporary interruption may occur because of maintenance, connectivity, third-party services, security incidents, or events beyond reasonable control.',
            'External links and third-party services, including Apple App Store, Google Play, Supabase, and PostHog, are governed by their own terms and policies. Dropsauce is not responsible for third-party content or availability beyond the responsibility imposed by law.',
            'Nothing in this notice excludes mandatory liability or consumer rights.',
        ],
    },
    {
        title: '5. Prices and Purchases',
        paragraphs: [
            'Premium prices, billing periods, applicable taxes, and subscription conditions are displayed in Apple App Store or Google Play before purchase.',
            'Payments, renewals, cancellations, and store refunds are administered through the store used for purchase, without limiting rights granted by mandatory consumer law.',
        ],
    },
    {
        title: '6. Applicable Law',
        paragraphs: [
            'This Legal Notice is governed by Spanish law. Consumers retain any mandatory protections and legally competent forum available in their country of habitual residence.',
            'Questions or complaints may be sent to hello@dropsauce.app.',
        ],
    },
]

export default function LegalNoticeScreen() {
    return (
        <ProfileSubpageLayout
            title="Legal Notice"
            subtitle="Last updated: June 9, 2026"
            onBack={() => router.back()}
        >
            <Text style={styles.intro}>
                Business identification and general legal information for Dropsauce.
            </Text>

            {NOTICE_SECTIONS.map((section) => (
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

                    {section.bullets?.map((bullet) => (
                        <Text key={bullet} style={styles.body}>
                            • {bullet}
                        </Text>
                    ))}
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
    detail: {
        fontFamily: theme.fontFamily.medium,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.base,
        color: theme.colors.foreground,
    },
}))
