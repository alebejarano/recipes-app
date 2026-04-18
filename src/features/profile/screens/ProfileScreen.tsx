import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useSegments } from 'expo-router';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import Screen from '@/components/Screen';
import Button from '@/components/Button';
import { useTabBarBottomPadding } from '@/hooks/useTabBarBottomPadding';
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
  buildSessionItems,
  PRIVACY_ITEMS,
  SUPPORT_ITEMS,
  type AccountPlan,
} from '@/features/profile/data/profileSettingsData';

import { useAuth } from '@/features/auth/context/AuthContext';
import { appEnv, isProductionAppEnv } from '@/lib/appEnv';
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext';

export default function ProfileScreen() {
  const bottomPadding = useTabBarBottomPadding(theme.spacing.xl)
  const segments = useSegments()
  const isDevMode = segments[0] === '(dev)'

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
    if (!email) return 'Account'
    return email.split('@')[0] || 'Account'
  }, [user?.email, user?.user_metadata?.display_name])

  const performLogout = useCallback(async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await logout()
      // No manual navigation needed:
      // (auth)/_layout.tsx will redirect when session/user becomes null.
    } catch (e: any) {
      Alert.alert('Unable to log out', e?.message ?? 'Please try again.')
    } finally {
      setIsLoggingOut(false)
    }
  }, [isLoggingOut, logout])

  const onLogoutPress = useCallback(() => {
    if (isLoggingOut) return

    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          void performLogout()
        },
      },
    ])
  }, [isLoggingOut, performLogout])

  const membershipItems = useMemo(
    () =>
      buildMembershipItems({
        plan: accountPlan,
        onPlanDetailsPress: () => router.push('/current-plan'),
        onManageOrUpgradePress: () =>
          accountPlan === 'premium'
            ? router.push('/current-plan?focus=billing')
            : router.push('/premium'),
      }),
    [accountPlan]
  )
  const membershipStatusTitle = accountPlan === 'premium' ? 'Premium Active' : 'Free Plan'
  const isPremiumPlan = accountPlan === 'premium'

  const notificationItems = useMemo(
    () =>
      buildNotificationsItems({
        onPushPress: () => router.push('/(auth)/settings/push'),
        onEmailPress: () => router.push('/(auth)/settings/email'),
      }),
    []
  )

  const privacyItems = useMemo(
    () =>
      PRIVACY_ITEMS.map((item) => ({
        ...item,
        onPress: () => router.push('/privacy'),
      })),
    []
  )

  const supportItems = useMemo(
    () =>
      SUPPORT_ITEMS.map((item) => {
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
    []
  )

  const sessionItems = useMemo(
    () =>
      buildSessionItems({
        onLogoutPress,
        isLoggingOut,
      }),
    [isLoggingOut, onLogoutPress]
  )

  const environmentLabel = isProductionAppEnv ? null : `${appEnv} environment`

  return (
    <Screen scroll bottomPadding={bottomPadding} contentStyle={styles.content}>
      <ProfileHeader
        title="Profile"
        environmentLabel={environmentLabel}
      />

      <ProfileUserCard
        name={displayName}
        email={user?.new_email ?? user?.email ?? ''}
        onPressEdit={() => router.push('/(auth)/account/edit-profile')}
      />

      <View style={styles.bigSpace} />

      <View>
        <SectionHeader title="Membership & Account" />
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

      <SettingsSection title="Notifications" items={notificationItems} />

      <View style={styles.mediumSpace} />

      <SettingsSection title="Privacy & Security" items={privacyItems} />

      <View style={styles.mediumSpace} />

      <SettingsSection title="Support" items={supportItems} />

      <View style={styles.mediumSpace} />

      <SettingsSection title="Session" items={sessionItems} />

      {isDevMode ? (
        <>
          <View style={styles.mediumSpace} />
          <Button
            variant="secondary"
            size="md"
            onPress={() => router.push('/(dev)/limit-qa')}
          >
            Open Limit QA Mode
          </Button>
        </>
      ) : null}

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
    fontFamily: theme.fontFamily.semibold,
    fontSize: theme.fontSize.xl,
    lineHeight: theme.lineHeight.xl,
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
