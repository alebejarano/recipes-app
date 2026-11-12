import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Application from 'expo-application'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

import { isProductionAppEnv } from '@/lib/appEnv'
import { supabase } from '@/lib/supabase'

const APP_UPDATE_REQUIREMENT_CACHE_KEY = 'app-update.requirement.v1'

type AppReleaseRequirementRow = {
    min_ios_version: string | null
    min_android_version: string | null
    min_android_build_number: number | null
    ios_store_url: string | null
    android_store_url: string | null
}

export type AppUpdateRequirement = {
    minimumVersion: string | null
    minimumAndroidBuildNumber: number | null
    storeUrl: string
}

function normalizeVersion(version: string | null | undefined): number[] | null {
    if (!version) return null

    const match = version.trim().match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-+].*)?$/)
    if (!match) return null

    return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)]
}

export function isVersionOlder(installedVersion: string, minimumVersion: string): boolean {
    const installed = normalizeVersion(installedVersion)
    const minimum = normalizeVersion(minimumVersion)

    // A malformed remote value must never lock customers out of the app.
    if (!installed || !minimum) return false

    for (let index = 0; index < minimum.length; index += 1) {
        if (installed[index] !== minimum[index]) {
            return installed[index] < minimum[index]
        }
    }

    return false
}

export function isBuildNumberOlder(installedBuildNumber: string, minimumBuildNumber: number): boolean {
    const installed = Number(installedBuildNumber)
    return Number.isSafeInteger(installed) && installed < minimumBuildNumber
}

function isSafeStoreUrl(value: string | null): value is string {
    if (!value) return false

    try {
        const url = new URL(value)
        return url.protocol === 'https:'
    } catch {
        return false
    }
}

function getAndroidStoreUrl() {
    const applicationId = Application.applicationId
    return applicationId ? `https://play.google.com/store/apps/details?id=${applicationId}` : null
}

function toRequirement(row: AppReleaseRequirementRow): AppUpdateRequirement | null {
    const isIos = Platform.OS === 'ios'
    const minimumVersion = isIos ? row.min_ios_version : row.min_android_version
    const minimumAndroidBuildNumber = !isIos && Number.isSafeInteger(row.min_android_build_number) && (row.min_android_build_number ?? 0) > 0
        ? row.min_android_build_number
        : null
    const configuredStoreUrl = isIos ? row.ios_store_url : row.android_store_url
    const storeUrl = isSafeStoreUrl(configuredStoreUrl)
        ? configuredStoreUrl
        : isIos
          ? null
          : getAndroidStoreUrl()

    const hasMinimumVersion = Boolean(minimumVersion && normalizeVersion(minimumVersion))
    if ((!hasMinimumVersion && !minimumAndroidBuildNumber) || !storeUrl) return null

    return {
        minimumVersion: hasMinimumVersion ? minimumVersion : null,
        minimumAndroidBuildNumber,
        storeUrl,
    }
}

export function getInstalledAppVersion(): string | null {
    return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? null
}

export function shouldCheckForMandatoryAppUpdate() {
    return isProductionAppEnv && Platform.OS !== 'web' && Boolean(getInstalledAppVersion())
}

export async function getCachedAppUpdateRequirement(): Promise<AppUpdateRequirement | null> {
    const rawValue = await AsyncStorage.getItem(APP_UPDATE_REQUIREMENT_CACHE_KEY)
    if (!rawValue) return null

    try {
        const value = JSON.parse(rawValue) as AppUpdateRequirement
        const hasMinimumVersion = Boolean(value.minimumVersion && normalizeVersion(value.minimumVersion))
        const hasMinimumAndroidBuildNumber = Number.isSafeInteger(value.minimumAndroidBuildNumber) && (value.minimumAndroidBuildNumber ?? 0) > 0
        if ((!hasMinimumVersion && !hasMinimumAndroidBuildNumber) || !isSafeStoreUrl(value.storeUrl)) return null
        return value
    } catch {
        return null
    }
}

export async function getRemoteAppUpdateRequirement(): Promise<AppUpdateRequirement | null> {
    const { data, error } = await supabase
        .from('app_release_requirements')
        .select('min_ios_version,min_android_version,min_android_build_number,ios_store_url,android_store_url')
        .eq('id', true)
        .maybeSingle<AppReleaseRequirementRow>()

    if (error) throw error
    if (!data) return null

    return toRequirement(data)
}

export async function cacheAppUpdateRequirement(requirement: AppUpdateRequirement | null) {
    if (!requirement) {
        await AsyncStorage.removeItem(APP_UPDATE_REQUIREMENT_CACHE_KEY)
        return
    }

    await AsyncStorage.setItem(APP_UPDATE_REQUIREMENT_CACHE_KEY, JSON.stringify(requirement))
}
