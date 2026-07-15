import { router } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type TermsSection = {
    title: string
    paragraphs?: readonly string[]
    bullets?: readonly string[]
    footer?: string
}

const TERMS_SECTIONS_BY_LOCALE: Record<'en' | 'es', readonly TermsSection[]> = {
    en: [
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
            'Session replay, analytics autocapture, advertising tracking, and the transmission of recipe content, note content, or onboarding choices to PostHog are not enabled.',
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
    ],
    es: [
        {
            title: '1. Proveedor y Aceptación',
            paragraphs: [
                'Estos Términos del Servicio regulan el uso de Dropsauce, prestado bajo el nombre comercial DropSauce por Anthony Lajusticia, NIF Z0570202Z, profesional autónomo establecido en España y dado de alta en el Régimen Especial de Trabajadores Autónomos.',
                'Contacto: hello@dropsauce.app.',
                'Al crear una cuenta o usar Dropsauce, aceptas estos Términos. Si no puedes aceptarlos válidamente conforme a la ley aplicable, tu uso debe estar autorizado por un padre, madre o tutor legal.',
            ],
        },
        {
            title: '2. Servicio',
            paragraphs: [
                'Dropsauce ofrece herramientas para crear, importar, guardar, organizar, ver y compartir recetas, notas, carpetas, información de compra, imágenes y documentos relacionados con la cocina.',
                'El modo invitado puede usarse sin cuenta y guarda los datos localmente en el dispositivo. Una cuenta gratuita proporciona acceso a la cuenta y puede ser necesaria antes de comprar Premium.',
                'Premium puede ofrecer recetas y notas ilimitadas, copia de seguridad en la nube, sincronización entre dispositivos y almacenamiento en la nube para importaciones, sujeto a los límites de almacenamiento y uso razonable mostrados en la app.',
                'Las funciones pueden mejorarse, sustituirse o dejar de ofrecerse. Los cambios que afecten materialmente a una suscripción de pago se gestionarán conforme a la normativa de consumo aplicable.',
            ],
        },
        {
            title: '3. Cuentas',
            paragraphs: [
                'Los usuarios deben proporcionar información exacta de la cuenta, mantener confidenciales sus credenciales y avisar sin demora a hello@dropsauce.app si sospechan un acceso no autorizado.',
                'Ninguna persona puede usar el servicio para interferir con la cuenta o los datos de otro usuario. Dropsauce puede restringir o suspender el acceso cuando sea razonablemente necesario para afrontar problemas de seguridad, fraude, actividad ilícita o un incumplimiento material de estos Términos.',
            ],
        },
        {
            title: '4. Contenido del Usuario',
            paragraphs: [
                'Conservas la titularidad de las recetas, notas, imágenes, archivos y demás contenido que crees o subas.',
                'Concedes a Dropsauce un permiso limitado y no exclusivo para alojar, copiar, tratar, mostrar, respaldar y sincronizar ese contenido solo en la medida necesaria para prestar y asegurar las funciones que elijas.',
                'Eres responsable de disponer de los derechos necesarios para subir y usar el contenido. No debes subir contenido ilícito, malware, contenido que infrinja derechos de propiedad intelectual o privacidad, ni información muy sensible que no resulte apropiada para un servicio de gestión de recetas.',
            ],
        },
        {
            title: '5. Uso Aceptable',
            paragraphs: ['No debes:'],
            bullets: [
                'usar el servicio para actividades ilícitas, fraudulentas, abusivas o perjudiciales',
                'intentar acceder sin autorización a cuentas, sistemas, almacenamiento o datos',
                'eludir límites de plan, controles de seguridad o salvaguardas de subida',
                'interferir con el servicio o introducir código malicioso',
                'revender o explotar comercialmente el servicio sin permiso por escrito.',
            ],
        },
        {
            title: '6. Planes Free y Premium',
            paragraphs: [
                'Las funciones del plan, los precios, períodos de facturación, capacidad de almacenamiento y cualquier límite de uso razonable se muestran antes de la compra. Los precios mostrados en la tienda incluyen los impuestos aplicables cuando la tienda así lo indique.',
                'Las suscripciones Premium se compran y procesan a través de Apple App Store o Google Play. Apple o Google son responsables de recopilar los datos de pago y administrar la facturación de la tienda. Dropsauce no recibe datos completos de tarjeta o banco.',
                'Las suscripciones se renuevan automáticamente por el período de facturación seleccionado salvo cancelación desde la cuenta de la tienda antes de la renovación. Premium normalmente sigue disponible hasta el final del período pagado tras la cancelación.',
                'Los cambios de precio, la confirmación de compra, la facturación, la cancelación y los reembolsos también se rigen por los términos de la tienda usada para la compra. Nada de lo dispuesto en estos Términos limita los derechos imperativos de los consumidores ni cualquier derecho de reembolso previsto por la ley aplicable.',
                'Eliminar la cuenta de Dropsauce no cancela necesariamente una suscripción activa de la tienda. La suscripción también debe cancelarse en Apple App Store o Google Play.',
            ],
        },
        {
            title: '7. Almacenamiento en la Nube y Disponibilidad del Servicio',
            paragraphs: [
                'Las funciones en la nube requieren un dispositivo compatible, acceso a internet, una cuenta activa y cualquier derecho Premium exigible.',
                'Dropsauce aplica medidas razonables de seguridad y continuidad, pero no puede garantizar un funcionamiento ininterrumpido ni que toda copia local o en la nube vaya a poder recuperarse siempre. Los usuarios deben conservar copias independientes del contenido que sea importante para ellos.',
                'Si Premium finaliza, la sincronización en la nube o las nuevas subidas a la nube pueden detenerse. Se facilitarán mecanismos razonables de acceso, exportación, degradación o eliminación según exija la ley aplicable y conforme a la funcionalidad descrita en la app.',
            ],
        },
        {
            title: '8. Privacidad y Comunicaciones',
            paragraphs: [
                'El tratamiento de datos personales se rige por la Política de Privacidad.',
                'Pueden enviarse comunicaciones necesarias de cuenta, autenticación, seguridad, estado de facturación y servicio para operar la cuenta o ejecutar el contrato.',
                'Los correos de marketing y la analítica de PostHog son opcionales, están desactivados por defecto y requieren una aceptación separada. Pueden desactivarse desde el ajuste correspondiente de la app.',
                'No están habilitados `session replay`, `analytics autocapture`, el seguimiento publicitario ni la transmisión a PostHog del contenido de recetas, del contenido de notas o de las elecciones de onboarding.',
            ],
        },
        {
            title: '9. Propiedad Intelectual',
            paragraphs: [
                'Dropsauce, su diseño, software, marca y materiales originales pertenecen al proveedor o a sus licenciantes y están protegidos por la normativa aplicable de propiedad intelectual.',
                'Estos Términos solo conceden un derecho personal, limitado, revocable, no exclusivo e intransferible para usar la app conforme a estos Términos. No transfieren la titularidad de la app ni de la marca.',
            ],
        },
        {
            title: '10. Eliminación de Cuenta y Terminación',
            paragraphs: [
                'Puedes dejar de usar Dropsauce en cualquier momento. La eliminación de la cuenta está disponible desde Privacidad y seguridad o contactando con hello@dropsauce.app.',
                'La eliminación de la cuenta es permanente y borra la cuenta y el contenido asociado en la nube de los sistemas activos, sujeto a una retención limitada exigida por ley y a los ciclos de copia de seguridad del proveedor. El contenido local del dispositivo puede permanecer hasta que se elimine del dispositivo o se borren los datos de la app.',
                'Dropsauce puede terminar o suspender una cuenta por incumplimiento grave o reiterado, uso ilícito, fraude o riesgo de seguridad. Cuando sea razonablemente posible y legalmente permitido, se dará aviso y oportunidad de subsanar el problema.',
            ],
        },
        {
            title: '11. Garantías y Responsabilidad',
            paragraphs: [
                'Dropsauce se presta con diligencia y cuidado razonables. Salvo los derechos y garantías que no puedan excluirse legalmente, el servicio se presta sin garantías adicionales.',
                'Nada en estos Términos excluye o limita responsabilidad cuando tal exclusión esté prohibida, incluyendo responsabilidad por fraude, dolo, negligencia grave, daños personales causados por negligencia o derechos imperativos de los consumidores.',
                'En la medida permitida por la ley, Dropsauce no responde por pérdidas indirectas no razonablemente previsibles, pérdidas causadas por el dispositivo del usuario o por un servicio de terceros, ni por contenido subido sin los derechos necesarios.',
            ],
        },
        {
            title: '12. Cambios en Estos Términos',
            paragraphs: [
                'Estos Términos pueden actualizarse por razones legales, de seguridad, técnicas o del servicio. Los cambios materiales se comunicarán a través de la app o por otro canal adecuado antes de entrar en vigor cuando sea exigible.',
                'Un cambio no eliminará retroactivamente derechos de consumo ya adquiridos. Si un cambio material requiere un nuevo consentimiento, Dropsauce lo solicitará.',
            ],
        },
        {
            title: '13. Ley Aplicable y Disputas',
            paragraphs: [
                'Estos Términos se rigen por la ley española, sin privar a los consumidores de las protecciones imperativas disponibles conforme a la ley de su país de residencia habitual.',
                'Antes de iniciar procedimientos formales, se anima a los usuarios a contactar con hello@dropsauce.app para revisar el problema.',
                'En el caso de consumidores, las disputas podrán plantearse ante los juzgados determinados por la normativa imperativa de consumo y procesal. Ninguna cláusula de estos Términos obliga a un consumidor a renunciar a un fuero legalmente protegido.',
            ],
        },
        {
            title: '14. Documentos Legales',
            paragraphs: [
                'La Política de Privacidad y el Aviso Legal forman parte de la información legal de Dropsauce y están disponibles desde Privacidad y seguridad.',
            ],
        },
    ],
}

export default function TermsOfServiceScreen() {
    const { locale, t } = useTranslation()
    const sections = locale.toLowerCase().startsWith('es')
        ? TERMS_SECTIONS_BY_LOCALE.es
        : TERMS_SECTIONS_BY_LOCALE.en

    return (
        <ProfileSubpageLayout
            title={t('auth.legal.termsTitle')}
            subtitle={t('auth.legal.lastUpdated')}
            onBack={() => router.back()}
        >
            <Text style={styles.intro}>{t('auth.legal.termsIntro')}</Text>

            {sections.map((section) => (
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
        ...theme.textVariants.body,
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
        ...theme.textVariants.heading,
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
