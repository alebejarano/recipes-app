import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const IMPORTS_BUCKET = Deno.env.get('IMPORTS_BUCKET') ?? 'recipe-imports'
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function isEncryptedPdf(bytes: Uint8Array) {
  const sampleSize = Math.min(bytes.byteLength, 1024 * 1024)
  const sample = new TextDecoder().decode(bytes.subarray(0, sampleSize))
  return /\/Encrypt\b/i.test(sample)
}

function mapGuardFailureToHttpStatus(reason: string | undefined) {
  if (!reason) return 429
  if (reason === 'monthly_threshold_support' || reason === 'monthly_review_required') return 403
  if (reason === 'invalid_file_size') return 400
  return 429
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

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return json({ error: 'Expected multipart/form-data' }, 400)
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return json({ error: 'Missing file' }, 400)
  }

  const mimeType = (file.type || '').toLowerCase()
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return json({ error: 'Unsupported file type. Allowed: PDF, JPG, PNG.' }, 400)
  }

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  if (!Number.isFinite(bytes.byteLength) || bytes.byteLength <= 0) {
    return json({ error: 'Invalid file size.' }, 400)
  }
  if (bytes.byteLength > MAX_FILE_BYTES) {
    return json({ error: 'This file is too large. Max 10 MB per file.' }, 400)
  }

  if (mimeType === 'application/pdf' && isEncryptedPdf(bytes)) {
    return json({ error: 'Password-protected or encrypted PDFs are not supported.' }, 400)
  }

  const originalName = (file.name || 'import').trim() || 'import'
  const safeName = sanitizeName(originalName)
  const objectPath = `${user.id}/${Date.now()}_${safeName}`

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: guardResult, error: guardError } = await adminClient.rpc(
    'begin_import_upload_guard',
    {
      p_user_id: user.id,
      p_bytes: bytes.byteLength,
    }
  )
  if (guardError) {
    return json({ error: `Fair-use guard failed: ${guardError.message}` }, 500)
  }

  const guard = (guardResult ?? {}) as {
    allowed?: boolean
    reason?: string
    event_id?: string
    retry_after_seconds?: number
    delay_ms?: number
  }
  if (!guard.allowed) {
    const status = mapGuardFailureToHttpStatus(guard.reason)
    return json(
      {
        error:
          guard.reason === 'monthly_threshold_support' || guard.reason === 'monthly_review_required'
            ? 'Monthly fair-use threshold reached. Please contact support for review.'
            : 'Import temporarily limited by fair-use guardrails. Please retry later.',
        reason: guard.reason,
        retry_after_seconds: guard.retry_after_seconds ?? null,
      },
      status
    )
  }

  const eventId = guard.event_id ?? null
  if (typeof guard.delay_ms === 'number' && guard.delay_ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, guard.delay_ms))
  }

  const { error: uploadError } = await adminClient.storage
    .from(IMPORTS_BUCKET)
    .upload(objectPath, bytes, {
      contentType: mimeType,
      upsert: false,
    })
  if (uploadError) {
    if (eventId) {
      await adminClient.rpc('finish_import_upload_guard', {
        p_event_id: eventId,
        p_status: 'failed',
        p_reason: uploadError.message,
      })
    }
    return json({ error: uploadError.message }, 400)
  }

  if (eventId) {
    await adminClient.rpc('finish_import_upload_guard', {
      p_event_id: eventId,
      p_status: 'completed',
      p_reason: null,
    })
  }

  return json({
    bucket: IMPORTS_BUCKET,
    path: objectPath,
    mimeType,
    size: bytes.byteLength,
  })
})
