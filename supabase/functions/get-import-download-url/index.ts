import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SIGNED_URL_TTL_SECONDS = 60 * 60
const VISIBLE_IMPORT_STATUSES = new Set(['uploaded', 'processing', 'ready'])

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function json(body: Record<string, unknown>, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json',
    },
  })
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders(origin) })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Download service is not configured' }, 500, origin)
  }

  const authorization = req.headers.get('Authorization')
  if (!authorization) return json({ error: 'Unauthorized' }, 401, origin)

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser()
  if (authError || !user) return json({ error: 'Unauthorized' }, 401, origin)

  let documentId: unknown
  try {
    documentId = (await req.json() as { documentId?: unknown }).documentId
  } catch {
    return json({ error: 'Invalid request body' }, 400, origin)
  }
  if (!isUuid(documentId)) return json({ error: 'Invalid document id' }, 400, origin)

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: document, error: documentError } = await adminClient
    .from('recipe_document_imports')
    .select('storage_bucket,storage_path,status')
    .eq('id', documentId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle()
  if (documentError) return json({ error: 'Unable to find import' }, 500, origin)
  if (!document || !VISIBLE_IMPORT_STATUSES.has(document.status)) {
    return json({ error: 'Import not found' }, 404, origin)
  }

  const { data: signedData, error: signedError } = await adminClient.storage
    .from(document.storage_bucket)
    .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS)
  if (signedError || !signedData?.signedUrl) {
    return json({ error: 'The stored import is unavailable' }, 404, origin)
  }

  return json({ signedUrl: signedData.signedUrl }, 200, origin)
})
