import { fetchWithTimeout } from '@/lib/network'
import { supabase } from '@/lib/supabase'

const RECIPE_EXTRACTION_TIMEOUT_MS = 15_000

export type RecipeExtraction = {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  recipe: Record<string, unknown> | null
  missingFields: string[]
  failure: {
    code: string
    message: string | null
  } | null
}

type RecipeExtractionResponse = Omit<RecipeExtraction, 'missingFields'> & {
  missing_fields?: unknown
}

function parseRecipeExtraction(payload: unknown): RecipeExtraction {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid recipe extraction response.')
  }

  const extraction = payload as RecipeExtractionResponse
  return {
    ...extraction,
    missingFields: Array.isArray(extraction.missing_fields)
      ? extraction.missing_fields.filter((field): field is string => typeof field === 'string')
      : [],
  }
}

function getApiUrl() {
  return process.env.EXPO_PUBLIC_LARAVEL_API_URL?.trim().replace(/\/$/, '') ?? ''
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback

  const message = (payload as { message?: unknown; error?: unknown }).message
    ?? (payload as { error?: unknown }).error

  return typeof message === 'string' && message.trim() ? message : fallback
}

async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  if (data.session?.access_token) return data.session.access_token

  const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) throw refreshError
  if (!refreshedData.session?.access_token) {
    throw new Error('Your session expired. Please sign in again.')
  }

  return refreshedData.session.access_token
}

async function readJson(response: Response) {
  try {
    return await response.json() as unknown
  } catch {
    return null
  }
}

export function isRecipeExtractionConfigured() {
  return Boolean(getApiUrl())
}

export async function createRecipeExtraction(recipeDocumentImportId: string) {
  const apiUrl = getApiUrl()
  if (!apiUrl) return null

  const accessToken = await getAccessToken()
  const response = await fetchWithTimeout(`${apiUrl}/api/recipe-extractions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': recipeDocumentImportId,
    },
    body: JSON.stringify({ recipe_document_import_id: recipeDocumentImportId }),
    timeoutMs: RECIPE_EXTRACTION_TIMEOUT_MS,
    timeoutMessage: 'Recipe extraction request timed out',
    logOperation: 'create_recipe_extraction',
    logEntity: 'import',
  })

  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, 'Unable to start recipe extraction.'))
  }

  return parseRecipeExtraction(payload)
}

export async function getRecipeExtraction(recipeExtractionId: string) {
  const apiUrl = getApiUrl()
  if (!apiUrl) throw new Error('Recipe extraction is not configured.')

  const accessToken = await getAccessToken()
  const response = await fetchWithTimeout(`${apiUrl}/api/recipe-extractions/${recipeExtractionId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    timeoutMs: RECIPE_EXTRACTION_TIMEOUT_MS,
    timeoutMessage: 'Recipe extraction request timed out',
    logOperation: 'get_recipe_extraction',
    logEntity: 'import',
  })

  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, 'Unable to get recipe extraction.'))
  }

  return parseRecipeExtraction(payload)
}
