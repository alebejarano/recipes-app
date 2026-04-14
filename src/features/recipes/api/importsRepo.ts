import { Platform } from 'react-native'

import { supabase } from '@/lib/supabase'

export type UploadPremiumImportInput = {
  uri: string
  fileName: string
  mimeType: string
  title?: string | null
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

async function getAccessToken() {
  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    throw new Error('Your session expired. Please sign in again.')
  }

  const accessToken =
    refreshedData.session?.access_token ??
    (await supabase.auth.getSession()).data.session?.access_token ??
    null
  if (!accessToken) {
    throw new Error('Your session expired. Please sign in again.')
  }

  return accessToken
}

function requireFunctionEnv() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  const supabaseKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ''

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
    const response = await fetch(input.uri)
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
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData as any,
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
