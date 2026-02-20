import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/context/AuthContext'
import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'

export type Plan = 'free' | 'premium'
export type BillingCycle = 'month' | 'year'

type SubscriptionContextValue = {
  plan: Plan
  billingCycle: BillingCycle
  isLoaded: boolean
  recipesCount: number
  maxFreeRecipes: number
  setPlan: (nextPlan: Plan, options?: { billingCycle?: BillingCycle }) => Promise<void>
}

const PLAN_KEY_PREFIX = 'subscription:plan:user:'
const BILLING_CYCLE_KEY_PREFIX = 'subscription:billing-cycle:user:'

export const SubscriptionContext = createContext<SubscriptionContextValue>({
  plan: 'free',
  billingCycle: 'month',
  isLoaded: false,
  recipesCount: 0,
  maxFreeRecipes: FREE_PLAN_MAX_RECIPES,
  setPlan: async () => {},
})

type Props = {
  children: React.ReactNode
  maxFreeRecipes?: number
}

export function SubscriptionProvider({
  children,
  maxFreeRecipes = FREE_PLAN_MAX_RECIPES,
}: Props) {
  const { user } = useAuth()
  const [plan, setPlanState] = useState<Plan>('free')
  const [billingCycle, setBillingCycleState] = useState<BillingCycle>('month')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function hydratePlan() {
      if (!user?.id) {
        if (!isMounted) return
        setPlanState('free')
        setBillingCycleState('month')
        setIsLoaded(true)
        return
      }

      setIsLoaded(false)
      try {
        const [rawPlan, rawBillingCycle] = await Promise.all([
          AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${user.id}`),
          AsyncStorage.getItem(`${BILLING_CYCLE_KEY_PREFIX}${user.id}`),
        ])
        if (!isMounted) return
        setPlanState(rawPlan === 'premium' ? 'premium' : 'free')
        setBillingCycleState(rawBillingCycle === 'year' ? 'year' : 'month')
      } catch {
        if (!isMounted) return
        setPlanState('free')
        setBillingCycleState('month')
      } finally {
        if (isMounted) setIsLoaded(true)
      }
    }

    void hydratePlan()
    return () => {
      isMounted = false
    }
  }, [user?.id])

  const setPlan = useCallback(
    async (nextPlan: Plan, options?: { billingCycle?: BillingCycle }) => {
      if (!user?.id) {
        setPlanState('free')
        setBillingCycleState('month')
        return
      }

      const normalized = nextPlan === 'premium' ? 'premium' : 'free'
      const nextBillingCycle = options?.billingCycle === 'year' ? 'year' : 'month'
      await Promise.all([
        AsyncStorage.setItem(`${PLAN_KEY_PREFIX}${user.id}`, normalized),
        AsyncStorage.setItem(`${BILLING_CYCLE_KEY_PREFIX}${user.id}`, nextBillingCycle),
      ])
      setPlanState(normalized)
      setBillingCycleState(nextBillingCycle)
    },
    [user?.id]
  )

  const value = useMemo(
    () => ({
      plan,
      billingCycle,
      isLoaded,
      recipesCount: 0,
      maxFreeRecipes,
      setPlan,
    }),
    [billingCycle, isLoaded, maxFreeRecipes, plan, setPlan]
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
