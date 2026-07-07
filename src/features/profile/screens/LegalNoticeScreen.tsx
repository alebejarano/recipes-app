import { router } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

import ProfileSubpageLayout from '@/features/profile/components/ProfileSubpageLayout'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type NoticeSection = {
    title: string
    paragraphs?: readonly string[]
    details?: readonly string[]
    bullets?: readonly string[]
    footer?: string
}

const NOTICE_SECTIONS_BY_LOCALE: Record<'en' | 'es', readonly NoticeSection[]> = {
    en: [
    {
        title: '1. Service Provider',
        paragraphs: [
            'In accordance with Spanish Law 34/2002 on Information Society Services and Electronic Commerce (LSSI-CE), the provider of Dropsauce is:',
        ],
        details: [
            'Legal name: Anthony Lajusticia',
            'Trade name: Dropsauce',
            'Legal status: Self-employed professional registered in Spain under the Régimen Especial de Trabajadores Autónomos',
            'NIF: Z0570202Z',
            'Business address: Calle de Alcalá 54, 4º izquierda, 28014 Madrid',
            'Residence and place of establishment: Spain',
            'Email: hello@dropsauce.app',
        ],
        footer:
            'No prior administrative authorization, regulated-profession registration, or commercial-registry entry applies to the provision of this app unless stated otherwise.',
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
    ],
    es: [
        {
            title: '1. Prestador del Servicio',
            paragraphs: [
                'De conformidad con la Ley 34/2002, de Servicios de la Sociedad de la Informacion y de Comercio Electronico (LSSI-CE), el prestador de Dropsauce es:',
            ],
            details: [
                'Nombre legal: Anthony Lajusticia',
                'Nombre comercial: Dropsauce',
                'Situacion legal: Profesional autonomo dado de alta en Espana en el Regimen Especial de Trabajadores Autonomos',
                'NIF: Z0570202Z',
                'Domicilio profesional: Calle de Alcala 54, 4º izquierda, 28014 Madrid',
                'Residencia y lugar de establecimiento: Espana',
                'Email: hello@dropsauce.app',
            ],
            footer:
                'Salvo que se indique lo contrario, la prestacion de esta app no esta sujeta a autorizacion administrativa previa, colegiacion profesional regulada ni inscripcion en el registro mercantil.',
        },
        {
            title: '2. Finalidad',
            paragraphs: [
                'Este Aviso Legal identifica al prestador del servicio y establece las condiciones generales de acceso a Dropsauce y a sus paginas legales publicas.',
                'El uso de funciones de cuenta, nube y suscripcion tambien esta sujeto a los Terminos del Servicio y a la Politica de Privacidad.',
            ],
        },
        {
            title: '3. Propiedad Intelectual',
            paragraphs: [
                'El software, diseno, marca, logotipos, textos y materiales visuales originales de Dropsauce pertenecen a Anthony Lajusticia o se usan bajo licencia y estan protegidos por la normativa de propiedad intelectual.',
                'Ningun contenido puede copiarse, modificarse, distribuirse, someterse a ingenieria inversa ni explotarse comercialmente salvo que lo permita la ley, una licencia de codigo abierto aplicable o una autorizacion previa por escrito.',
                'Los usuarios conservan los derechos sobre el contenido que crean o suben, sujeto al permiso limitado necesario para prestar el servicio tal como se describe en los Terminos.',
            ],
        },
        {
            title: '4. Responsabilidad',
            paragraphs: [
                'Se realizan esfuerzos razonables para mantener el servicio y la informacion legal exactos, seguros y disponibles. Puede haber interrupciones temporales por mantenimiento, conectividad, servicios de terceros, incidentes de seguridad o acontecimientos fuera de un control razonable.',
                'Los enlaces externos y servicios de terceros, incluidos Apple App Store, Google Play, Supabase y PostHog, se rigen por sus propios terminos y politicas. Dropsauce no es responsable del contenido o disponibilidad de terceros mas alla de la responsabilidad impuesta por la ley.',
                'Nada en este aviso excluye responsabilidad imperativa ni derechos de los consumidores.',
            ],
        },
        {
            title: '5. Precios y Compras',
            paragraphs: [
                'Los precios de Premium, periodos de facturacion, impuestos aplicables y condiciones de suscripcion se muestran en Apple App Store o Google Play antes de la compra.',
                'Los pagos, renovaciones, cancelaciones y reembolsos de tienda se administran a traves de la tienda usada para la compra, sin limitar los derechos concedidos por la normativa imperativa de consumo.',
            ],
        },
        {
            title: '6. Ley Aplicable',
            paragraphs: [
                'Este Aviso Legal se rige por la ley espanola. Los consumidores conservan cualquier proteccion imperativa y el fuero legalmente competente disponible en su pais de residencia habitual.',
                'Las preguntas o reclamaciones pueden enviarse a hello@dropsauce.app.',
            ],
        },
    ],
}

export default function LegalNoticeScreen() {
    const { locale, t } = useTranslation()
    const sections = locale.toLowerCase().startsWith('es')
        ? NOTICE_SECTIONS_BY_LOCALE.es
        : NOTICE_SECTIONS_BY_LOCALE.en

    return (
        <ProfileSubpageLayout
            title={t('auth.legal.legalNoticeTitle')}
            subtitle={t('auth.legal.lastUpdated')}
            onBack={() => router.back()}
        >
            <Text style={styles.intro}>{t('auth.legal.legalIntro')}</Text>

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

                    {section.bullets?.map((bullet) => (
                        <Text key={bullet} style={styles.body}>
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
        ...theme.textVariants.body,
        lineHeight: theme.lineHeight.lg,
        color: theme.colors.mutedForeground,
    },
    detail: {
        ...theme.textVariants.label,
        color: theme.colors.foreground,
    },
}))
