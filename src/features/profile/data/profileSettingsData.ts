import type { SettingsRowItem } from '@/features/profile/components/SettingsRow'
import { Feather } from '@expo/vector-icons'
import type React from 'react'

export type DietaryId =
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'glutenFree'
  | 'dairyFree'
  | 'eggFree'
  | 'nutFree'

export type DietaryOption = {
  id: DietaryId
  label: string
  icon: React.ComponentProps<typeof Feather>['name']
}

export const DIETARY_OPTIONS: DietaryOption[] = [
  { id: 'vegetarian', label: 'Vegetarian', icon: 'feather' },
  { id: 'vegan', label: 'Vegan', icon: 'activity' },
  { id: 'pescatarian', label: 'Pescatarian', icon: 'anchor' },
  { id: 'glutenFree', label: 'Gluten-Free', icon: 'slash' },
  { id: 'dairyFree', label: 'Dairy-Free', icon: 'droplet' },
  { id: 'eggFree', label: 'Egg-Free', icon: 'circle' },
  { id: 'nutFree', label: 'Nut-Free', icon: 'alert-triangle' },
]

// Default selection
export const DEFAULT_DIETARY_PREFERENCES: DietaryId[] = ['vegetarian']

export type PreferenceToggles = {
  pushNotifications: boolean
  emailUpdates: boolean
}

export type AccountPlan = 'free' | 'premium'

type Translate = (scope: string) => string

export function buildMembershipItems(args: {
  plan: AccountPlan
  t: Translate
  onPlanDetailsPress: () => void
  onManageOrUpgradePress: () => void
}): SettingsRowItem[] {
  const isPremium = args.plan === 'premium'

  return [
    {
      id: 'membership-plan-details',
      type: 'link',
      icon: 'book-open',
      title: args.t('profile.settings.membership.planTitle'),
      subtitle: args.t('profile.settings.membership.planSubtitle'),
      onPress: args.onPlanDetailsPress,
    },
    {
      id: 'membership-action',
      type: 'link',
      icon: isPremium ? 'award' : 'sparkles-sharp',
      iconFamily: isPremium ? 'feather' : 'ionicons',
      title: isPremium
        ? args.t('profile.settings.membership.manageTitle')
        : args.t('profile.settings.membership.upgradeTitle'),
      subtitle: isPremium
        ? args.t('profile.settings.membership.manageSubtitle')
        : args.t('profile.settings.membership.upgradeSubtitle'),
      tone: isPremium ? 'default' : 'accent',
      onPress: args.onManageOrUpgradePress,
    },
  ]
}

export function buildNotificationsItems(args: {
  t: Translate
  onPushPress: () => void
  onEmailPress: () => void
}): SettingsRowItem[] {
  return [
    {
      id: 'push-notifications',
      type: 'link',
      icon: 'bell',
      title: args.t('profile.settings.notifications.pushTitle'),
      subtitle: args.t('profile.settings.notifications.pushSubtitle'),
      onPress: args.onPushPress,
    },
    {
      id: 'email-updates',
      type: 'link',
      icon: 'mail',
      title: args.t('profile.settings.notifications.emailTitle'),
      subtitle: args.t('profile.settings.notifications.emailSubtitle'),
      onPress: args.onEmailPress,
    },
  ]
}

export function buildPrivacyItems(t: Translate): SettingsRowItem[] {
  return [
    {
      id: 'privacy',
      type: 'link',
      icon: 'shield',
      title: t('profile.settings.privacy.title'),
      subtitle: t('profile.settings.privacy.subtitle'),
    },
  ]
}

export function buildSupportItems(t: Translate): SettingsRowItem[] {
  return [
    {
      id: 'help',
      type: 'link',
      icon: 'help-circle',
      title: t('profile.settings.support.helpTitle'),
      subtitle: t('profile.settings.support.helpSubtitle'),
    },
    // {
    //   id: 'rate',
    //   type: 'link',
    //   icon: 'star',
    //   title: 'Rate the App',
    //   subtitle: 'Open App Store',
    // },
  ]
}

export function buildSessionItems(args: {
  t: Translate
  onLogoutPress: () => void
  isLoggingOut?: boolean
}): SettingsRowItem[] {
  return [
    {
      id: 'logout',
      type: 'link',
      icon: 'log-out',
      title: args.isLoggingOut
        ? args.t('profile.settings.session.loggingOut')
        : args.t('profile.settings.session.logout'),
      subtitle: args.t('profile.settings.session.subtitle'),
      onPress: args.isLoggingOut ? undefined : args.onLogoutPress,
    },
  ]
}
