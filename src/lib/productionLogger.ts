export type OperationalEventName =
  | 'request_failed'
  | 'request_timeout'
  | 'offline_fallback_saved'
  | 'sync_retry_started'
  | 'sync_retry_failed'
  | 'sync_retry_succeeded'

type OperationalEventProperties = {
  operation: string
  entity?: 'recipe' | 'note' | 'folder' | 'import' | 'file' | 'supabase'
  category?: string
  count?: number
  pending_count?: number
  success_count?: number
  failure_count?: number
  timeout_ms?: number
  queued?: boolean
}

type CaptureFn = (event: string, properties: OperationalEventProperties) => void

let capture: CaptureFn | null = null

export function setProductionLogCapture(nextCapture: CaptureFn | null) {
  capture = nextCapture
}

export function getErrorCategory(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
        ? error.message.toLowerCase()
        : ''

  if (
    message.includes('timed out') ||
    message.includes('timeout')
  ) {
    return 'timeout'
  }
  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('socket') ||
    message.includes('abort') ||
    message.includes('unknownhost') ||
    message.includes('unable to resolve host') ||
    message.includes('no address associated with hostname')
  ) {
    return 'network'
  }
  if (
    message.includes('jwt') ||
    message.includes('session') ||
    message.includes('not authenticated') ||
    message.includes('unauthorized')
  ) {
    return 'auth'
  }
  if (message.includes('duplicate') || message.includes('already exists')) {
    return 'duplicate'
  }
  if (message.includes('permission') || message.includes('row-level security')) {
    return 'permission'
  }
  if (message.includes('storage limit') || message.includes('import limit')) {
    return 'limit'
  }
  if (message.includes('file too large') || message.includes('larger than')) {
    return 'file_size'
  }
  if (message.includes('encrypted') || message.includes('password-protected')) {
    return 'unsupported_file'
  }

  return 'unknown'
}

export function logOperationalEvent(
  event: OperationalEventName,
  properties: OperationalEventProperties
) {
  const sanitizedProperties: OperationalEventProperties = {
    operation: properties.operation,
    entity: properties.entity,
    category: properties.category,
    count: properties.count,
    pending_count: properties.pending_count,
    success_count: properties.success_count,
    failure_count: properties.failure_count,
    timeout_ms: properties.timeout_ms,
    queued: properties.queued,
  }

  try {
    capture?.(event, sanitizedProperties)
  } catch {
    // Logging must never affect user workflows.
  }
}
