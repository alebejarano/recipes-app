import Constants from 'expo-constants'

export type AppEnv = 'development' | 'preview' | 'production'

function normalizeAppEnv(value: unknown): AppEnv {
  if (value === 'production') return 'production'
  if (value === 'preview') return 'preview'
  return 'development'
}

export function getAppEnv(): AppEnv {
  return normalizeAppEnv(Constants.expoConfig?.extra?.appEnv)
}

export const appEnv = getAppEnv()
export const isDevelopmentAppEnv = appEnv === 'development'
export const isPreviewAppEnv = appEnv === 'preview'
export const isProductionAppEnv = appEnv === 'production'
