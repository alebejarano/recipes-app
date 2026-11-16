import type { createClient, SupabaseClient } from '@supabase/supabase-js'

import { PremiumVerificationError, verifyPremiumSubscription } from './revenuecat.ts'

export type PremiumUpgradeDependencies = {
    createClient: (url: string, key: string, options?: Parameters<typeof createClient>[2]) => SupabaseClient
    getEnv: (name: string) => string | undefined
    fetch?: typeof fetch
    now?: () => number
}

type UpgradePayload = {
    idempotencyKey: string
    clientTimestamp?: string
    entities?: { recipes?: unknown[]; notes?: unknown[]; folders?: unknown[] }
}

function json(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

function parsePayload(value: unknown): UpgradePayload | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const payload = value as Record<string, unknown>
    if (typeof payload.idempotencyKey !== 'string' || !payload.idempotencyKey.trim()
        || payload.idempotencyKey.length > 200) return null
    if (payload.clientTimestamp !== undefined && (typeof payload.clientTimestamp !== 'string'
        || !Number.isFinite(Date.parse(payload.clientTimestamp)))) return null
    if (payload.entities !== undefined) {
        if (!payload.entities || typeof payload.entities !== 'object' || Array.isArray(payload.entities)) return null
        const entities = payload.entities as Record<string, unknown>
        if (['recipes', 'notes', 'folders'].some((key) => entities[key] !== undefined && !Array.isArray(entities[key]))) return null
    }
    return { ...payload, idempotencyKey: payload.idempotencyKey.trim() } as UpgradePayload
}

export function createPremiumUpgradeHandler(dependencies: PremiumUpgradeDependencies) {
    return async (req: Request): Promise<Response> => {
        if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

        const supabaseUrl = dependencies.getEnv('SUPABASE_URL')
        const serviceRoleKey = dependencies.getEnv('SUPABASE_SERVICE_ROLE_KEY')
        const anonKey = dependencies.getEnv('SUPABASE_ANON_KEY')
        if (!supabaseUrl || !serviceRoleKey || !anonKey) {
            return json({ error: 'Upgrade service is not configured.' }, 503)
        }

        const authorization = req.headers.get('Authorization')
        if (!authorization) return json({ error: 'Unauthorized' }, 401)

        try {
            const authClient = dependencies.createClient(supabaseUrl, anonKey, {
                global: { headers: { Authorization: authorization } },
                auth: { persistSession: false, autoRefreshToken: false },
            })
            const { data: { user }, error: authError } = await authClient.auth.getUser()
            if (authError || !user) return json({ error: 'Unauthorized' }, 401)

            let payload: UpgradePayload | null
            try {
                payload = parsePayload(await req.json())
            } catch {
                return json({ error: 'Invalid JSON body' }, 400)
            }
            if (!payload) return json({ error: 'Invalid upgrade payload' }, 400)

            // Verify the authenticated ID, never a caller-supplied customer ID,
            // client entitlement, billing cycle, or cached Supabase Premium flag.
            // Do this before even returning a previously completed response.
            const premium = await verifyPremiumSubscription({
                userId: user.id,
                secretApiKey: dependencies.getEnv('REVENUECAT_SECRET_API_KEY'),
                allowSandbox: dependencies.getEnv('REVENUECAT_ALLOW_SANDBOX') === 'true',
                fetch: dependencies.fetch ?? globalThis.fetch,
                now: dependencies.now ?? Date.now,
            })

            const adminClient = dependencies.createClient(supabaseUrl, serviceRoleKey, {
                auth: { persistSession: false, autoRefreshToken: false },
            })
            // A just-purchased subscriber must not wait for the webhook. Use the
            // provider's snapshot time so a newer webhook wins a concurrent race.
            const { error: entitlementError } = await adminClient.rpc('apply_revenuecat_entitlement_event', {
                p_user_id: user.id,
                p_plan: 'premium',
                p_billing_cycle: premium.billingCycle,
                p_event_at: premium.verifiedAt,
            })
            if (entitlementError) return json({ error: 'Unable to confirm Premium access.' }, 503)

            const { data: existingRequest, error: readError } = await adminClient
                .from('premium_upgrade_requests')
                .select('status,response_json')
                .eq('user_id', user.id)
                .eq('idempotency_key', payload.idempotencyKey)
                .maybeSingle()
            if (readError) return json({ error: 'Unable to read upgrade status.' }, 500)
            if (existingRequest?.status === 'completed' && existingRequest.response_json) {
                return json(existingRequest.response_json as Record<string, unknown>)
            }

            const { error: requestError } = await adminClient.from('premium_upgrade_requests').upsert({
                user_id: user.id,
                idempotency_key: payload.idempotencyKey,
                status: 'running',
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id,idempotency_key' })
            if (requestError) return json({ error: 'Unable to start upgrade sync.' }, 500)

            const { data: result, error: mergeError } = await adminClient.rpc('premium_upgrade_merge', {
                p_user_id: user.id,
                p_billing_cycle: premium.billingCycle,
                p_payload: {
                    billingCycle: premium.billingCycle,
                    clientTimestamp: payload.clientTimestamp ?? new Date().toISOString(),
                    entities: {
                        recipes: payload.entities?.recipes ?? [],
                        notes: payload.entities?.notes ?? [],
                        folders: payload.entities?.folders ?? [],
                    },
                },
            })

            const succeeded = !mergeError && result && typeof result === 'object' && !Array.isArray(result) && !('error' in result)
            const { error: saveError } = await adminClient.from('premium_upgrade_requests')
                .update({
                    status: succeeded ? 'completed' : 'failed',
                    ...(succeeded ? { response_json: result } : {}),
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
                .eq('idempotency_key', payload.idempotencyKey)

            if (mergeError?.code === '42501') return json({ error: 'An active Premium subscription is required.' }, 403)
            if (!succeeded || saveError) return json({ error: 'Unable to back up your kitchen. Please try again.' }, 500)
            return json(result as Record<string, unknown>)
        } catch (error) {
            if (error instanceof PremiumVerificationError) return json({ error: error.message }, error.status)
            return json({ error: 'Unable to complete upgrade sync. Please try again.' }, 500)
        }
    }
}
