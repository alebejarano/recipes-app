import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/context/AuthContext'
import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'

export type Plan = 'free' | 'premium'
export type BillingCycle = 'month' | 'year'
export type UpgradeStatus = 'idle' | 'running' | 'failed'

type SubscriptionContextValue = {
  plan: Plan
  billingCycle: BillingCycle
  upgradeStatus: UpgradeStatus
  isLoaded: boolean
  recipesCount: number
  maxFreeRecipes: number
  setPlan: (nextPlan: Plan, options?: { billingCycle?: BillingCycle }) => Promise<void>
  setUpgradeStatus: (nextStatus: UpgradeStatus) => Promise<void>
}

const PLAN_KEY_PREFIX = 'subscription:plan:user:'
const BILLING_CYCLE_KEY_PREFIX = 'subscription:billing-cycle:user:'
const UPGRADE_STATUS_KEY_PREFIX = 'subscription:upgrade-status:user:'

export const SubscriptionContext = createContext<SubscriptionContextValue>({
  plan: 'free',
  billingCycle: 'month',
  upgradeStatus: 'idle',
  isLoaded: false,
  recipesCount: 0,
  maxFreeRecipes: FREE_PLAN_MAX_RECIPES,
  setPlan: async () => {},
  setUpgradeStatus: async () => {},
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
  const [upgradeStatus, setUpgradeStatusState] = useState<UpgradeStatus>('idle')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function hydratePlan() {
      if (!user?.id) {
        if (!isMounted) return
        setPlanState('free')
        setBillingCycleState('month')
        setUpgradeStatusState('idle')
        setIsLoaded(true)
        return
      }

      setIsLoaded(false)
      try {
        const [rawPlan, rawBillingCycle, rawUpgradeStatus] = await Promise.all([
          AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${user.id}`),
          AsyncStorage.getItem(`${BILLING_CYCLE_KEY_PREFIX}${user.id}`),
          AsyncStorage.getItem(`${UPGRADE_STATUS_KEY_PREFIX}${user.id}`),
        ])
        if (!isMounted) return
        setPlanState(rawPlan === 'premium' ? 'premium' : 'free')
        setBillingCycleState(rawBillingCycle === 'year' ? 'year' : 'month')
        setUpgradeStatusState(rawUpgradeStatus === 'running' || rawUpgradeStatus === 'failed' ? rawUpgradeStatus : 'idle')
      } catch {
        if (!isMounted) return
        setPlanState('free')
        setBillingCycleState('month')
        setUpgradeStatusState('idle')
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
        AsyncStorage.setItem(`${UPGRADE_STATUS_KEY_PREFIX}${user.id}`, 'idle'),
      ])
      setPlanState(normalized)
      setBillingCycleState(nextBillingCycle)
      setUpgradeStatusState('idle')
    },
    [user?.id]
  )

  const setUpgradeStatus = useCallback(
    async (nextStatus: UpgradeStatus) => {
      if (!user?.id) {
        setUpgradeStatusState('idle')
        return
      }
      const normalized: UpgradeStatus =
        nextStatus === 'running' || nextStatus === 'failed' ? nextStatus : 'idle'
      await AsyncStorage.setItem(`${UPGRADE_STATUS_KEY_PREFIX}${user.id}`, normalized)
      setUpgradeStatusState(normalized)
    },
    [user?.id]
  )

  const value = useMemo(
    () => ({
      plan,
      billingCycle,
      upgradeStatus,
      isLoaded,
      recipesCount: 0,
      maxFreeRecipes,
      setPlan,
      setUpgradeStatus,
    }),
    [billingCycle, isLoaded, maxFreeRecipes, plan, setPlan, setUpgradeStatus, upgradeStatus]
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
