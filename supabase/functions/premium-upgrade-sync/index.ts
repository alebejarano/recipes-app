import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

type UpgradePayload = {
  billingCycle: 'month' | 'year'
  idempotencyKey: string
  clientTimestamp: string
  entities?: {
    recipes?: unknown[]
    notes?: unknown[]
    folders?: unknown[]
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function normalizeBillingCycle(value: unknown): 'month' | 'year' {
  return value === 'year' ? 'year' : 'month'
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Missing Supabase environment variables' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser()
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let payload: UpgradePayload
  try {
    payload = (await req.json()) as UpgradePayload
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const idempotencyKey = String(payload.idempotencyKey ?? '').trim()
  if (!idempotencyKey) {
    return json({ error: 'Missing idempotencyKey' }, 400)
  }

  const billingCycle = normalizeBillingCycle(payload.billingCycle)
  const now = new Date().toISOString()

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: existingRequest, error: readRequestError } = await adminClient
    .from('premium_upgrade_requests')
    .select('status,response_json')
    .eq('user_id', user.id)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (readRequestError) {
    return json({ error: readRequestError.message }, 500)
  }

  if (existingRequest?.status === 'completed' && existingRequest.response_json) {
    return json(existingRequest.response_json as Record<string, unknown>)
  }

  const { error: upsertRequestError } = await adminClient
    .from('premium_upgrade_requests')
    .upsert(
      {
        user_id: user.id,
        idempotency_key: idempotencyKey,
        status: 'running',
        updated_at: now,
      },
      { onConflict: 'user_id,idempotency_key' }
    )
  if (upsertRequestError) {
    return json({ error: upsertRequestError.message }, 500)
  }

  const rpcPayload = {
    billingCycle,
    clientTimestamp: payload.clientTimestamp ?? now,
    entities: {
      recipes: payload.entities?.recipes ?? [],
      notes: payload.entities?.notes ?? [],
      folders: payload.entities?.folders ?? [],
    },
  }

  try {
    const { data: mergeResult, error: mergeError } = await adminClient.rpc('premium_upgrade_merge', {
      p_user_id: user.id,
      p_billing_cycle: billingCycle,
      p_payload: rpcPayload,
    })
    if (mergeError) throw mergeError

    const response =
      mergeResult && typeof mergeResult === 'object'
        ? (mergeResult as Record<string, unknown>)
        : { error: 'Merge RPC returned invalid payload' }

    if ('error' in response) {
      throw new Error(String(response.error ?? 'Merge RPC failed'))
    }

    const { error: saveRequestError } = await adminClient
      .from('premium_upgrade_requests')
      .update({
        status: 'completed',
        response_json: response,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('idempotency_key', idempotencyKey)
    if (saveRequestError) throw saveRequestError

    return json(response)
  } catch (error: unknown) {
    await adminClient
      .from('premium_upgrade_requests')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('idempotency_key', idempotencyKey)

    const message =
      error instanceof Error ? error.message : typeof error === 'object' && error ? JSON.stringify(error) : 'unknown'
    return json({ error: message }, 500)
  }
})
