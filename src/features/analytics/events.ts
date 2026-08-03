import { createContext, createElement, useCallback, useContext } from 'react'
import type { PostHog } from 'posthog-react-native'

export type AnalyticsEventName =
  | 'app_opened'
  | 'sign_up_completed'
  | 'onboarding_identity_continue'
  | 'recipe_created'
  | 'note_created'
  | 'upgrade_clicked'
  | 'purchase_succeeded'
  | 'home_create_recipe_pressed'
  | 'home_import_recipe_pressed'
  | 'home_recipe_recommendation_opened'
  | 'home_recent_activity_opened'
  | 'home_shopping_list_opened'

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
  home_create_recipe_pressed: {
    recipe_library_stage: 'empty' | 'starter' | 'established' | 'large'
  }
  home_import_recipe_pressed: {
    recipe_library_stage: 'empty' | 'starter' | 'established' | 'large'
  }
  home_recipe_recommendation_opened: {
    recipe_library_stage: 'empty' | 'starter' | 'established' | 'large'
    section: 'hero' | 'ideas' | 'recently_added' | 'first_recipes' | 'collection'
  }
  home_recent_activity_opened: {
    recipe_library_stage: 'empty' | 'starter' | 'established' | 'large'
    item_type: 'recipe' | 'note' | 'import' | 'shopping-list'
  }
  home_shopping_list_opened: {
    recipe_library_stage: 'empty' | 'starter' | 'established' | 'large'
  }
}

type AnalyticsCapture = <TEventName extends AnalyticsEventName>(
  event: TEventName,
  properties: AnalyticsEventProperties[TEventName]
) => void

const noopCapture: AnalyticsCapture = () => undefined

const AnalyticsCaptureContext = createContext<AnalyticsCapture>(noopCapture)

export function AnalyticsCaptureProvider({
  children,
  posthog,
}: {
  children: React.ReactNode
  posthog?: Pick<PostHog, 'capture'>
}) {
  const capture = useCallback<AnalyticsCapture>(
    (event, properties) => {
      posthog?.capture(event, properties)
    },
    [posthog]
  )

  return createElement(AnalyticsCaptureContext.Provider, { value: capture }, children)
}

export function useAnalyticsCapture() {
  return useContext(AnalyticsCaptureContext)
}
