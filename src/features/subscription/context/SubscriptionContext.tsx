import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/context/AuthContext'
import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'
import { supabase } from '@/lib/supabase'

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
  setPlan: (nextPlan: Plan, options?: { billingCycle?: BillingCycle; localOverride?: boolean }) => Promise<void>
  setUpgradeStatus: (nextStatus: UpgradeStatus) => Promise<void>
}

const PLAN_KEY_PREFIX = 'subscription:plan:user:'
const BILLING_CYCLE_KEY_PREFIX = 'subscription:billing-cycle:user:'
const UPGRADE_STATUS_KEY_PREFIX = 'subscription:upgrade-status:user:'
const PLAN_OVERRIDE_KEY_PREFIX = 'subscription:plan-override:user:'

type UserEntitlementsRow = {
  plan: Plan
  billing_cycle: BillingCycle
}

function isConnectivityError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
        ? error.message.toLowerCase()
        : ''

  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('socket') ||
    message.includes('abort')
  )
}

async function inferPremiumFromCloudData(userId: string): Promise<boolean> {
  const [recipesResult, notesResult, foldersResult] = await Promise.all([
    supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('folders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const results = [recipesResult, notesResult, foldersResult]
  return results.some((result) => !result.error && Number(result.count ?? 0) > 0)
}

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
        const [rawPlan, rawBillingCycle, rawUpgradeStatus, rawPlanOverride] = await Promise.all([
          AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${user.id}`),
          AsyncStorage.getItem(`${BILLING_CYCLE_KEY_PREFIX}${user.id}`),
          AsyncStorage.getItem(`${UPGRADE_STATUS_KEY_PREFIX}${user.id}`),
          AsyncStorage.getItem(`${PLAN_OVERRIDE_KEY_PREFIX}${user.id}`),
        ])
        const cachedPlan: Plan = rawPlan === 'premium' ? 'premium' : 'free'
        const cachedBillingCycle: BillingCycle = rawBillingCycle === 'year' ? 'year' : 'month'
        const cachedUpgradeStatus: UpgradeStatus =
          rawUpgradeStatus === 'running' || rawUpgradeStatus === 'failed' ? rawUpgradeStatus : 'idle'
        const overridePlan: Plan | null =
          rawPlanOverride === 'premium' || rawPlanOverride === 'free' ? rawPlanOverride : null

        if (!isMounted) return
        setPlanState(overridePlan ?? cachedPlan)
        setBillingCycleState(cachedBillingCycle)
        setUpgradeStatusState(cachedUpgradeStatus)

        if (overridePlan) return

        const { data: remoteEntitlements, error: remoteError } = await supabase
          .from('user_entitlements')
          .select('plan,billing_cycle')
          .eq('user_id', user.id)
          .maybeSingle<UserEntitlementsRow>()

        if (!isMounted) return
        if (remoteError) {
          if (isConnectivityError(remoteError)) return
          const hasCloudData = await inferPremiumFromCloudData(user.id)
          if (!isMounted || !hasCloudData) return

          setPlanState('premium')
          setBillingCycleState(cachedBillingCycle)

          await Promise.all([
            AsyncStorage.setItem(`${PLAN_KEY_PREFIX}${user.id}`, 'premium'),
            AsyncStorage.setItem(`${BILLING_CYCLE_KEY_PREFIX}${user.id}`, cachedBillingCycle),
          ])
          return
        }

        if (!remoteEntitlements) {
          const hasCloudData = await inferPremiumFromCloudData(user.id)
          if (!isMounted || !hasCloudData) return

          setPlanState('premium')
          setBillingCycleState(cachedBillingCycle)

          await Promise.all([
            AsyncStorage.setItem(`${PLAN_KEY_PREFIX}${user.id}`, 'premium'),
            AsyncStorage.setItem(`${BILLING_CYCLE_KEY_PREFIX}${user.id}`, cachedBillingCycle),
          ])
          return
        }

        const remotePlan: Plan = remoteEntitlements.plan === 'premium' ? 'premium' : 'free'
        const remoteBillingCycle: BillingCycle =
          remoteEntitlements.billing_cycle === 'year' ? 'year' : 'month'

        setPlanState(remotePlan)
        setBillingCycleState(remoteBillingCycle)

        await Promise.all([
          AsyncStorage.setItem(`${PLAN_KEY_PREFIX}${user.id}`, remotePlan),
          AsyncStorage.setItem(`${BILLING_CYCLE_KEY_PREFIX}${user.id}`, remoteBillingCycle),
        ])
      } catch (error) {
        if (!isMounted) return
        if (isConnectivityError(error)) return
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
    async (nextPlan: Plan, options?: { billingCycle?: BillingCycle; localOverride?: boolean }) => {
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
        options?.localOverride
          ? AsyncStorage.setItem(`${PLAN_OVERRIDE_KEY_PREFIX}${user.id}`, normalized)
          : AsyncStorage.removeItem(`${PLAN_OVERRIDE_KEY_PREFIX}${user.id}`),
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
