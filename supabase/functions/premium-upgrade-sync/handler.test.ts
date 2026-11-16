import assert from 'node:assert/strict'
import { afterEach, jest, test } from '@jest/globals'
import type { SupabaseClient } from '@supabase/supabase-js'

import { createPremiumUpgradeHandler, type PremiumUpgradeDependencies } from './handler.ts'

const NOW = Date.parse('2026-11-16T12:00:00Z')
const USER_ID = '11111111-1111-4111-8111-111111111111'
const FUTURE = '2026-12-16T12:00:00Z'
const PAST = '2026-11-15T12:00:00Z'
const PRODUCT = 'dropsauce_yearly'

afterEach(() => { jest.useRealTimers() })

function customerInfo() {
    return {
        request_date_ms: NOW,
        subscriber: {
            entitlements: {
                'Dropsauce Pro': {
                    product_identifier: PRODUCT,
                    expires_date: FUTURE as string | null,
                    grace_period_expires_date: null as string | null,
                },
            },
            subscriptions: {
                [PRODUCT]: {
                    expires_date: FUTURE as string | null,
                    grace_period_expires_date: null as string | null,
                    is_sandbox: false as boolean | undefined,
                    refunded_at: null as string | null,
                    unsubscribe_detected_at: null as string | null,
                },
            },
        },
    }
}

function setup(options: {
    provider?: unknown
    providerStatus?: number
    fetch?: typeof fetch
    authenticated?: boolean
    secret?: string | null
    allowSandbox?: boolean
    completed?: boolean
    entitlementError?: boolean
    mergeError?: { code: string; message: string }
} = {}) {
    const operations: string[] = []
    const rpcCalls: { name: string; args: Record<string, unknown> }[] = []
    const requests: { url: string; init?: RequestInit }[] = []
    const persisted = { canonical: { recipes: [], notes: [], folders: [] } }
    const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({
            data: options.completed ? { status: 'completed', response_json: persisted } : null,
            error: null,
        }),
        upsert: async () => { operations.push('start-request'); return { error: null } },
        update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
    }
    const client = {
        auth: {
            getUser: async () => ({
                data: { user: options.authenticated === false ? null : { id: USER_ID } },
                error: null,
            }),
        },
        from: () => { operations.push('read-request'); return query },
        rpc: async (name: string, args: Record<string, unknown>) => {
            operations.push(name)
            rpcCalls.push({ name, args })
            return name === 'apply_revenuecat_entitlement_event'
                ? { data: null, error: options.entitlementError ? { message: 'internal details' } : null }
                : { data: persisted, error: options.mergeError ?? null }
        },
    }
    const env: Record<string, string | undefined> = {
        SUPABASE_URL: 'https://fixture.invalid',
        SUPABASE_ANON_KEY: 'fixture-public-key',
        SUPABASE_SERVICE_ROLE_KEY: 'fixture-server-key',
        REVENUECAT_SECRET_API_KEY: options.secret === null ? undefined : options.secret ?? 'sk_fixture_only',
        REVENUECAT_ALLOW_SANDBOX: options.allowSandbox ? 'true' : undefined,
    }
    const dependencies: PremiumUpgradeDependencies = {
        createClient: () => client as unknown as SupabaseClient,
        getEnv: (name) => env[name],
        now: () => NOW,
        fetch: options.fetch ?? (async (input, init) => {
            operations.push('verify-provider')
            requests.push({ url: String(input), init })
            return Response.json(options.provider === undefined ? customerInfo() : options.provider, {
                status: options.providerStatus ?? 200,
            })
        }),
    }
    const handle = createPremiumUpgradeHandler(dependencies)
    const request = (body: unknown = { idempotencyKey: 'fixture-operation', entities: {} }) => new Request(
        'https://fixture.invalid/functions/v1/premium-upgrade-sync',
        { method: 'POST', headers: { Authorization: 'Bearer fixture-session' }, body: JSON.stringify(body) },
    )
    return { handle, request, operations, rpcCalls, requests }
}

