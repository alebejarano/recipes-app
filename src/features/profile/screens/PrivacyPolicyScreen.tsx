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
        title: '1. Data Controller',
        paragraphs: [
            'This Privacy Policy explains how Dropsauce accesses, collects, uses, stores, shares, and deletes personal data.',
            'The data controller is:',
        ],
        details: [
            'Legal name: Anthony Lajusticia',
            'Trade name: DropSauce',
            'Status: Self-employed professional registered in Spain under the Régimen Especial de Trabajadores Autónomos',
            'NIF: Z0570202Z',
            'Business address: [pending]',
            'Country of establishment: Spain',
            'Privacy contact: hello@dropsauce.app',
        ],
        footer:
            'This policy applies under Regulation (EU) 2016/679 (GDPR), Spanish Organic Law 3/2018 (LOPDGDD), and other applicable Spanish data-protection rules.',
    },
    {
        title: '2. How the App Works',
        paragraphs: [
            'Dropsauce can be used without an account. Guest-mode recipes, notes, folders, shopping lists, images, imported files, onboarding choices, and app preferences are stored on the user\'s device.',
            'Guest content is not sent to Dropsauce cloud storage. If the user separately enables optional analytics, only the limited analytics data described below is transmitted, not recipe or note content.',
            'Users may create a free account. An account is required for Premium cloud backup, synchronization across devices, and cloud storage for imports.',
        ],
    },
    {
        title: '3. Personal Data We Process',
        groups: [
            {
                heading: 'Account and profile data',
                paragraphs: [
                    'When an account is created, we process the email address, authentication credentials through our authentication provider, internal user identifier, account timestamps, and any display name the user adds.',
                    'Passwords are handled by the authentication provider in protected form. Dropsauce does not receive or store a readable copy of the password.',
                ],
            },
            {
                heading: 'Preferences and communications',
                paragraphs: [
                    'We process choices relating to optional email updates, product communications, push-notification preferences, analytics consent, language or app preferences, and security or account requests.',
                    'The current app stores notification preferences but does not upload a push token or send push notifications unless that functionality is activated in a future version.',
                ],
            },
            {
                heading: 'Cloud content for Premium users',
                paragraphs: [
                    'When Premium cloud features are used, we process and store recipes, ingredients, instructions, notes, folders, meal information, images, imported PDF/JPG/PNG files, file names, file types, file sizes, checksums, storage paths, synchronization identifiers, and creation or update timestamps.',
                    'This content is processed only to provide cloud storage, backup, import management, synchronization, and related support or security functions.',
                ],
            },
            {
                heading: 'Subscription data',
                paragraphs: [
                    'Apple App Store or Google Play processes payment credentials and the purchase transaction. Dropsauce does not receive full card or bank details.',
                    'Dropsauce may receive and store limited subscription information needed to provide Premium, such as the store, product or plan, billing period, purchase status, entitlement status, renewal or expiry information, and transaction or receipt identifiers.',
                ],
            },
            {
                heading: 'Technical and security data',
                paragraphs: [
                    'Our service providers may process IP address, request timestamps, authentication and security logs, app version, operating system, device type, network status, and error categories as needed to operate, secure, and troubleshoot the service.',
                    'Camera, photo-library, and document access occurs only after the user chooses the relevant feature and grants the operating-system permission. Selected files are stored locally or uploaded to cloud storage according to the user\'s plan and action.',
                ],
            },
        ],
    },
    {
        title: '4. Optional PostHog Analytics',
        paragraphs: [
            'Analytics and diagnostics are optional, off by default, and activated only when the user enables the Analytics & diagnostics setting. Consent can be withdrawn at any time from Privacy & Security settings.',
            'When enabled, Dropsauce uses PostHog\'s European service endpoint. The app sends an automatically generated anonymous analytics identifier, event time, app and device technical properties, and limited event properties.',
            'Events may include app opens, account creation, onboarding answer categories, recipe or note creation, Premium upgrade interactions, successful purchase status, request failures or timeouts, offline fallback saves, synchronization retries, and upload or import retry status.',
        ],
        bullets: [
            'PostHog autocapture is disabled',
            'session replay is disabled',
            'automatic GeoIP enrichment is disabled',
            'Dropsauce does not call PostHog identify and does not send the account email or name',
            'recipe titles, recipe text, ingredients, instructions, notes, file names, payment details, authentication tokens, full URLs, and raw error messages are excluded.',
        ],
        footer:
            'The legal basis is consent. Disabling analytics stops new analytics events. Previously collected events remain until their retention period expires or deletion is requested where the identifier can be matched.',
    },
    {
        title: '5. Purposes and Legal Bases',
        groups: [
            {
                heading: 'Performance of a contract',
                paragraphs: [
                    'To create and manage accounts, authenticate users, provide local and cloud app features, synchronize content, administer Premium entitlements, provide support, and send necessary account or service communications.',
                ],
            },
            {
                heading: 'Consent',
                paragraphs: [
                    'To process optional PostHog analytics and diagnostics, send optional marketing or product emails, and use optional device permissions. Consent may be withdrawn at any time without affecting earlier lawful processing.',
                ],
            },
            {
                heading: 'Legal obligations',
                paragraphs: [
                    'To comply with tax, accounting, consumer-protection, law-enforcement, and other binding legal requirements.',
                ],
            },
            {
                heading: 'Legitimate interests',
                paragraphs: [
                    'To protect accounts and infrastructure, prevent abuse or fraud, maintain service security, establish or defend legal claims, and improve reliability using data that is necessary and proportionate for those purposes.',
                ],
            },
        ],
    },
    {
        title: '6. Service Providers and Recipients',
        paragraphs: [
            'Personal data is not sold. It may be made available only as necessary to service providers acting for Dropsauce or to independent providers involved in a user\'s transaction.',
        ],
        bullets: [
            'Supabase: authentication, database, cloud storage, synchronization, and backend functions',
            'PostHog: optional analytics and diagnostics when the user opts in',
            'Apple App Store and Google Play: subscription purchase, payment, billing, cancellation, and refund administration',
            'Professional advisers, courts, regulators, public authorities, or law-enforcement bodies when legally required or necessary to protect legal rights.',
        ],
    },
    {
        title: '7. European Storage and International Transfers',
        paragraphs: [
            'Dropsauce configures its primary cloud database, file storage, backend, and PostHog analytics data residency in the European Union.',
            'Some providers or their subprocessors may access limited data from outside the European Economic Area for support, security, or service operation. Where this occurs, Dropsauce relies on an applicable adequacy decision, Standard Contractual Clauses, or another lawful GDPR transfer safeguard.',
            'Apple and Google process store and payment data under their own privacy terms and international-transfer arrangements.',
        ],
    },
    {
        title: '8. Retention and Deletion',
        paragraphs: [
            'Guest data remains on the device until the user deletes it, clears the app data, or uninstalls the app. Dropsauce cannot recover guest data that was never synchronized.',
            'Account, profile, preference, entitlement, and cloud content data is retained while the account is active or as needed to provide the requested service.',
            'A user can delete the account from Privacy & Security settings, follow the instructions at https://dropsauce.app/delete-account, or request deletion at hello@dropsauce.app. Account deletion removes the account, cloud database content, stored recipe images, imported documents, and import-usage state from active systems.',
            'Limited records may be retained when required by tax, accounting, fraud-prevention, dispute-resolution, or other legal obligations. Residual encrypted backups are deleted or overwritten according to the service provider\'s backup cycle and are not used for ordinary business purposes.',
            'Optional analytics events are retained only for the configured analytics retention period and should not be kept longer than necessary for product and reliability analysis.',
        ],
    },
    {
        title: '9. Security',
        paragraphs: [
            'Dropsauce uses measures appropriate to the risk, including encrypted network transport, protected authentication sessions, access controls, database row-level security, private storage for imported documents, signed access links, file-type and size validation, and restricted backend credentials.',
            'Recipe images stored for cloud use may be served through a public object URL. The URL is not intended as an access-control mechanism, so users should not upload confidential or highly sensitive material as a recipe image.',
            'No internet service can guarantee absolute security. Users should use a strong, unique password and protect access to their device and store account.',
        ],
    },
    {
        title: '10. Rights',
        paragraphs: [
            'Depending on the circumstances, users may exercise the rights of access, rectification, erasure, restriction, objection, and data portability, and may withdraw consent at any time.',
            'Requests can be sent to hello@dropsauce.app. Identity verification may be required before a request is completed. Requests are handled within the periods required by the GDPR.',
            'Users may lodge a complaint with the Spanish Data Protection Agency (Agencia Española de Protección de Datos) at www.aepd.es or with the supervisory authority where they live or work.',
        ],
    },
    {
        title: '11. Required Data and Automated Decisions',
        paragraphs: [
            'An email address and authentication credential are required to create an account. If they are not provided, an account and cloud features cannot be offered, but guest mode remains available.',
            'Data needed for store billing and entitlement verification is required to provide Premium.',
            'Dropsauce does not make decisions based solely on automated processing that produce legal or similarly significant effects, and does not use personal data for advertising profiles.',
        ],
    },
    {
        title: '12. Children',
        paragraphs: [
            'Dropsauce is a general-audience recipe application and is not directed specifically to children. A minor who cannot validly accept these terms or provide the necessary consent under applicable law must use the service only with authorization from a parent or legal guardian.',
        ],
    },
    {
        title: '13. Changes',
        paragraphs: [
            'This policy may be updated to reflect legal, technical, or service changes. Material changes will be communicated in the app or through another appropriate channel before they take effect where required.',
        ],
    },
]

export default function PrivacyPolicyScreen() {
    return (
        <ProfileSubpageLayout
            title="Privacy Policy"
            subtitle="Last updated: June 9, 2026"
            onBack={() => router.back()}
        >
            <Text style={styles.intro}>
                This policy explains how Dropsauce handles personal data in guest, account, and
                Premium modes.
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
