import { fetch as expoFetch } from 'expo/fetch'
import { getErrorCategory, logOperationalEvent } from '@/lib/productionLogger'

export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000
export const FILE_READ_TIMEOUT_MS = 30_000
export const UPLOAD_REQUEST_TIMEOUT_MS = 60_000

type TimeoutFetchOptions = RequestInit & {
  timeoutMs?: number
  timeoutMessage?: string
  logOperation?: string
  logEntity?: 'file' | 'import' | 'supabase'
  logFailures?: boolean
}

function makeTimeoutError(message: string) {
  return new Error(message)
}

function isFormDataBody(body: unknown) {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  options: TimeoutFetchOptions = {}
): Promise<Response> {
  const {
    timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
    timeoutMessage = 'Request timed out',
    logOperation = 'fetch',
    logEntity = 'file',
    logFailures = true,
    signal,
    ...init
  } = options
  const requestUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url
  const requestInit =
    typeof input === 'string' || input instanceof URL
      ? init
      : {
          method: input.method,
          headers: input.headers,
          body: (input.body ?? undefined) as BodyInit | undefined,
          ...init,
        }
  const controller = new AbortController()
  let didTimeout = false

  if (signal?.aborted) {
    throw makeTimeoutError('Request was aborted')
  }

  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })

  const timeout = setTimeout(() => {
    didTimeout = true
    controller.abort()
  }, timeoutMs)

  try {
    const requestOptions = {
      ...requestInit,
      body: requestInit.body ?? undefined,
      signal: controller.signal,
    }
    if (isFormDataBody(requestOptions.body)) {
      return await globalThis.fetch(requestUrl, requestOptions as RequestInit)
    }

    return await expoFetch(requestUrl, requestOptions as any)
  } catch (error) {
    if (didTimeout) {
      if (logFailures) {
        logOperationalEvent('request_timeout', {
          operation: logOperation,
          entity: logEntity,
          category: 'timeout',
          timeout_ms: timeoutMs,
        })
      }
      throw makeTimeoutError(timeoutMessage)
    }
    if (logFailures) {
      logOperationalEvent('request_failed', {
        operation: logOperation,
        entity: logEntity,
        category: getErrorCategory(error),
      })
    }
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}
