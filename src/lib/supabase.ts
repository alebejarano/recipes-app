import { createClient, processLock } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

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
  // eslint-disable-next-line no-var
  var __recipesapp_supabase_appstate_bound: boolean | undefined
  // eslint-disable-next-line no-var
  var __recipesapp_supabase_client: SupabaseClient | undefined
}

function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
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
