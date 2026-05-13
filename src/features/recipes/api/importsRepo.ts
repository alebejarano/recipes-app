import { Platform } from 'react-native'

import { supabase } from '@/lib/supabase'
import { fetchWithTimeout, FILE_READ_TIMEOUT_MS, UPLOAD_REQUEST_TIMEOUT_MS } from '@/lib/network'

export type UploadPremiumImportInput = {
  uri: string
  fileName: string
  mimeType: string
  title?: string | null
  timeoutMs?: number
}

export type UploadPremiumImportResult = {
  bucket: string
  path: string
  mimeType: string
  size: number
  document?: {
    id: string
    title: string | null
    original_file_name: string
    storage_bucket: string
    storage_path: string
    mime_type: string
    bytes: number
    created_at: string
  } | null
}

type DuplicateImportPayload = {
  id?: string | null
  title?: string | null
  created_at?: string | null
}

function isConnectivityError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
        ? error.message.toLowerCase()
        : ''

  return (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timed out') ||
    message.includes('timeout') ||
    message.includes('socket') ||
    message.includes('abort') ||
    message.includes('unknownhost') ||
    message.includes('unable to resolve host') ||
    message.includes('no address associated with hostname')
  )
}

async function getAccessToken() {
  const sessionResult = await supabase.auth.getSession()
  if (sessionResult.error) {
    if (isConnectivityError(sessionResult.error)) throw sessionResult.error
    throw new Error('Your session expired. Please sign in again.')
  }

  const currentAccessToken = sessionResult.data.session?.access_token ?? null
  if (currentAccessToken) return currentAccessToken

  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    if (isConnectivityError(refreshError)) throw refreshError
    throw new Error('Your session expired. Please sign in again.')
  }

  const accessToken = refreshedData.session?.access_token ?? null
  if (!accessToken) {
    throw new Error('Your session expired. Please sign in again.')
  }

  return accessToken
}

function requireFunctionEnv() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration for upload.')
  }

  return {
    functionUrl: `${supabaseUrl}/functions/v1/validate-and-upload-import`,
    supabaseKey,
  }
}

async function extractResponsePayload(response: Response) {
  try {
    const raw = await response.text()
    if (!raw) {
      return null as null | Record<string, unknown>
    }
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null as null | Record<string, unknown>
  }
}

async function buildUploadFormData(input: UploadPremiumImportInput) {
  const formData = new FormData()

  if (Platform.OS === 'web') {
    const response = await fetchWithTimeout(input.uri, {
      timeoutMs: FILE_READ_TIMEOUT_MS,
      timeoutMessage: 'File read timed out',
      logOperation: 'read_import_file',
      logEntity: 'import',
    })
    if (!response.ok) {
      throw new Error(`Unable to read selected file (${response.status}).`)
    }
    const blob = await response.blob()
    formData.append('file', blob, input.fileName.trim() || 'import')
  } else {
    formData.append('file', {
      uri: input.uri,
      name: input.fileName.trim() || 'import',
      type: input.mimeType,
    } as any)
  }

  if (input.title?.trim()) {
    formData.append('title', input.title.trim())
  }

  return formData
}

export async function uploadPremiumImport(
  input: UploadPremiumImportInput
): Promise<UploadPremiumImportResult> {
  const accessToken = await getAccessToken()
  const { functionUrl, supabaseKey } = requireFunctionEnv()
  const formData = await buildUploadFormData(input)
  const response = await fetchWithTimeout(functionUrl, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData as any,
    timeoutMs: input.timeoutMs ?? UPLOAD_REQUEST_TIMEOUT_MS,
    timeoutMessage: 'Import upload timed out',
    logOperation: 'upload_import',
    logEntity: 'import',
  })

  const payload = await extractResponsePayload(response)

  if (!response.ok) {
    if (response.status === 409 && payload?.code === 'duplicate_import') {
      const duplicate = (payload.duplicate ?? null) as DuplicateImportPayload | null
      const duplicateError = new Error(String(payload.error ?? 'This file has already been imported.')) as Error & {
        code?: string
        duplicate?: {
          id: string
          title: string | null
          createdAt: string | null
        } | null
      }
      duplicateError.code = 'duplicate_import'
      duplicateError.duplicate = duplicate?.id
        ? {
            id: duplicate.id,
            title: duplicate.title ?? null,
            createdAt: duplicate.created_at ?? null,
          }
        : null
      throw duplicateError
    }

    const message =
      String(payload?.error ?? payload?.message ?? '') ||
      'Upload failed'
    throw new Error(message)
  }

  return (payload ?? null) as UploadPremiumImportResult
}
