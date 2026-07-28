import { supabase } from '@/lib/supabase'

export const EMAIL_PREFERENCE_KEYS = ['weekly_digest', 'cooking_tips'] as const

export type EmailPreferenceKey = (typeof EMAIL_PREFERENCE_KEYS)[number]

export type EmailPreference = {
  optedIn: boolean
  optedInAt: string | null
  optedOutAt: string | null
}

export type EmailPreferences = Record<EmailPreferenceKey, EmailPreference>

type EmailPreferenceRow = {
  preference: EmailPreferenceKey
  is_opted_in: boolean
  opted_in_at: string | null
  opted_out_at: string | null
}

const DEFAULT_PREFERENCE: EmailPreference = {
  optedIn: false,
  optedInAt: null,
  optedOutAt: null,
}

function isEmailPreferenceKey(value: string): value is EmailPreferenceKey {
  return EMAIL_PREFERENCE_KEYS.includes(value as EmailPreferenceKey)
}

function toEmailPreference(row: EmailPreferenceRow): EmailPreference {
  return {
    optedIn: row.is_opted_in,
    optedInAt: row.opted_in_at,
    optedOutAt: row.opted_out_at,
  }
}

export function createDefaultEmailPreferences(): EmailPreferences {
  return {
    weekly_digest: { ...DEFAULT_PREFERENCE },
    cooking_tips: { ...DEFAULT_PREFERENCE },
  }
}

export async function getEmailPreferences(): Promise<EmailPreferences> {
  const { data, error } = await supabase
    .from('email_preferences')
    .select('preference,is_opted_in,opted_in_at,opted_out_at')

  if (error) throw error

  const preferences = createDefaultEmailPreferences()
  for (const row of (data ?? []) as EmailPreferenceRow[]) {
    if (isEmailPreferenceKey(row.preference)) {
      preferences[row.preference] = toEmailPreference(row)
    }
  }

  return preferences
}

export async function updateEmailPreference(
  preference: EmailPreferenceKey,
  optedIn: boolean,
): Promise<EmailPreference> {
  const { data, error } = await supabase.rpc('update_email_consent', {
    p_preference: preference,
    p_opted_in: optedIn,
  })

  if (error) throw error

  const row = (data as EmailPreferenceRow[] | null)?.[0]
  if (!row) throw new Error('Email preference was not returned')

  return toEmailPreference(row)
}
