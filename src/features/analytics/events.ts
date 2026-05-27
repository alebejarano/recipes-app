import { useCallback } from 'react'
import { usePostHog } from 'posthog-react-native'

export type AnalyticsEventName =
  | 'app_opened'
  | 'sign_up_completed'
  | 'onboarding_identity_continue'
  | 'recipe_created'
  | 'note_created'
  | 'upgrade_clicked'
  | 'purchase_succeeded'

export type AnalyticsEventProperties = {
  app_opened: {
    source: 'cold_start' | 'foreground'
  }
  sign_up_completed: {
    method: 'email'
  }
  onboarding_identity_continue: {
    selected: string[]
    selected_count: number
  }
  recipe_created: {
    source: 'manual' | 'import' | 'document'
    storage_mode: 'local' | 'cloud'
  }
  note_created: {
    storage_mode: 'local' | 'cloud'
  }
  upgrade_clicked: {
    surface: 'premium_screen'
    billing_cycle: 'month' | 'year'
  }
  purchase_succeeded: {
    plan: 'premium'
    billing_cycle: 'month' | 'year'
  }
}

export function useAnalyticsCapture() {
  const posthog = usePostHog()

  return useCallback(
    <TEventName extends AnalyticsEventName>(
      event: TEventName,
      properties: AnalyticsEventProperties[TEventName]
    ) => {
      posthog?.capture(event, properties)
    },
    [posthog]
  )
}
