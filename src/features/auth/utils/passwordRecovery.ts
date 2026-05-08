import * as Linking from 'expo-linking'

type PasswordRecoverySession = {
  accessToken: string
  refreshToken: string
  type?: string
}

type AuthLinkSession = PasswordRecoverySession

type AuthLinkParams = {
  accessToken?: string
  refreshToken?: string
  code?: string
  type?: string
  path?: string | null
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

export function getEmailConfirmationRedirectUrl() {
  return Linking.createURL('/login')
}

export function getAuthLinkParamsFromUrl(url: string): AuthLinkParams {
  const parsed = Linking.parse(normalizeDeepLink(url))

  return {
    accessToken: getParamValue(parsed.queryParams?.access_token),
    refreshToken: getParamValue(parsed.queryParams?.refresh_token),
    code: getParamValue(parsed.queryParams?.code),
    type: getParamValue(parsed.queryParams?.type),
    path: parsed.path,
  }
}

export function getAuthLinkSessionFromUrl(url: string): AuthLinkSession | null {
  const { accessToken, refreshToken, type } = getAuthLinkParamsFromUrl(url)

  if (!accessToken || !refreshToken) {
    return null
  }

  return {
    accessToken,
    refreshToken,
    type,
  }
}

export function getPasswordRecoverySessionFromUrl(url: string): PasswordRecoverySession | null {
  const session = getAuthLinkSessionFromUrl(url)

  if (session?.type && session.type !== 'recovery') {
    return null
  }

  return session
}
