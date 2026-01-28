// src/lib/navigation.ts
export type SafeReturnTo = `/${string}` | undefined

export function getSafeReturnTo(value?: string | string[]): SafeReturnTo {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/')) return undefined
  return value as `/${string}`
}
