import * as Linking from 'expo-linking'

type PasswordRecoverySession = {
  accessToken: string
  refreshToken: string
  type?: string
}

function getParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function normalizeDeepLink(url: string) {
  if (!url.includes('#')) {
    return url
  }

  const [base, fragment] = url.split('#', 2)
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}${fragment}`
}

export function getPasswordRecoveryRedirectUrl() {
  return Linking.createURL('/update-password')
}

export function getPasswordRecoverySessionFromUrl(url: string): PasswordRecoverySession | null {
  const parsed = Linking.parse(normalizeDeepLink(url))
  const accessToken = getParamValue(parsed.queryParams?.access_token)
  const refreshToken = getParamValue(parsed.queryParams?.refresh_token)
  const type = getParamValue(parsed.queryParams?.type)

  if (!accessToken || !refreshToken) {
    return null
  }

  return {
    accessToken,
    refreshToken,
    type,
  }
}
