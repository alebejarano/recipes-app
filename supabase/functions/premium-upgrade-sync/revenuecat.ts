const PREMIUM_ENTITLEMENT_ID = 'Dropsauce Pro'
const VERIFICATION_TIMEOUT_MS = 10_000

export class PremiumVerificationError extends Error {
    readonly status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'PremiumVerificationError'
        this.status = status
    }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null
}

function isFutureDate(value: unknown, now: number) {
    return typeof value === 'string' && Date.parse(value) > now
}

export async function verifyPremiumSubscription(options: {
    userId: string
    secretApiKey: string | undefined
    allowSandbox: boolean
    fetch: typeof fetch
    now: () => number
}) {
    // Public SDK keys must never be substituted for server configuration.
    if (!options.secretApiKey?.startsWith('sk_')) {
        throw new PremiumVerificationError(503, 'Subscription verification is not configured.')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), VERIFICATION_TIMEOUT_MS)

    try {
        const response = await options.fetch(
            `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(options.userId)}`,
            {
                headers: { Authorization: `Bearer ${options.secretApiKey}`, Accept: 'application/json' },
                signal: controller.signal,
                redirect: 'error',
            },
        )
        if (!response.ok) {
            throw new PremiumVerificationError(503, 'Unable to verify your subscription. Please try again.')
        }

        const body = asRecord(await response.json())
        const subscriber = asRecord(body?.subscriber)
        const entitlements = asRecord(subscriber?.entitlements)
        const subscriptions = asRecord(subscriber?.subscriptions)
        // An incomplete provider response is an outage, never evidence of access.
        if (!subscriber || !entitlements || !subscriptions) {
            throw new PremiumVerificationError(503, 'Unable to verify your subscription. Please try again.')
        }

        const entitlement = asRecord(entitlements[PREMIUM_ENTITLEMENT_ID])
        const productId = entitlement?.product_identifier
        const subscription = typeof productId === 'string' ? asRecord(subscriptions[productId]) : null
        const now = options.now()
        const entitlementActive = isFutureDate(entitlement?.expires_date, now)
            || isFutureDate(entitlement?.grace_period_expires_date, now)
        const subscriptionActive = isFutureDate(subscription?.expires_date, now)
            || isFutureDate(subscription?.grace_period_expires_date, now)
        const allowedEnvironment = subscription?.is_sandbox === false
            || (options.allowSandbox && subscription?.is_sandbox === true)

        // This app sells monthly/yearly subscriptions. A null/missing expiry,
        // unrelated product, refund, or unclassified environment fails closed.
        if (!entitlementActive || !subscriptionActive || !allowedEnvironment
            || subscription?.refunded_at !== null) {
            throw new PremiumVerificationError(403, 'An active Premium subscription is required.')
        }

        const requestDate = body?.request_date_ms
        if (typeof requestDate !== 'number' || !Number.isFinite(requestDate)
            || requestDate <= 0 || requestDate > now + 60_000) {
            throw new PremiumVerificationError(503, 'Unable to verify your subscription. Please try again.')
        }

        // Google Play exposes the base plan separately from the product ID.
        const planId = entitlement?.product_plan_identifier ?? subscription?.product_plan_identifier
        const billingIdentifier = `${String(productId)} ${typeof planId === 'string' ? planId : ''}`
        return {
            verifiedAt: new Date(requestDate).toISOString(),
            billingCycle: /year|annual/i.test(billingIdentifier) ? 'year' as const : 'month' as const,
        }
    } catch (error) {
        if (error instanceof PremiumVerificationError) throw error
        // Provider bodies, account details and credentials must not reach logs
        // or client errors, including for timeouts and JSON parsing failures.
        throw new PremiumVerificationError(503, 'Unable to verify your subscription. Please try again.')
    } finally {
        clearTimeout(timeout)
    }
}
