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

export function buildMembershipItems(args: {
  plan: AccountPlan
  onPlanDetailsPress: () => void
  onManageOrUpgradePress: () => void
}): SettingsRowItem[] {
  const isPremium = args.plan === 'premium'

  return [
    {
      id: 'membership-plan-details',
      type: 'link',
      icon: 'book-open',
      title: 'Your Kitchen Plan',
      subtitle: 'Usage & limits',
      onPress: args.onPlanDetailsPress,
    },
    {
      id: 'membership-action',
      type: 'link',
      icon: isPremium ? 'award' : 'sparkles-sharp',
      iconFamily: isPremium ? 'feather' : 'ionicons',
      title: isPremium ? 'Manage Subscription' : 'Upgrade to Premium',
      subtitle: isPremium ? 'Billing & payments' : 'Unlock all features',
      tone: isPremium ? 'default' : 'accent',
      onPress: args.onManageOrUpgradePress,
    },
  ]
}

export function buildNotificationsItems(args: {
  onPushPress: () => void
  onEmailPress: () => void
}): SettingsRowItem[] {
  return [
    {
      id: 'push-notifications',
      type: 'link',
      icon: 'bell',
      title: 'Push Notifications',
      subtitle: 'Push Settings',
      onPress: args.onPushPress,
    },
    {
      id: 'email-updates',
      type: 'link',
      icon: 'mail',
      title: 'Email Updates',
      subtitle: 'Email Settings',
      onPress: args.onEmailPress,
    },
  ]
}

export const PRIVACY_ITEMS: SettingsRowItem[] = [
  {
    id: 'privacy',
    type: 'link',
    icon: 'shield',
    title: 'Privacy Settings',
    subtitle: 'Privacy & Security',
  },
]

export const SUPPORT_ITEMS: SettingsRowItem[] = [
  {
    id: 'help',
    type: 'link',
    icon: 'help-circle',
    title: 'Help Center',
    subtitle: 'FAQ',
  },
  {
    id: 'rate',
    type: 'link',
    icon: 'star',
    title: 'Rate the App',
    subtitle: 'Open App Store',
  },
]

export function buildSessionItems(args: {
  onLogoutPress: () => void
  isLoggingOut?: boolean
}): SettingsRowItem[] {
  return [
    {
      id: 'logout',
      type: 'link',
      icon: 'log-out',
      title: args.isLoggingOut ? 'Logging out…' : 'Log Out',
      subtitle: 'Sign out of your account',
      onPress: args.isLoggingOut ? undefined : args.onLogoutPress,
    },
  ]
}
