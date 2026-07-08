import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Platform } from 'react-native'
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PACKAGE_TYPE,
  type PurchasesOffering,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases'
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui'

import { useAuth } from '@/features/auth/context/AuthContext'
import { FREE_PLAN_MAX_RECIPES } from '@/features/subscription/constants/limits'
import {
  REVENUECAT_ENTITLEMENT_ID,
  REVENUECAT_FALLBACK_API_KEY,
  REVENUECAT_MONTHLY_PACKAGE_ID,
  REVENUECAT_YEARLY_PACKAGE_ID,
} from '@/features/subscription/constants/revenueCat'
import { appEnv } from '@/lib/appEnv'

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
  customerInfo: CustomerInfo | null
  offerings: PurchasesOfferings | null
  currentOffering: PurchasesOffering | null
  activeEntitlement: CustomerInfo['entitlements']['active'][string] | null
  isRevenueCatAvailable: boolean
  getPackageForBillingCycle: (billingCycle: BillingCycle) => PurchasesPackage | null
  refreshCustomerInfo: () => Promise<CustomerInfo | null>
  refreshOfferings: () => Promise<PurchasesOfferings | null>
  purchasePackageForBillingCycle: (billingCycle: BillingCycle) => Promise<CustomerInfo>
  restorePurchases: () => Promise<CustomerInfo>
  presentPaywall: (options?: { offering?: PurchasesOffering | null }) => Promise<PAYWALL_RESULT>
  presentCustomerCenter: () => Promise<void>
  setPlan: (nextPlan: Plan, options?: { billingCycle?: BillingCycle; localOverride?: boolean }) => Promise<void>
  setUpgradeStatus: (nextStatus: UpgradeStatus) => Promise<void>
}

const IS_REVENUECAT_NATIVE_PLATFORM = Platform.OS === 'ios' || Platform.OS === 'android'
let hasConfiguredRevenueCat = false

function getRevenueCatApiKey() {
  const platformKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY,
    default: undefined,
  })

  return platformKey ?? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? REVENUECAT_FALLBACK_API_KEY
}

function getBillingCycleFromPackage(pkg: PurchasesPackage | null | undefined): BillingCycle | null {
  if (!pkg) return null
  const identifier = pkg.identifier.toLowerCase()

  if (
    identifier === REVENUECAT_YEARLY_PACKAGE_ID ||
    identifier.includes('year') ||
    pkg.packageType === PACKAGE_TYPE.ANNUAL
  ) {
    return 'year'
  }

  if (
    identifier === REVENUECAT_MONTHLY_PACKAGE_ID ||
    identifier.includes('month') ||
    pkg.packageType === PACKAGE_TYPE.MONTHLY
  ) {
    return 'month'
  }

  return null
}

function findPackageForBillingCycle(
  offering: PurchasesOffering | null,
  billingCycle: BillingCycle
): PurchasesPackage | null {
  if (!offering) return null

  const exactIdentifier =
    billingCycle === 'year' ? REVENUECAT_YEARLY_PACKAGE_ID : REVENUECAT_MONTHLY_PACKAGE_ID

  const exactMatch =
    offering.availablePackages.find((pkg) => pkg.identifier === exactIdentifier) ?? null

  if (exactMatch) return exactMatch

  return (
    offering.availablePackages.find((pkg) => getBillingCycleFromPackage(pkg) === billingCycle) ??
    null
  )
}

function getActiveEntitlement(customerInfo: CustomerInfo | null) {
  return customerInfo?.entitlements.active[REVENUECAT_ENTITLEMENT_ID] ?? null
}

function inferBillingCycle(
  customerInfo: CustomerInfo | null,
  offering: PurchasesOffering | null
): BillingCycle {
  const activeEntitlement = getActiveEntitlement(customerInfo)
  if (!activeEntitlement) return 'month'

  const matchingPackage =
    offering?.availablePackages.find(
      (pkg) => pkg.product.identifier === activeEntitlement.productIdentifier
    ) ?? null

  const billingCycleFromPackage = getBillingCycleFromPackage(matchingPackage)
  if (billingCycleFromPackage) return billingCycleFromPackage

  const productIdentifier = activeEntitlement.productIdentifier.toLowerCase()
  if (productIdentifier.includes('year') || productIdentifier.includes('annual')) return 'year'

  return 'month'
}

function createUnavailableError() {
  return new Error(
    'RevenueCat subscriptions are only available on iOS and Android native builds for this app.'
  )
}

