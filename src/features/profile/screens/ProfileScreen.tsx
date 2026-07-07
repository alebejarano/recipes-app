import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
import { useTranslation } from '@/localization'
import { createThemedStyles } from '@/styles/createStyles';
import { theme } from '@/styles/theme';

import ProfileHeader from '@/features/profile/components/ProfileHeader';
import ProfileUserCard from '@/features/profile/components/ProfileUserCard';
import SectionHeader from '@/features/profile/components/SectionHeader';
import SettingsRow from '@/features/profile/components/SettingsRow';
import SettingsSection from '@/features/profile/components/SettingsSection';

import {
  buildMembershipItems,
  buildNotificationsItems,
  buildPrivacyItems,
  buildSessionItems,
  buildSupportItems,
  type AccountPlan,
} from '@/features/profile/data/profileSettingsData';

import { useAuth } from '@/features/auth/context/AuthContext';
import { appEnv, isProductionAppEnv } from '@/lib/appEnv';
import { getUserFacingErrorMessage } from '@/lib/userFacingError';
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext';

export default function ProfileScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)
  const { languagePreference, locale, t } = useTranslation()

  const { user, logout } = useAuth()
  const { plan } = useContext(SubscriptionContext)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const accountPlan: AccountPlan = plan === 'premium' ? 'premium' : 'free'

  const displayName = useMemo(() => {
    const metadataName = user?.user_metadata?.display_name
    if (typeof metadataName === 'string' && metadataName.trim()) {
      return metadataName.trim()
    }
    const email = user?.email ?? ''
    if (!email) return t('profile.guest.accountFallback')
    return email.split('@')[0] || t('profile.guest.accountFallback')
  }, [t, user?.email, user?.user_metadata?.display_name])

  const performLogout = useCallback(async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await logout()
      // No manual navigation needed:
      // (auth)/_layout.tsx will redirect when session/user becomes null.
    } catch (e: any) {
      Alert.alert(t('profile.alerts.logoutErrorTitle'), getUserFacingErrorMessage(e))
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, logout, t])

  const onLogoutPress = useCallback(() => {
    if (isLoggingOut) return

    Alert.alert(t('profile.alerts.logoutTitle'), t('profile.alerts.logoutMessage'), [
      { text: t('profile.alerts.cancel'), style: 'cancel' },
      {
        text: t('profile.alerts.confirmLogout'),
        style: 'destructive',
        onPress: () => {
          void performLogout()
        },
      },
    ])
  }, [isLoggingOut, performLogout, t])

  const membershipItems = useMemo(
    () =>
      buildMembershipItems({
        plan: accountPlan,
        t,
        onPlanDetailsPress: () => router.push('/current-plan'),
        onManageOrUpgradePress: () =>
          accountPlan === 'premium'
            ? router.push('/(auth)/settings/subscription')
            : router.push('/premium'),
      }),
    [accountPlan, t]
  )
  const membershipStatusTitle = accountPlan === 'premium'
    ? t('profile.membershipStatus.premium')
    : t('profile.membershipStatus.free')
  const isPremiumPlan = accountPlan === 'premium'

  const notificationItems = useMemo(
    () =>
      buildNotificationsItems({
        t,
        onPushPress: () => router.push('/(auth)/settings/push'),
        onEmailPress: () => router.push('/(auth)/settings/email'),
      }),
    [t]
  )

  const preferenceItems = useMemo(
    () => [
      {
        id: 'language',
        type: 'link' as const,
        icon: 'globe' as const,
        title: t('profile.languageSummary'),
        subtitle:
          languagePreference === 'system'
            ? t('profile.language.labels.system')
            : t(`profile.language.labels.${locale}`),
        onPress: () => router.push('/(auth)/settings/language' as any),
      },
    ],
    [languagePreference, locale, t]
  )

  const privacyItems = useMemo(
    () =>
      buildPrivacyItems(t).map((item) => ({
        ...item,
        onPress: () => router.push('/privacy'),
      })),
    [t]
  )

  const supportItems = useMemo(
    () =>
      buildSupportItems(t).map((item) => {
        if (item.id === 'help') {
          return {
            ...item,
            onPress: () => router.push('/faq'),
          }
        }

        return {
          ...item,
          disabled: true,
          onPress: undefined,
        }
      }),
    [t]
  )

  const sessionItems = useMemo(
    () =>
      buildSessionItems({
        t,
        onLogoutPress,
        isLoggingOut,
      }),
    [isLoggingOut, onLogoutPress, t]
  )

  const environmentLabel = isProductionAppEnv
    ? null
    : t('profile.environmentLabel', {
        env: t(`profile.environments.${appEnv}`),
      })

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      <ProfileHeader
        title={t('profile.title')}
        environmentLabel={environmentLabel}
      />

      <ProfileUserCard
        name={displayName}
        email={user?.new_email ?? user?.email ?? ''}
        onPressEdit={user ? () => router.push('/(auth)/account/edit-profile') : undefined}
      />

      <View style={styles.bigSpace} />

      <View>
        <SectionHeader title={t('profile.sections.membership')} />
        <View style={styles.membershipStatusRow}>
          {isPremiumPlan ? (
            <MaterialCommunityIcons
              name="crown-outline"
              size={28}
              style={[styles.membershipStatusIcon, styles.membershipStatusIconPremium]}
            />
          ) : (
            <Ionicons
              name="leaf-outline"
              size={22}
              style={[styles.membershipStatusIcon, styles.membershipStatusIconFree]}
            />
          )}
          <Text style={[styles.membershipStatusText, isPremiumPlan ? styles.membershipStatusTextPremium : styles.membershipStatusTextFree]}>
            {membershipStatusTitle}
          </Text>
        </View>
        <View style={styles.membershipCard}>
          {membershipItems.map((item, index) => (
            <SettingsRow
              key={item.id}
              item={item}
              isLast={index === membershipItems.length - 1}
            />
          ))}
        </View>
      </View>

      <View style={styles.mediumSpace} />

      <SettingsSection title={t('profile.sections.preferences')} items={preferenceItems} />

      <View style={styles.mediumSpace} />

      <SettingsSection title={t('profile.sections.notifications')} items={notificationItems} />

      <View style={styles.mediumSpace} />

      <SettingsSection title={t('profile.sections.privacy')} items={privacyItems} />

      <View style={styles.mediumSpace} />

      <SettingsSection title={t('profile.sections.support')} items={supportItems} />

      <View style={styles.mediumSpace} />

      <SettingsSection title={t('profile.sections.session')} items={sessionItems} />

      <View style={styles.bigSpace} />
    </Screen>
  )
}

const styles = createThemedStyles((theme) => ({
  content: {},
  bigSpace: {
    height: theme.spacing['3xl'],
  },
  mediumSpace: {
    height: theme.spacing.xl,
  },
  membershipStatusRow: {
    borderRadius: theme.radii.lg,
    borderBottomEndRadius: 0,
    borderBottomStartRadius: 0,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  membershipStatusIcon: {
    width: 28,
  },
  membershipStatusIconPremium: {
    color: theme.colors.accent,
  },
  membershipStatusIconFree: {
    color: theme.colors.foreground,
  },
  membershipStatusText: {
    ...theme.textVariants.heading,
  },
  membershipStatusTextPremium: {
    color: theme.colors.accent,
  },
  membershipStatusTextFree: {
    color: theme.colors.foreground,
  },
  membershipCard: {
    borderRadius: theme.radii.lg,
    borderTopEndRadius: 0,
    borderTopStartRadius: 0,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
}))
