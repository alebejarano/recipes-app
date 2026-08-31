function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
      ? error.message
      : ''
}

export function isRateLimitError(error: unknown) {
  const normalized = getErrorMessage(error).toLowerCase()

  return (
    normalized.includes('rate limit') ||
    normalized.includes('too many requests') ||
    normalized.includes('too many emails') ||
    normalized.includes('security purposes')
  )
}

export function getUserFacingErrorMessage(error: unknown, fallback = 'Please try again.') {
  const message = getErrorMessage(error)
  const normalized = message.toLowerCase()

  if (!message) return fallback
  if (
    normalized.includes('network') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('timed out') ||
    normalized.includes('timeout') ||
    normalized.includes('socket') ||
    normalized.includes('abort') ||
    normalized.includes('unknownhost') ||
    normalized.includes('unable to resolve host') ||
    normalized.includes('no address associated with hostname')
  ) {
    return 'We could not connect. Check your internet connection and try again.'
  }
  if (
    normalized.includes('jwt') ||
    normalized.includes('session') ||
    normalized.includes('not authenticated') ||
    normalized.includes('unauthorized')
  ) {
    return 'Your session expired. Please sign in again.'
  }
  if (normalized.includes('duplicate') || normalized.includes('already exists')) {
    return 'This already exists.'
  }
  if (normalized.includes('permission') || normalized.includes('row-level security')) {
    return 'You do not have permission to do that.'
  }
  if (normalized.includes('storage limit') || normalized.includes('import limit')) {
    return message
  }
  if (normalized.includes('file too large') || normalized.includes('larger than')) {
    return message
  }
  if (normalized.includes('encrypted') || normalized.includes('password-protected')) {
    return message
  }

  // Unexpected backend, database, and SDK errors can expose implementation
  // details (for example table names or schema-cache messages). Only return
  // messages that have been explicitly identified as useful to customers.
  return fallback
}
