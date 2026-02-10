import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/features/auth/context/AuthContext'

export type Plan = 'free' | 'premium'

type SubscriptionContextValue = {
  plan: Plan
  isLoaded: boolean
  recipesCount: number
  maxFreeRecipes: number
  setPlan: (nextPlan: Plan) => Promise<void>
}

const DEFAULT_MAX_FREE_RECIPES = 100
const PLAN_KEY_PREFIX = 'subscription:plan:user:'

export const SubscriptionContext = createContext<SubscriptionContextValue>({
  plan: 'free',
  isLoaded: false,
  recipesCount: 0,
  maxFreeRecipes: DEFAULT_MAX_FREE_RECIPES,
  setPlan: async () => {},
})

type Props = {
  children: React.ReactNode
  maxFreeRecipes?: number
}

export function SubscriptionProvider({
  children,
  maxFreeRecipes = DEFAULT_MAX_FREE_RECIPES,
}: Props) {
  const { user } = useAuth()
  const [plan, setPlanState] = useState<Plan>('free')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function hydratePlan() {
      if (!user?.id) {
        if (!isMounted) return
        setPlanState('free')
        setIsLoaded(true)
        return
      }

      setIsLoaded(false)
      try {
        const raw = await AsyncStorage.getItem(`${PLAN_KEY_PREFIX}${user.id}`)
        if (!isMounted) return
        setPlanState(raw === 'premium' ? 'premium' : 'free')
      } catch {
        if (!isMounted) return
        setPlanState('free')
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
    async (nextPlan: Plan) => {
      if (!user?.id) {
        setPlanState('free')
        return
      }

      const normalized = nextPlan === 'premium' ? 'premium' : 'free'
      await AsyncStorage.setItem(`${PLAN_KEY_PREFIX}${user.id}`, normalized)
      setPlanState(normalized)
    },
    [user?.id]
  )

  const value = useMemo(
    () => ({
      plan,
      isLoaded,
      recipesCount: 0,
      maxFreeRecipes,
      setPlan,
    }),
    [isLoaded, maxFreeRecipes, plan, setPlan]
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
