import type { PlanLimitReachedType } from '@/features/subscription/components/PlanLimitReachedModal'

function normalizeErrorText(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error.toLowerCase()
  if (error instanceof Error) return error.message.toLowerCase()

  const maybeMessage = (error as any)?.message
  const maybeDetails = (error as any)?.details
  const maybeHint = (error as any)?.hint

  return [maybeMessage, maybeDetails, maybeHint]
    .filter((value) => typeof value === 'string')
    .join(' ')
    .toLowerCase()
}

export function getPlanLimitTypeFromError(error: unknown): PlanLimitReachedType | null {
  const message = normalizeErrorText(error)
  if (!message) return null

  const isRecipeLimit =
    message.includes('local plan limit reached') ||
    (message.includes('recipe') && message.includes('limit')) ||
    message.includes('100 recipes')
  if (isRecipeLimit) return 'recipes'

  const isStorageLimit =
    message.includes('import limit reached') ||
    message.includes('storage limit reached') ||
    (message.includes('50 mb') && (message.includes('storage') || message.includes('files')))
  if (isStorageLimit) return 'storage'

  return null
}