async function setRevenueCatSubscriberAttributes(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  const displayName = user.user_metadata?.display_name

  await Promise.allSettled([
    Purchases.setEmail(user.email ?? null),
    Purchases.setDisplayName(typeof displayName === 'string' ? displayName : null),
    Purchases.setAttributes({
      supabase_user_id: user.id,
    }),
  ])
}

export const SubscriptionContext = createContext<SubscriptionContextValue>({
  plan: 'free',
  billingCycle: 'month',
  upgradeStatus: 'idle',
  isLoaded: false,
  recipesCount: 0,
  maxFreeRecipes: FREE_PLAN_MAX_RECIPES,
  customerInfo: null,
  offerings: null,
  currentOffering: null,
  activeEntitlement: null,
  isRevenueCatAvailable: IS_REVENUECAT_NATIVE_PLATFORM,
  getPackageForBillingCycle: () => null,
  refreshCustomerInfo: async () => null,
  refreshOfferings: async () => null,
  purchasePackageForBillingCycle: async () => {
    throw createUnavailableError()
  },
  restorePurchases: async () => {
    throw createUnavailableError()
  },
  presentPaywall: async () => PAYWALL_RESULT.NOT_PRESENTED,
  presentCustomerCenter: async () => {},
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
  const { user, isLoading: isAuthLoading } = useAuth()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null)
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null)
  const [upgradeStatus, setUpgradeStatusState] = useState<UpgradeStatus>('idle')
  const [isLoaded, setIsLoaded] = useState(!IS_REVENUECAT_NATIVE_PLATFORM)
  const activeUserIdRef = useRef<string | null>(null)
  const listenerRef = useRef<((info: CustomerInfo) => void) | null>(null)

  const refreshOfferings = useCallback(async () => {
    if (!IS_REVENUECAT_NATIVE_PLATFORM) return null

    const nextOfferings = await Purchases.getOfferings()
    setOfferings(nextOfferings)
    setCurrentOffering(nextOfferings.current ?? null)
    return nextOfferings
  }, [])

  const refreshCustomerInfo = useCallback(async () => {
    if (!IS_REVENUECAT_NATIVE_PLATFORM) return null

    const nextCustomerInfo = await Purchases.getCustomerInfo()
    setCustomerInfo(nextCustomerInfo)
    return nextCustomerInfo
  }, [])

  useEffect(() => {
    if (!IS_REVENUECAT_NATIVE_PLATFORM) {
      setIsLoaded(true)
      return
    }

    const apiKey = getRevenueCatApiKey()
    if (!apiKey) {
      setIsLoaded(true)
      return
    }

    let isMounted = true

    async function configureRevenueCat() {
      try {
        await Purchases.setLogLevel(
          appEnv === 'production' ? LOG_LEVEL.WARN : LOG_LEVEL.DEBUG
        )

        if (!hasConfiguredRevenueCat) {
          Purchases.configure({ apiKey })
          hasConfiguredRevenueCat = true
        }

        const listener = (info: CustomerInfo) => {
          if (!isMounted) return
          setCustomerInfo(info)
        }

        listenerRef.current = listener
        Purchases.addCustomerInfoUpdateListener(listener)

        const [nextCustomerInfo, nextOfferings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ])

        if (!isMounted) return

        setCustomerInfo(nextCustomerInfo)
        setOfferings(nextOfferings)
        setCurrentOffering(nextOfferings.current ?? null)
      } catch {
        if (!isMounted) return
        setCustomerInfo(null)
        setOfferings(null)
        setCurrentOffering(null)
      } finally {
        if (isMounted) {
          setIsLoaded(true)
        }
      }
    }

    void configureRevenueCat()

    return () => {
      isMounted = false
      if (listenerRef.current) {
        Purchases.removeCustomerInfoUpdateListener(listenerRef.current)
        listenerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!IS_REVENUECAT_NATIVE_PLATFORM || !hasConfiguredRevenueCat || isAuthLoading) return

    let isMounted = true

    async function syncRevenueCatIdentity() {
      try {
        if (user?.id) {
          if (activeUserIdRef.current !== user.id) {
            const loginResult = await Purchases.logIn(user.id)
            if (!isMounted) return
            setCustomerInfo(loginResult.customerInfo)
            activeUserIdRef.current = user.id
          }

          await setRevenueCatSubscriberAttributes(user)
        } else if (activeUserIdRef.current) {
          const nextCustomerInfo = await Purchases.logOut()
          if (!isMounted) return
          setCustomerInfo(nextCustomerInfo)
          activeUserIdRef.current = null
        }

        const nextOfferings = await Purchases.getOfferings()
        if (!isMounted) return
        setOfferings(nextOfferings)
        setCurrentOffering(nextOfferings.current ?? null)
      } catch {
        if (!isMounted) return
        activeUserIdRef.current = user?.id ?? null
      }
    }

    void syncRevenueCatIdentity()

    return () => {
      isMounted = false
    }
  }, [isAuthLoading, user])

  const getPackageForBillingCycle = useCallback(
    (billingCycle: BillingCycle) => findPackageForBillingCycle(currentOffering, billingCycle),
    [currentOffering]
  )

  const setUpgradeStatus = useCallback(async (nextStatus: UpgradeStatus) => {
    setUpgradeStatusState(
      nextStatus === 'running' || nextStatus === 'failed' ? nextStatus : 'idle'
    )
  }, [])

  const purchasePackageForBillingCycle = useCallback(
    async (billingCycle: BillingCycle) => {
      if (!IS_REVENUECAT_NATIVE_PLATFORM) throw createUnavailableError()

      const pkg = findPackageForBillingCycle(currentOffering, billingCycle)
      if (!pkg) {
        throw new Error(
          `RevenueCat offering is missing the "${billingCycle === 'year' ? REVENUECAT_YEARLY_PACKAGE_ID : REVENUECAT_MONTHLY_PACKAGE_ID}" package.`
        )
      }

      setUpgradeStatusState('running')

      try {
        const result = await Purchases.purchasePackage(pkg)
        setCustomerInfo(result.customerInfo)
        setUpgradeStatusState('idle')
        return result.customerInfo
      } catch (error) {
        setUpgradeStatusState('failed')
        throw error
      }
    },
    [currentOffering]
  )

  const restorePurchases = useCallback(async () => {
    if (!IS_REVENUECAT_NATIVE_PLATFORM) throw createUnavailableError()

    setUpgradeStatusState('running')

    try {
      const nextCustomerInfo = await Purchases.restorePurchases()
      setCustomerInfo(nextCustomerInfo)
      setUpgradeStatusState('idle')
      return nextCustomerInfo
    } catch (error) {
      setUpgradeStatusState('failed')
      throw error
    }
  }, [])

  const presentPaywall = useCallback(
    async (options?: { offering?: PurchasesOffering | null }) => {
      if (!IS_REVENUECAT_NATIVE_PLATFORM) throw createUnavailableError()

      setUpgradeStatusState('running')

      try {
        const result = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: REVENUECAT_ENTITLEMENT_ID,
          offering: options?.offering ?? currentOffering ?? undefined,
          displayCloseButton: true,
        })

        await Promise.allSettled([refreshCustomerInfo(), refreshOfferings()])
        setUpgradeStatusState('idle')
        return result
      } catch (error) {
        setUpgradeStatusState('failed')
        throw error
      }
    },
    [currentOffering, refreshCustomerInfo, refreshOfferings]
  )

  const presentCustomerCenter = useCallback(async () => {
    if (!IS_REVENUECAT_NATIVE_PLATFORM) throw createUnavailableError()

    await RevenueCatUI.presentCustomerCenter()
  }, [])

  const setPlan = useCallback(async () => {
    // RevenueCat is the source of truth for entitlement state.
  }, [])

  const activeEntitlement = getActiveEntitlement(customerInfo)
  const plan: Plan = activeEntitlement ? 'premium' : 'free'
  const billingCycle = inferBillingCycle(customerInfo, currentOffering)

  const value = useMemo(
    () => ({
      plan,
      billingCycle,
      upgradeStatus,
      isLoaded,
      recipesCount: 0,
      maxFreeRecipes,
      customerInfo,
      offerings,
      currentOffering,
      activeEntitlement,
      isRevenueCatAvailable: IS_REVENUECAT_NATIVE_PLATFORM,
      getPackageForBillingCycle,
      refreshCustomerInfo,
      refreshOfferings,
      purchasePackageForBillingCycle,
      restorePurchases,
      presentPaywall,
      presentCustomerCenter,
      setPlan,
      setUpgradeStatus,
    }),
    [
      activeEntitlement,
      billingCycle,
      currentOffering,
      customerInfo,
      getPackageForBillingCycle,
      isLoaded,
      maxFreeRecipes,
      offerings,
      plan,
      presentCustomerCenter,
      presentPaywall,
      purchasePackageForBillingCycle,
      refreshCustomerInfo,
      refreshOfferings,
      restorePurchases,
      setPlan,
      setUpgradeStatus,
      upgradeStatus,
    ]
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}