test('missing/invalid authentication cannot query RevenueCat or touch service-role data', async () => {
    const fixture = setup({ authenticated: false })
    assert.equal((await fixture.handle(new Request('https://fixture.invalid', { method: 'POST' }))).status, 401)
    assert.equal((await fixture.handle(fixture.request())).status, 401)
    assert.deepEqual(fixture.operations, [])
})

test('a Free user cannot grant Premium with empty entities or forged client state', async () => {
    const provider = customerInfo()
    delete (provider.subscriber.entitlements as Record<string, unknown>)['Dropsauce Pro']
    const fixture = setup({ provider })
    const response = await fixture.handle(fixture.request({
        idempotencyKey: 'exploit-attempt', billingCycle: 'year', plan: 'premium',
        userId: 'another-account', customerInfo: customerInfo(), entities: { recipes: [], notes: [], folders: [] },
    }))
    assert.equal(response.status, 403)
    assert.deepEqual(fixture.operations, ['verify-provider'])
    assert.equal(fixture.requests[0].url, `https://api.revenuecat.com/v1/subscribers/${USER_ID}`)
})

test.each(['expired', 'refunded', 'missing-product', 'missing-expiry', 'unknown-environment'])(
    '%s subscriptions fail closed',
    async (kind) => {
        const provider = customerInfo()
        const entitlement = provider.subscriber.entitlements['Dropsauce Pro']
        const subscription = provider.subscriber.subscriptions[PRODUCT]
        if (kind === 'expired') { entitlement.expires_date = PAST; subscription.expires_date = PAST }
        if (kind === 'refunded') subscription.refunded_at = PAST
        if (kind === 'missing-product') entitlement.product_identifier = 'unrelated-product'
        if (kind === 'missing-expiry') entitlement.expires_date = null
        if (kind === 'unknown-environment') subscription.is_sandbox = undefined
        const fixture = setup({ provider })
        assert.equal((await fixture.handle(fixture.request())).status, 403)
        assert.deepEqual(fixture.operations, ['verify-provider'])
    },
)

test('sandbox subscriptions require explicit server-side opt-in', async () => {
    const provider = customerInfo()
    provider.subscriber.subscriptions[PRODUCT].is_sandbox = true
    const production = setup({ provider })
    assert.equal((await production.handle(production.request())).status, 403)
    const development = setup({ provider, allowSandbox: true })
    assert.equal((await development.handle(development.request())).status, 200)
})

test('verified purchase confirms access before merging, without waiting for a webhook', async () => {
    const fixture = setup()
    const response = await fixture.handle(fixture.request({ idempotencyKey: 'new-purchase', billingCycle: 'month' }))
    assert.equal(response.status, 200)
    assert.equal(fixture.operations[0], 'verify-provider')
    assert.equal(fixture.operations[1], 'apply_revenuecat_entitlement_event')
    assert.equal(fixture.operations.at(-2), 'premium_upgrade_merge')
    assert.deepEqual(fixture.rpcCalls[0], {
        name: 'apply_revenuecat_entitlement_event',
        args: { p_user_id: USER_ID, p_plan: 'premium', p_billing_cycle: 'year', p_event_at: new Date(NOW).toISOString() },
    })
    assert.equal(fixture.rpcCalls[1].args.p_billing_cycle, 'year')
})

test('Google Play base-plan metadata supplies the verified billing cycle', async () => {
    const provider = customerInfo()
    const entitlement = provider.subscriber.entitlements['Dropsauce Pro']
    const subscription = provider.subscriber.subscriptions[PRODUCT]
    const fixture = setup({
        provider: {
            ...provider,
            subscriber: {
                entitlements: { 'Dropsauce Pro': { ...entitlement, product_identifier: 'dropsauce_pro', product_plan_identifier: 'annual' } },
                subscriptions: { dropsauce_pro: { ...subscription, product_plan_identifier: 'annual' } },
            },
        },
    })
    assert.equal((await fixture.handle(fixture.request())).status, 200)
    assert.equal(fixture.rpcCalls[0].args.p_billing_cycle, 'year')
})

