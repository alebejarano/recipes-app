import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const PREMIUM_ENTITLEMENT_ID = 'Dropsauce Pro'
const PREMIUM_EVENT_TYPES = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'NON_RENEWING_PURCHASE',
])

type RevenueCatEvent = {
  type?: string
  app_user_id?: string
  original_app_user_id?: string
  aliases?: unknown
  entitlement_id?: string
  entitlement_ids?: unknown
  product_id?: string
  event_timestamp_ms?: number
}

type RevenueCatWebhookPayload = {
  event?: RevenueCatEvent
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function getUserId(event: RevenueCatEvent): string | null {
  const aliases = Array.isArray(event.aliases) ? event.aliases : []
  const candidates = [event.app_user_id, event.original_app_user_id, ...aliases]
  return candidates.find(isUuid) ?? null
}

function hasPremiumEntitlement(event: RevenueCatEvent) {
  if (event.entitlement_id === PREMIUM_ENTITLEMENT_ID) return true
  return Array.isArray(event.entitlement_ids) && event.entitlement_ids.includes(PREMIUM_ENTITLEMENT_ID)
}

function getBillingCycle(productId: unknown): 'month' | 'year' {
  const normalized = typeof productId === 'string' ? productId.toLowerCase() : ''
  return normalized.includes('year') || normalized.includes('annual') ? 'year' : 'month'
}

serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expectedAuthorization = Deno.env.get('REVENUECAT_WEBHOOK_AUTHORIZATION')
  if (!expectedAuthorization) {
    console.error('RevenueCat webhook authorization is not configured')
    return json({ error: 'Webhook is not configured' }, 500)
  }

  if (req.headers.get('Authorization') !== expectedAuthorization) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase service-role configuration is missing')
    return json({ error: 'Webhook is not configured' }, 500)
  }

  let payload: RevenueCatWebhookPayload
  try {
    payload = (await req.json()) as RevenueCatWebhookPayload
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const event = payload.event
  if (!event || !hasPremiumEntitlement(event)) return json({ received: true })

  const userId = getUserId(event)
  if (!userId) {
    console.warn('RevenueCat webhook did not include a Supabase user ID')
    return json({ received: true })
  }

  const eventType = typeof event.type === 'string' ? event.type : ''
  const plan = eventType === 'EXPIRATION'
    ? 'free'
    : PREMIUM_EVENT_TYPES.has(eventType)
      ? 'premium'
      : null
  if (!plan) return json({ received: true })

  const eventTimestamp = Number(event.event_timestamp_ms)
  const eventAt = Number.isFinite(eventTimestamp)
    ? new Date(eventTimestamp).toISOString()
    : new Date().toISOString()
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await adminClient.rpc('apply_revenuecat_entitlement_event', {
    p_user_id: userId,
    p_plan: plan,
    p_billing_cycle: getBillingCycle(event.product_id),
    p_event_at: eventAt,
  })

  if (error) {
    console.error('Failed to apply RevenueCat entitlement event', {
      eventType,
      userId,
      message: error.message,
    })
    return json({ error: 'Unable to process webhook' }, 500)
  }

  return json({ received: true })
})
