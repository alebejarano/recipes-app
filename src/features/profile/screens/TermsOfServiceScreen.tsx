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
        title: '1. Provider and Acceptance',
        paragraphs: [
            'These Terms of Service govern the use of Dropsauce, provided under the trade name DropSauce by Anthony Lajusticia, NIF Z0570202Z, a self-employed professional established in Spain and registered under the Régimen Especial de Trabajadores Autónomos.',
            'Contact: hello@dropsauce.app.',
            'By creating an account or using Dropsauce, you agree to these Terms. If you cannot validly agree under applicable law, a parent or legal guardian must authorize your use.',
        ],
    },
    {
        title: '2. Service',
        paragraphs: [
            'Dropsauce provides tools for creating, importing, saving, organizing, viewing, and sharing recipes, notes, folders, shopping information, images, and cooking-related documents.',
            'Guest mode can be used without an account and stores data locally on the device. A free account provides account access and may be required before purchasing Premium.',
            'Premium may provide unlimited recipes and notes, cloud backup, synchronization across devices, and cloud storage for recipe imports, subject to the storage and fair-use limits shown in the app.',
            'Features may be improved, replaced, or discontinued. Changes that materially affect a paid subscription will be handled in accordance with applicable consumer law.',
        ],
    },
    {
        title: '3. Accounts',
        paragraphs: [
            'Users must provide accurate account information, keep credentials confidential, and promptly notify hello@dropsauce.app of suspected unauthorized access.',
            'One person may not use the service to interfere with another user\'s account or data. Dropsauce may restrict or suspend access when reasonably necessary to address security, fraud, unlawful activity, or a material breach of these Terms.',
        ],
    },
    {
        title: '4. User Content',
        paragraphs: [
            'You retain ownership of recipes, notes, images, files, and other content you create or upload.',
            'You grant Dropsauce a limited, non-exclusive permission to host, copy, process, display, back up, and synchronize that content only as needed to provide and secure the features you choose.',
            'You are responsible for having the rights needed to upload and use the content. You must not upload unlawful content, malware, content that infringes intellectual-property or privacy rights, or highly sensitive information that is not appropriate for a recipe-management service.',
        ],
    },
    {
        title: '5. Acceptable Use',
        paragraphs: ['You must not:'],
        bullets: [
            'use the service for unlawful, fraudulent, abusive, or harmful activity',
            'attempt unauthorized access to accounts, systems, storage, or data',
            'circumvent plan limits, security controls, or upload safeguards',
            'interfere with the service or introduce malicious code',
            'resell or commercially exploit the service without written permission.',
        ],
    },
    {
        title: '6. Free and Premium Plans',
        paragraphs: [
            'Plan features, prices, billing periods, storage allowances, and any fair-use limits are displayed before purchase. Prices shown in the store checkout include applicable taxes when the store indicates this.',
            'Premium subscriptions are purchased and processed through Apple App Store or Google Play. Apple or Google is responsible for collecting payment details and administering store billing. Dropsauce does not receive full card or bank details.',
            'Subscriptions renew automatically for the selected billing period unless canceled through the store account before renewal. Premium normally remains available until the end of the paid period after cancellation.',
            'Price changes, purchase confirmation, billing, cancellation, and refunds are also governed by the terms of the store used for purchase. Nothing in these Terms limits mandatory consumer rights or any refund right provided by applicable law.',
            'Deleting the Dropsauce account does not necessarily cancel an active store subscription. The subscription must also be canceled in Apple App Store or Google Play.',
        ],
    },
    {
        title: '7. Cloud Storage and Service Availability',
        paragraphs: [
            'Cloud features require a compatible device, internet access, an active account, and any required Premium entitlement.',
            'Dropsauce applies reasonable security and continuity measures but cannot guarantee uninterrupted operation or that every local or cloud copy will always be recoverable. Users should keep independent copies of content that is important to them.',
            'If Premium ends, cloud synchronization or new cloud uploads may stop. Reasonable access, export, downgrade, or deletion arrangements will be provided as required by applicable law and the functionality described in the app.',
        ],
    },
    {
        title: '8. Privacy and Communications',
        paragraphs: [
            'Personal-data processing is governed by the Privacy Policy.',
            'Necessary account, authentication, security, billing-status, and service communications may be sent to operate the account or perform the contract.',
            'Marketing emails and PostHog analytics are optional, off by default, and require a separate opt-in. They can be disabled through the relevant app setting.',
            'Session replay, analytics autocapture, advertising tracking, and the transmission of recipe or note content to PostHog are not enabled.',
        ],
    },
    {
        title: '9. Intellectual Property',
        paragraphs: [
            'Dropsauce, its design, software, branding, and original materials are owned by the provider or its licensors and are protected by applicable intellectual-property laws.',
            'These Terms grant only a personal, limited, revocable, non-exclusive, and non-transferable right to use the app in accordance with these Terms. They do not transfer ownership of the app or brand.',
        ],
    },
    {
        title: '10. Account Deletion and Termination',
        paragraphs: [
            'You may stop using Dropsauce at any time. Account deletion is available from Privacy & Security settings or by contacting hello@dropsauce.app.',
            'Account deletion is permanent and removes the account and associated cloud content from active systems, subject to limited retention required by law and provider backup cycles. Local device content may remain until it is deleted from the device or app data is cleared.',
            'Dropsauce may terminate or suspend an account for a serious or repeated breach, unlawful use, fraud, or a security risk. Where reasonably possible and legally permitted, notice and an opportunity to remedy the issue will be provided.',
        ],
    },
    {
        title: '11. Warranties and Liability',
        paragraphs: [
            'Dropsauce is provided with reasonable care and skill. Except for rights and guarantees that cannot legally be excluded, the service is provided without additional warranties.',
            'Nothing in these Terms excludes or limits liability where exclusion is prohibited, including liability for fraud, willful misconduct, gross negligence, personal injury caused by negligence, or mandatory consumer rights.',
            'To the extent permitted by law, Dropsauce is not responsible for indirect losses that were not reasonably foreseeable, loss caused by the user\'s device or third-party service, or content uploaded without the necessary rights.',
        ],
    },
    {
        title: '12. Changes to These Terms',
        paragraphs: [
            'These Terms may be updated for legal, security, technical, or service reasons. Material changes will be communicated through the app or another appropriate channel before taking effect where required.',
            'A change will not retroactively remove accrued consumer rights. If a material change requires renewed consent, Dropsauce will request it.',
        ],
    },
    {
        title: '13. Law and Disputes',
        paragraphs: [
            'These Terms are governed by Spanish law, without depriving consumers of mandatory protections available under the law of their country of habitual residence.',
            'Before starting formal proceedings, users are encouraged to contact hello@dropsauce.app so the issue can be reviewed.',
            'For consumers, disputes may be brought before the courts determined by mandatory consumer and procedural law. No clause in these Terms requires a consumer to waive a legally protected forum.',
        ],
    },
    {
        title: '14. Legal Documents',
        paragraphs: [
            'The Privacy Policy and Legal Notice form part of the legal information for Dropsauce and are available from Privacy & Security settings.',
        ],
    },
]

export default function TermsOfServiceScreen() {
    return (
        <ProfileSubpageLayout
            title="Terms of Service"
            subtitle="Last updated: June 9, 2026"
            onBack={() => router.back()}
        >
            <Text style={styles.intro}>
                These terms describe the service, subscriptions, user responsibilities, and
                mandatory consumer protections.
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