test.each([false, true])('paid-through cancellation or billing grace retains access (grace: %s)', async (grace) => {
    const provider = customerInfo()
    provider.subscriber.subscriptions[PRODUCT].unsubscribe_detected_at = PAST
    if (grace) {
        provider.subscriber.entitlements['Dropsauce Pro'].expires_date = PAST
        provider.subscriber.entitlements['Dropsauce Pro'].grace_period_expires_date = FUTURE
        provider.subscriber.subscriptions[PRODUCT].expires_date = PAST
        provider.subscriber.subscriptions[PRODUCT].grace_period_expires_date = FUTURE
    }
    const fixture = setup({ provider })
    assert.equal((await fixture.handle(fixture.request())).status, 200)
})

test('completed idempotency keys do not bypass current entitlement verification', async () => {
    const provider = customerInfo()
    provider.subscriber.entitlements['Dropsauce Pro'].expires_date = PAST
    const fixture = setup({ provider, completed: true })
    assert.equal((await fixture.handle(fixture.request())).status, 403)
    assert.deepEqual(fixture.operations, ['verify-provider'])
    const valid = setup({ completed: true })
    assert.equal((await valid.handle(valid.request())).status, 200)
    assert.equal(valid.rpcCalls.some((call) => call.name === 'premium_upgrade_merge'), false)
})

test('missing secrets and public SDK keys never fall back to stored Premium flags', async () => {
    for (const secret of [null, 'goog_fixture_only']) {
        const fixture = setup({ secret, completed: true })
        assert.equal((await fixture.handle(fixture.request())).status, 503)
        assert.deepEqual(fixture.operations, [])
    }
})

test('provider outages, invalid JSON and malformed snapshots return sanitized errors', async () => {
    const fixtures = [
        setup({ providerStatus: 429 }),
        setup({ provider: {} }),
        setup({ provider: { ...customerInfo(), request_date_ms: 'invalid' } }),
        setup({ fetch: async () => { throw new Error('private provider diagnostic') } }),
        setup({ fetch: async () => new Response('invalid-json') }),
    ]
    for (const fixture of fixtures) {
        const response = await fixture.handle(fixture.request())
        assert.equal(response.status, 503)
        assert.equal((await response.text()).includes('private'), false)
        assert.equal(fixture.rpcCalls.length, 0)
    }
})

test('slow provider requests are aborted and cannot reach the merge', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] })
    let startFetch: () => void = () => {}
    const fetching = new Promise<void>((resolve) => { startFetch = resolve })
    const fixture = setup({
        fetch: async (_input, init) => new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
            startFetch()
        }),
    })
    const response = fixture.handle(fixture.request())
    await fetching
    jest.advanceTimersByTime(10_000)
    assert.equal((await response).status, 503)
    assert.equal(fixture.rpcCalls.length, 0)
})

test('malformed bodies are rejected before provider calls', async () => {
    for (const body of [null, [], {}, { idempotencyKey: 1 }, { idempotencyKey: 'ok', entities: { recipes: {} } }]) {
        const fixture = setup()
        assert.equal((await fixture.handle(fixture.request(body))).status, 400)
        assert.deepEqual(fixture.operations, [])
    }
})

test('failed entitlement persistence or a newer database revocation prevents merging/success', async () => {
    const failedSave = setup({ entitlementError: true })
    assert.equal((await failedSave.handle(failedSave.request())).status, 503)
    assert.equal(failedSave.rpcCalls.length, 1)
    const revoked = setup({ mergeError: { code: '42501', message: 'private database diagnostic' } })
    const response = await revoked.handle(revoked.request())
    assert.equal(response.status, 403)
    assert.equal((await response.text()).includes('private'), false)
})
