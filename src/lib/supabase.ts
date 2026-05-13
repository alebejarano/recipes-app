import { createClient, processLock } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import { DEFAULT_REQUEST_TIMEOUT_MS, fetchWithTimeout, UPLOAD_REQUEST_TIMEOUT_MS } from '@/lib/network'
import { getErrorCategory, logOperationalEvent } from '@/lib/productionLogger'

function requireEnvVar(value: string | undefined, errorMessage: string): string {
  if (!value) {
    throw new Error(errorMessage)
  }
  return value
}

const supabaseUrl = requireEnvVar(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  'Missing Supabase URL. Set EXPO_PUBLIC_SUPABASE_URL.'
)
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabaseClientKey = requireEnvVar(
  supabasePublishableKey,
  'Missing Supabase client key. Set EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
)

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key) as Promise<string | null>,
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

// Force a non-zero lock wait time even if auth-js asks for 0ms
const lockWithTimeout = async <T,>(
  name: string,
  _acquireTimeout: number,
  fn: () => Promise<T>
): Promise<T> => {
  return processLock(name, 20_000, fn)
}

declare global {
  var __recipesapp_supabase_appstate_bound: boolean | undefined
  var __recipesapp_supabase_client: SupabaseClient | undefined
}

function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseClientKey, {
    global: {
      fetch: (input, init) => {
        const method = init?.method?.toUpperCase()
        const timeoutMs = method && method !== 'GET' && method !== 'HEAD'
          ? UPLOAD_REQUEST_TIMEOUT_MS
          : DEFAULT_REQUEST_TIMEOUT_MS

        return fetchWithTimeout(input, {
          ...init,
          timeoutMs,
          timeoutMessage: 'Supabase request timed out',
          logFailures: false,
        }).catch((error) => {
          logOperationalEvent(getErrorCategory(error) === 'timeout' ? 'request_timeout' : 'request_failed', {
            operation: 'supabase_request',
            entity: 'supabase',
            category: getErrorCategory(error),
            timeout_ms: timeoutMs,
          })
          throw error
        })
      },
    },
    auth: {
      ...(Platform.OS !== 'web' ? { storage: ExpoSecureStoreAdapter } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: lockWithTimeout,
    },
  })
}

export const supabase = global.__recipesapp_supabase_client ?? createSupabaseClient()

if (!global.__recipesapp_supabase_client) {
  global.__recipesapp_supabase_client = supabase
}

if (Platform.OS !== 'web' && !global.__recipesapp_supabase_appstate_bound) {
  global.__recipesapp_supabase_appstate_bound = true

  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh()
    else supabase.auth.stopAutoRefresh()
  })
}
