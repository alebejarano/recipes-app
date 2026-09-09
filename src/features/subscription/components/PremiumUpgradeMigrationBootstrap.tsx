import { useContext, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'

import { useAuth } from '@/features/auth/context/AuthContext'
import { SubscriptionContext } from '@/features/subscription/context/SubscriptionContext'
import {
  hasCompletedPremiumUpgradeMigration,
  upgradeToPremium,
} from '@/features/subscription/services/upgradeToPremium'
import { tagLocalDataAsMigratable } from '@/features/storage/localAccountLinking'
import { logOperationalEvent, getErrorCategory } from '@/lib/productionLogger'

/**
 * Recovers a user whose RevenueCat entitlement became active before their
 * local collection could be copied to Supabase (for example after a purchase
 * or an interrupted app session).
 */
export default function PremiumUpgradeMigrationBootstrap() {
  const { user } = useAuth()
  const { billingCycle, isLoaded, plan, setPlan, setUpgradeStatus } = useContext(SubscriptionContext)
  const attemptedUserIdRef = useRef<string | null>(null)
  const [retryGeneration, setRetryGeneration] = useState(0)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return

      // A failed migration is safe to run again: the server endpoint is
      // idempotent. Retrying when the customer returns to the app recovers
      // transient auth/network failures without making the purchase UI fail.
      attemptedUserIdRef.current = null
      setRetryGeneration((current) => current + 1)
    })

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    const userId = user?.id ?? null
    if (!isLoaded || plan !== 'premium' || !userId || attemptedUserIdRef.current === userId) return
    const activeUserId = userId

    let isMounted = true
    attemptedUserIdRef.current = activeUserId

    async function recoverPremiumUpgrade() {
      try {
        const claimedLegacyData = await tagLocalDataAsMigratable(activeUserId)
        const hasClaimedLegacyData = Object.values(claimedLegacyData).some((count) => count > 0)
        if (!hasClaimedLegacyData && await hasCompletedPremiumUpgradeMigration(activeUserId)) return

        await upgradeToPremium({
          userId: activeUserId,
          billingCycle,
          setPlan,
          setUpgradeStatus,
        })
      } catch (error) {
        if (!isMounted) return
        logOperationalEvent('sync_retry_failed', {
          operation: 'premium_upgrade_migration',
          entity: 'supabase',
          category: getErrorCategory(error),
        })
      }
    }

    void recoverPremiumUpgrade()

    return () => {
      isMounted = false
    }
  }, [billingCycle, isLoaded, plan, retryGeneration, setPlan, setUpgradeStatus, user?.id])

  return null
}
