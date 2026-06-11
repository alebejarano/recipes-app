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
        console.error('delete-account storage list failed', {
          bucket,
          userId,
          message: listError.message,
        })
        throw new Error(`Account deletion failed (storage_list_${bucket.replace('-', '_')})`)
      }

      const paths = (objects ?? [])
        .filter((object) => object.id)
        .map((object) => `${userId}/${object.name}`)
      if (paths.length === 0) break

      const { error: removeError } = await adminClient.storage.from(bucket).remove(paths)
      if (removeError) {
        console.error('delete-account storage removal failed', {
          bucket,
          userId,
          message: removeError.message,
        })
        throw new Error(`Account deletion failed (storage_remove_${bucket.replace('-', '_')})`)
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

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      console.error('delete-account auth user removal failed', {
        userId: user.id,
        message: deleteError.message,
      })
      return json({ error: 'Account deletion failed (auth_user_removal)' }, 500)
    }

    return json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return json({ error: `Server error: ${message}` }, 500)
  }
})
