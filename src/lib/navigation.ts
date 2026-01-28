// src/lib/navigation.ts
export type SafeReturnTo = Parameters<typeof import('expo-router').router.replace>[0] | undefined

export function getSafeReturnTo(value?: string | string[]): SafeReturnTo {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/')) return undefined
  return value as SafeReturnTo
}
