import type { SettingsRowItem } from '@/features/profile/components/SettingsRow'
import type { Feather } from '@expo/vector-icons'
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
  // darkMode: boolean // TODO later
}

export const PREFERENCES_ITEMS = ({
  toggles,
  setToggles,
}: {
  toggles: PreferenceToggles
  setToggles: React.Dispatch<React.SetStateAction<PreferenceToggles>>
}): SettingsRowItem[] => [
  {
    id: 'push',
    type: 'toggle',
    icon: 'bell',
    title: 'Push Notifications',
    subtitle: 'Get recipe reminders',
    value: toggles.pushNotifications,
    onValueChange: (next) =>
      setToggles((prev) => ({ ...prev, pushNotifications: next })),
  },
  {
    id: 'email',
    type: 'toggle',
    icon: 'mail',
    title: 'Email Updates',
    subtitle: 'Weekly recipe digest',
    value: toggles.emailUpdates,
    onValueChange: (next) =>
      setToggles((prev) => ({ ...prev, emailUpdates: next })),
  },
]

/**
 * Static account items that don’t need runtime handlers yet.
 * Keep this list small and stable.
 */
export const ACCOUNT_ITEMS_BASE: SettingsRowItem[] = [
  {
    id: 'premium',
    type: 'link',
    icon: 'award',
    title: 'Premium',
    subtitle: 'Unlock all features',
    tone: 'accent',
    onPress: () => {},
  },
  {
    id: 'subscription',
    type: 'link',
    icon: 'credit-card',
    title: 'Subscription',
    subtitle: 'Manage your plan',
    onPress: () => {},
  },
  {
    id: 'privacy',
    type: 'link',
    icon: 'shield',
    title: 'Privacy & Security',
    subtitle: 'Manage your data',
    onPress: () => {},
  },
]

/**
 * Account section should include logout/delete (not Support).
 * We build it so ProfileScreen can inject real handlers.
 */
export function buildAccountItems(args: {
  onLogoutPress: () => void
  onDeleteAccountPress?: () => void
  isLoggingOut?: boolean
  isDeletingAccount?: boolean
}): SettingsRowItem[] {
  const {
    onLogoutPress,
    onDeleteAccountPress,
    isLoggingOut = false,
    isDeletingAccount = false,
  } = args

  const items: SettingsRowItem[] = [...ACCOUNT_ITEMS_BASE]

  // ✅ LOG OUT ROW — THIS IS WHERE YOUR SNIPPET GOES
  items.push({
    id: 'logout',
    type: 'link',
    icon: 'log-out',
    title: isLoggingOut ? 'Logging out…' : 'Log Out',
    subtitle: 'Sign out of your account',
    onPress: isLoggingOut ? undefined : onLogoutPress,
  })

  // ❗ Delete account keeps confirmation (later)
  if (onDeleteAccountPress) {
    items.push({
      id: 'delete',
      type: 'link',
      icon: 'trash-2',
      title: isDeletingAccount ? 'Deleting…' : 'Delete Account',
      subtitle: 'Permanently remove your data',
      tone: 'danger',
      onPress: isDeletingAccount ? undefined : onDeleteAccountPress,
    })
  }

  return items
}


export const SUPPORT_ITEMS: SettingsRowItem[] = [
  {
    id: 'help',
    type: 'link',
    icon: 'help-circle',
    title: 'Help Center',
    subtitle: 'FAQs and guides',
    onPress: () => {},
  },
  {
    id: 'rate',
    type: 'link',
    icon: 'star',
    title: 'Rate the App',
    subtitle: 'Share your feedback',
    onPress: () => {},
  },
]
