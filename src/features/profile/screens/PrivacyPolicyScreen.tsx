import { router } from 'expo-router'
import { Text, View } from 'react-native'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { useTranslation } from '@/localization'
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

const POLICY_SECTIONS_BY_LOCALE: Record<'en' | 'es', readonly PolicySection[]> = {
    en: [
    {
        title: '1. Data Controller',
        paragraphs: [
            'This Privacy Policy explains how Dropsauce accesses, collects, uses, stores, shares, and deletes personal data.',
            'The data controller is:',
        ],
        details: [
            'Legal name: Anthony Lajusticia',
            'Trade name: Dropsauce',
            'Status: Self-employed professional registered in Spain under the Régimen Especial de Trabajadores Autónomos',
            'NIF: Z0570202Z',
            'Business address: Calle de Alcalá 54, 4º izquierda, 28014 Madrid',
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
                        'We process choices relating to onboarding, optional email updates, product communications, push-notification preferences, analytics consent, language or app preferences, and security or account requests.',
                        'Onboarding choices are stored on the device in guest mode and used to tailor the first-run product experience unless the user later creates an account and enables cloud features.',
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
                    'Camera access occurs only after the user chooses to take a recipe-cover photo and grants the operating-system permission. Recipe-cover photos and recipe-import files are selected one at a time through the device\'s system photo or file picker; Dropsauce accesses only the item the user selects and does not scan or browse the user\'s photo library or device storage. Selected files are stored locally or uploaded to cloud storage according to the user\'s plan and action.',
                ],
            },
        ],
    },
    {
        title: '4. Optional PostHog Analytics',
        paragraphs: [
            'Analytics and diagnostics are optional, off by default, and activated only when the user enables the Analytics & diagnostics setting. Consent can be withdrawn at any time from Privacy & Security settings.',
            'When enabled, Dropsauce uses PostHog\'s European service endpoint. The app sends an automatically generated anonymous analytics identifier, event time, app and device technical properties, and limited event properties.',
            'Events may include app opens, account creation, recipe or note creation, Premium upgrade interactions, successful purchase status, request failures or timeouts, offline fallback saves, synchronization retries, and upload or import retry status.',
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
    ],
    es: [
        {
            title: '1. Responsable del Tratamiento',
            paragraphs: [
                'Esta Política de Privacidad explica cómo Dropsauce accede, recopila, usa, almacena, comparte y elimina datos personales.',
                'El responsable del tratamiento es:',
            ],
            details: [
                'Nombre legal: Anthony Lajusticia',
                'Nombre comercial: Dropsauce',
                'Situación: Profesional autónomo dado de alta en España en el Régimen Especial de Trabajadores Autónomos',
                'NIF: Z0570202Z',
                'Domicilio profesional: Calle de Alcalá 54, 4º izquierda, 28014 Madrid',
                'País de establecimiento: España',
                'Contacto de privacidad: hello@dropsauce.app',
            ],
            footer:
                'Esta política se aplica conforme al Reglamento (UE) 2016/679 (RGPD), la Ley Orgánica 3/2018 (LOPDGDD) y demás normativa española aplicable en materia de protección de datos.',
        },
        {
            title: '2. Cómo Funciona la App',
            paragraphs: [
                'Dropsauce puede usarse sin cuenta. Las recetas, notas, carpetas, listas de compras, imágenes, archivos importados, elecciones de onboarding y preferencias de la app en modo invitado se almacenan en el dispositivo del usuario.',
                'El contenido de invitado no se envía al almacenamiento en la nube de Dropsauce. Si el usuario activa por separado la analítica opcional, solo se transmiten los datos limitados de analítica descritos abajo, no el contenido de recetas o notas.',
                'Los usuarios pueden crear una cuenta gratuita. La cuenta es necesaria para la copia de seguridad Premium en la nube, la sincronización entre dispositivos y el almacenamiento en la nube de las importaciones.',
            ],
        },
        {
            title: '3. Datos Personales que Tratamos',
            groups: [
                {
                    heading: 'Datos de cuenta y perfil',
                    paragraphs: [
                        'Cuando se crea una cuenta, tratamos la dirección de correo electrónico, las credenciales de autenticación a través de nuestro proveedor de autenticación, el identificador interno de usuario, las marcas temporales de la cuenta y cualquier nombre para mostrar que el usuario añada.',
                        'Las contraseñas son tratadas por el proveedor de autenticación de forma protegida. Dropsauce no recibe ni almacena una copia legible de la contraseña.',
                    ],
                },
                {
                    heading: 'Preferencias y comunicaciones',
                    paragraphs: [
                        'Tratamos elecciones relacionadas con el onboarding, actualizaciones opcionales por correo, comunicaciones de producto, preferencias de notificaciones push, consentimiento de analítica, idioma o preferencias de la app, y solicitudes de seguridad o de cuenta.',
                        'Las elecciones de onboarding se guardan en el dispositivo en modo invitado y se usan para adaptar la experiencia inicial del producto, salvo que el usuario cree después una cuenta y active funciones en la nube.',
                        'La versión actual de la app guarda preferencias de notificaciones, pero no sube un token push ni envía notificaciones push salvo que esa funcionalidad se active en una versión futura.',
                    ],
                },
                {
                    heading: 'Contenido en la nube para usuarios Premium',
                    paragraphs: [
                        'Cuando se usan funciones Premium en la nube, tratamos y almacenamos recetas, ingredientes, instrucciones, notas, carpetas, información de comidas, imágenes, archivos importados PDF/JPG/PNG, nombres de archivo, tipos de archivo, tamaños de archivo, checksums, rutas de almacenamiento, identificadores de sincronización y marcas temporales de creación o actualización.',
                        'Este contenido se trata solo para prestar almacenamiento en la nube, copia de seguridad, gestión de importaciones, sincronización y funciones relacionadas de soporte o seguridad.',
                    ],
                },
                {
                    heading: 'Datos de suscripción',
                    paragraphs: [
                        'Apple App Store o Google Play tratan las credenciales de pago y la transacción de compra. Dropsauce no recibe datos completos de tarjeta o banco.',
                        'Dropsauce puede recibir y almacenar información limitada de suscripción necesaria para prestar Premium, como la tienda, el producto o plan, el período de facturación, el estado de compra, el estado del derecho de acceso, la información de renovación o vencimiento y los identificadores de transacción o recibo.',
                    ],
                },
                {
                    heading: 'Datos técnicos y de seguridad',
                    paragraphs: [
                        'Nuestros proveedores de servicio pueden tratar la dirección IP, marcas temporales de solicitudes, registros de autenticación y seguridad, versión de la app, sistema operativo, tipo de dispositivo, estado de la red y categorías de error cuando sea necesario para operar, asegurar y diagnosticar el servicio.',
                        'El acceso a la cámara solo ocurre después de que el usuario elija tomar una foto de portada para una receta y conceda el permiso del sistema operativo. Las fotos de portada y los archivos de recetas se seleccionan de uno en uno mediante el selector de fotos o archivos del dispositivo; Dropsauce solo accede al elemento que el usuario selecciona y no explora ni analiza la fototeca ni el almacenamiento del dispositivo. Los archivos seleccionados se almacenan localmente o se suben al almacenamiento en la nube según el plan y la acción del usuario.',
                    ],
                },
            ],
        },
        {
            title: '4. Analítica Opcional con PostHog',
            paragraphs: [
                'La analítica y los diagnósticos son opcionales, están desactivados por defecto y solo se activan cuando el usuario habilita el ajuste de Analítica y diagnóstico. El consentimiento puede retirarse en cualquier momento desde Privacidad y seguridad.',
                'Cuando está activado, Dropsauce usa el endpoint europeo de PostHog. La app envía un identificador anónimo de analítica generado automáticamente, la hora del evento, propiedades técnicas de la app y el dispositivo, y propiedades limitadas del evento.',
                'Los eventos pueden incluir aperturas de la app, creación de cuenta, creación de recetas o notas, interacciones de mejora a Premium, estado de compra correcta, fallos o timeouts de solicitudes, guardados sin conexión y reintentos de sincronización o de subida/importación.',
            ],
            bullets: [
                'La autocaptura de PostHog está desactivada',
                'La reproducción de sesión está desactivada',
                'El enriquecimiento GeoIP automático está desactivado',
                'Dropsauce no llama a PostHog identify ni envía el email o el nombre de la cuenta',
                'Se excluyen títulos de recetas, texto de recetas, ingredientes, instrucciones, notas, nombres de archivo, datos de pago, tokens de autenticación, URLs completas y mensajes de error en bruto.',
            ],
            footer:
                'La base jurídica es el consentimiento. Desactivar la analítica detiene los nuevos eventos de analítica. Los eventos recogidos anteriormente se mantienen hasta que expire su período de retención o se solicite su eliminación cuando el identificador pueda relacionarse.',
        },
        {
            title: '5. Finalidades y Bases Jurídicas',
            groups: [
                {
                    heading: 'Ejecución de un contrato',
                    paragraphs: [
                        'Para crear y gestionar cuentas, autenticar usuarios, prestar funciones locales y en la nube, sincronizar contenido, administrar los derechos Premium, prestar soporte y enviar comunicaciones necesarias de cuenta o servicio.',
                    ],
                },
                {
                    heading: 'Consentimiento',
                    paragraphs: [
                        'Para tratar la analítica y los diagnósticos opcionales de PostHog, enviar correos opcionales de marketing o producto y usar permisos opcionales del dispositivo. El consentimiento puede retirarse en cualquier momento sin afectar al tratamiento lícito anterior.',
                    ],
                },
                {
                    heading: 'Obligaciones legales',
                    paragraphs: [
                        'Para cumplir obligaciones fiscales, contables, de protección de consumidores, requerimientos de autoridades y otras exigencias legales vinculantes.',
                    ],
                },
                {
                    heading: 'Intereses legítimos',
                    paragraphs: [
                        'Para proteger cuentas e infraestructura, prevenir abuso o fraude, mantener la seguridad del servicio, formular o defender reclamaciones legales y mejorar la fiabilidad usando datos necesarios y proporcionados para esas finalidades.',
                    ],
                },
            ],
        },
        {
            title: '6. Proveedores de Servicio y Destinatarios',
            paragraphs: [
                'Los datos personales no se venden. Solo pueden ponerse a disposición de proveedores de servicio que actúan para Dropsauce o de proveedores independientes implicados en una transacción del usuario cuando sea necesario.',
            ],
            bullets: [
                'Supabase: autenticación, base de datos, almacenamiento en la nube, sincronización y funciones backend',
                'PostHog: analítica y diagnósticos opcionales cuando el usuario se adhiere',
                'Apple App Store y Google Play: compra de suscripciones, pago, facturación, cancelación y administración de reembolsos',
                'Asesores profesionales, juzgados, reguladores, autoridades públicas o fuerzas de seguridad cuando sea legalmente exigible o necesario para proteger derechos legales.',
            ],
        },
        {
            title: '7. Almacenamiento Europeo y Transferencias Internacionales',
            paragraphs: [
                'Dropsauce configura la residencia principal de su base de datos en la nube, almacenamiento de archivos, backend y analítica de PostHog en la Unión Europea.',
                'Algunos proveedores o sus subencargados pueden acceder a datos limitados desde fuera del Espacio Económico Europeo por soporte, seguridad u operación del servicio. Cuando esto ocurre, Dropsauce se apoya en una decisión de adecuación aplicable, Cláusulas Contractuales Tipo u otra garantía lícita de transferencia conforme al RGPD.',
                'Apple y Google tratan los datos de tienda y pago conforme a sus propios términos de privacidad y mecanismos de transferencias internacionales.',
            ],
        },
        {
            title: '8. Conservación y Eliminación',
            paragraphs: [
                'Los datos de invitado permanecen en el dispositivo hasta que el usuario los elimine, borre los datos de la app o desinstale la app. Dropsauce no puede recuperar datos de invitado que nunca se hayan sincronizado.',
                'Los datos de cuenta, perfil, preferencias, derechos y contenido en la nube se conservan mientras la cuenta esté activa o mientras sean necesarios para prestar el servicio solicitado.',
                'El usuario puede eliminar la cuenta desde Privacidad y seguridad, seguir las instrucciones en https://dropsauce.app/delete-account o solicitar la eliminación en hello@dropsauce.app. La eliminación de la cuenta borra la cuenta, el contenido de la base de datos en la nube, las imágenes de recetas almacenadas, los documentos importados y el estado de uso de importaciones de los sistemas activos.',
                'Pueden conservarse registros limitados cuando lo exijan obligaciones fiscales, contables, de prevención del fraude, resolución de disputas u otras obligaciones legales. Las copias de seguridad cifradas residuales se eliminan o sobrescriben según el ciclo de backups del proveedor de servicio y no se usan para fines ordinarios del negocio.',
                'Los eventos opcionales de analítica solo se conservan durante el período configurado de retención de analítica y no deben guardarse más tiempo del necesario para el análisis del producto y la fiabilidad.',
            ],
        },
        {
            title: '9. Seguridad',
            paragraphs: [
                'Dropsauce usa medidas adecuadas al riesgo, incluyendo transporte cifrado de red, sesiones de autenticación protegidas, controles de acceso, seguridad a nivel de fila en la base de datos, almacenamiento privado para documentos importados, enlaces firmados de acceso, validación de tipo y tamaño de archivo y credenciales backend restringidas.',
                'Las imágenes de recetas almacenadas para uso en la nube pueden servirse mediante una URL pública del objeto. La URL no está pensada como mecanismo de control de acceso, por lo que los usuarios no deben subir material confidencial o muy sensible como imagen de receta.',
                'Ningún servicio de internet puede garantizar seguridad absoluta. Los usuarios deben usar una contraseña robusta y única y proteger el acceso a su dispositivo y a su cuenta de tienda.',
            ],
        },
        {
            title: '10. Derechos',
            paragraphs: [
                'Según las circunstancias, los usuarios pueden ejercer los derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad, y pueden retirar su consentimiento en cualquier momento.',
                'Las solicitudes pueden enviarse a hello@dropsauce.app. Puede requerirse verificación de identidad antes de completar una solicitud. Las solicitudes se gestionan dentro de los plazos exigidos por el RGPD.',
                'Los usuarios pueden presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es) o ante la autoridad de control del lugar donde vivan o trabajen.',
            ],
        },
        {
            title: '11. Datos Necesarios y Decisiones Automatizadas',
            paragraphs: [
                'Se requiere una dirección de email y una credencial de autenticación para crear una cuenta. Si no se facilitan, no podrán ofrecerse cuenta ni funciones en la nube, aunque el modo invitado seguirá disponible.',
                'Los datos necesarios para la facturación de tienda y la verificación de derechos son necesarios para prestar Premium.',
                'Dropsauce no toma decisiones basadas únicamente en tratamientos automatizados que produzcan efectos jurídicos o significativamente similares, y no usa datos personales para perfiles publicitarios.',
            ],
        },
        {
            title: '12. Menores',
            paragraphs: [
                'Dropsauce es una aplicación de recetas para público general y no está dirigida específicamente a menores. Un menor que no pueda aceptar válidamente estos términos o prestar el consentimiento necesario según la ley aplicable solo debe usar el servicio con autorización de un padre, madre o tutor legal.',
            ],
        },
        {
            title: '13. Cambios',
            paragraphs: [
                'Esta política puede actualizarse para reflejar cambios legales, técnicos o del servicio. Los cambios materiales se comunicarán en la app o a través de otro canal apropiado antes de que surtan efecto cuando sea exigible.',
            ],
        },
    ],
}

export default function PrivacyPolicyScreen() {
    const { locale, t } = useTranslation()
    const sections = locale.toLowerCase().startsWith('es')
        ? POLICY_SECTIONS_BY_LOCALE.es
        : POLICY_SECTIONS_BY_LOCALE.en

    return (
        <ProfileSubpageLayout
            title={t('auth.legal.privacyPolicyTitle')}
            subtitle={t('auth.legal.lastUpdated')}
            onBack={() => router.back()}
        >
            <Text style={styles.intro}>{t('auth.legal.privacyIntro')}</Text>

            {sections.map((section) => (
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
    group: {
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    groupTitle: {
        ...theme.textVariants.label,
        color: theme.colors.foreground,
    },
    body: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.lg,
        color: theme.colors.mutedForeground,
    },
    detail: {
        ...theme.textVariants.label,
        color: theme.colors.foreground,
    },
    bullet: {
        fontFamily: theme.fontFamily.regular,
        fontSize: theme.fontSize.base,
        lineHeight: theme.lineHeight.lg,
        color: theme.colors.mutedForeground,
    },
}))
