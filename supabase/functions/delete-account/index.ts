import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

const USER_STORAGE_BUCKETS = ['recipe-images', 'recipe-imports'] as const

async function deleteUserStorage(
  adminClient: ReturnType<typeof createClient>,
  userId: string
) {
  for (const bucket of USER_STORAGE_BUCKETS) {
    while (true) {
      const { data: objects, error: listError } = await adminClient.storage
        .from(bucket)
        .list(userId, {
          limit: 100,
          offset: 0,
        })
      if (listError) {
        throw new Error(`Failed to list ${bucket}: ${listError.message}`)
      }

      const paths = (objects ?? [])
        .filter((object) => object.id)
        .map((object) => `${userId}/${object.name}`)
      if (paths.length === 0) break

      const { error: removeError } = await adminClient.storage.from(bucket).remove(paths)
      if (removeError) {
        throw new Error(`Failed to delete ${bucket}: ${removeError.message}`)
      }
    }
  }
}

serve(async (req) => {
  try {
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
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser()
    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    await deleteUserStorage(adminClient, user.id)

    const { error: uploadEventsError } = await adminClient
      .from('import_upload_events')
      .delete()
      .eq('user_id', user.id)
    if (uploadEventsError) {
      return json({ error: `Failed to delete import history: ${uploadEventsError.message}` }, 400)
    }

    const { error: uploadStateError } = await adminClient
      .from('import_upload_user_state')
      .delete()
      .eq('user_id', user.id)
    if (uploadStateError) {
      return json({ error: `Failed to delete import state: ${uploadStateError.message}` }, 400)
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return json({ error: `Failed to delete user: ${deleteError.message}` }, 400)
    }

    return json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return json({ error: `Server error: ${message}` }, 500)
  }
})
