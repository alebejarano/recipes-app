import { Ionicons } from '@expo/vector-icons'
import * as Application from 'expo-application'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, Linking, Text, View } from 'react-native'

import Button from '@/components/Button'
import Screen from '@/components/Screen'
import {
    cacheAppUpdateRequirement,
    getCachedAppUpdateRequirement,
    getInstalledAppVersion,
    getRemoteAppUpdateRequirement,
    isBuildNumberOlder,
    isVersionOlder,
    shouldCheckForMandatoryAppUpdate,
    type AppUpdateRequirement,
} from '@/features/app-update/services/appUpdateService'
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles'

type AppUpdateGateProps = {
    children: React.ReactNode
}

function requiresUpdate(requirement: AppUpdateRequirement | null) {
    const installedVersion = getInstalledAppVersion()
    const installedBuildNumber = Application.nativeBuildVersion
    return Boolean(
        requirement && (
            (installedVersion && requirement.minimumVersion && isVersionOlder(installedVersion, requirement.minimumVersion)) ||
            (installedBuildNumber && requirement.minimumAndroidBuildNumber && isBuildNumberOlder(installedBuildNumber, requirement.minimumAndroidBuildNumber))
        )
    )
}

export default function AppUpdateGate({ children }: AppUpdateGateProps) {
    const { t } = useTranslation()
    const [requirement, setRequirement] = useState<AppUpdateRequirement | null>(null)
    const [isReady, setIsReady] = useState(!shouldCheckForMandatoryAppUpdate())
    const [isOpeningStore, setIsOpeningStore] = useState(false)
    const requestIdRef = useRef(0)

    const checkForUpdate = useCallback(async () => {
        if (!shouldCheckForMandatoryAppUpdate()) {
            setRequirement(null)
            setIsReady(true)
            return
        }

        const requestId = ++requestIdRef.current
        setIsReady(false)

        const cachedRequirement = await getCachedAppUpdateRequirement()
        if (requestId !== requestIdRef.current) return

        if (requiresUpdate(cachedRequirement)) {
            setRequirement(cachedRequirement)
            setIsReady(true)
        }

        try {
            const remoteRequirement = await getRemoteAppUpdateRequirement()
            if (requestId !== requestIdRef.current) return

            await cacheAppUpdateRequirement(remoteRequirement)
            if (requestId !== requestIdRef.current) return

            setRequirement(requiresUpdate(remoteRequirement) ? remoteRequirement : null)
        } catch {
            // If the check cannot reach Supabase, the cached rule (if any) still
            // protects users. A first-time offline user can continue safely.
        } finally {
            if (requestId === requestIdRef.current) setIsReady(true)
        }
    }, [])

    useEffect(() => {
        // Defer the initial request until after this render has committed. This
        // keeps the effect as an external-system subscription rather than a
        // synchronous state update during React's effect phase.
        const initialCheck = setTimeout(() => void checkForUpdate(), 0)

        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') void checkForUpdate()
        })

        return () => {
            clearTimeout(initialCheck)
            requestIdRef.current += 1
            subscription.remove()
        }
    }, [checkForUpdate])

    const openStore = useCallback(async () => {
        if (!requirement) return

        setIsOpeningStore(true)
        try {
            await Linking.openURL(requirement.storeUrl)
        } finally {
            setIsOpeningStore(false)
        }
    }, [requirement])

    if (isReady && !requirement) return <>{children}</>

    if (!requirement) {
        return (
            <Screen scroll={false} contentStyle={styles.screenContent}>
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={styles.icon.color} />
                    <Text style={styles.loadingTitle}>{t('appUpdate.checkingTitle')}</Text>
                </View>
            </Screen>
        )
    }

    return (
        <Screen scroll={false} contentStyle={styles.screenContent}>
            <View style={styles.card}>
                <View style={styles.iconWrap}>
                    <Ionicons name="arrow-up-circle" size={52} color={styles.icon.color} />
                </View>
                <Text style={styles.title}>{t('appUpdate.title')}</Text>
                <Text style={styles.body}>{t('appUpdate.requiredBody')}</Text>
                <Button
                    onPress={() => void openStore()}
                    loading={isOpeningStore}
                    loadingLabel={t('appUpdate.openingStore')}
                    accessibilityLabel={t('appUpdate.updateNow')}
                >
                    {t('appUpdate.updateNow')}
                </Button>
            </View>
        </Screen>
    )
}

const styles = createThemedStyles((theme) => ({
    screenContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    card: {
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        gap: theme.spacing.lg,
        padding: theme.spacing.xl,
        borderRadius: theme.radii.xl,
        backgroundColor: theme.colors.secondary,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    loadingState: {
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    iconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        color: theme.colors.primary,
    },
    title: {
        ...theme.textVariants.title,
        color: theme.colors.foreground,
        textAlign: 'center',
    },
    loadingTitle: {
        ...theme.textVariants.body,
        color: theme.colors.mutedForeground,
        textAlign: 'center',
    },
    body: {
        ...theme.textVariants.body,
        color: theme.colors.mutedForeground,
        textAlign: 'center',
    },
}))
