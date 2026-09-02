import { useContext, useEffect, useRef } from 'react'

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

  useEffect(() => {
    const userId = user?.id ?? null
    if (!isLoaded || plan !== 'premium' || !userId || attemptedUserIdRef.current === userId) return

    let isMounted = true
    attemptedUserIdRef.current = userId

    async function recoverPremiumUpgrade() {
      try {
        const claimedLegacyData = await tagLocalDataAsMigratable(userId)
        const hasClaimedLegacyData = Object.values(claimedLegacyData).some((count) => count > 0)
        if (!hasClaimedLegacyData && await hasCompletedPremiumUpgradeMigration(userId)) return

        await upgradeToPremium({
          userId,
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
  }, [billingCycle, isLoaded, plan, setPlan, setUpgradeStatus, user?.id])

  return null
}
