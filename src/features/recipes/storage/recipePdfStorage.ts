import * as FileSystem from 'expo-file-system'
import { Platform } from 'react-native'

import { runSqlAsync, runSqlBatchAsync } from '@/lib/sqlite'

export type RecipePdfAttachment = {
  id: string
  recipeId: string
  fileName: string
  fileUri: string
  fileSize: number
  createdAt: string
}

export type PdfUsageSummary = {
  totalCount: number
  totalBytes: number
}

export type PendingPdfAttachment = {
  uri: string
  name: string
  size: number
}

const ATTACHMENTS_DIR = `${FileSystem.documentDirectory ?? ''}recipe-pdfs`

const MIGRATION_STATEMENTS = [
  {
    sql: `CREATE TABLE IF NOT EXISTS recipe_pdf_attachments (
      id TEXT PRIMARY KEY NOT NULL,
      recipe_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_uri TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );`,
  },
  {
    sql: 'CREATE INDEX IF NOT EXISTS recipe_pdf_attachments_recipe_id_idx ON recipe_pdf_attachments(recipe_id);',
  },
]

let migrationsPromise: Promise<void> | null = null

export function ensureRecipePdfStorageReady() {
  if (!migrationsPromise) {
    migrationsPromise = runSqlBatchAsync(MIGRATION_STATEMENTS)
  }
  return migrationsPromise
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function ensureDir() {
  if (!FileSystem.documentDirectory) return
  await FileSystem.makeDirectoryAsync(ATTACHMENTS_DIR, { intermediates: true })
}

function buildDestinationPath(name: string) {
  const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${ATTACHMENTS_DIR}/${Date.now()}_${safeName || 'recipe.pdf'}`
}

export async function listRecipePdfAttachments(recipeId: string): Promise<RecipePdfAttachment[]> {
  await ensureRecipePdfStorageReady()
  const result = await runSqlAsync(
    'SELECT * FROM recipe_pdf_attachments WHERE recipe_id = ? ORDER BY created_at DESC;',
    [recipeId]
  )
  return result.rows._array.map((row) => ({
    id: row.id as string,
    recipeId: row.recipe_id as string,
    fileName: row.file_name as string,
    fileUri: row.file_uri as string,
    fileSize: Number(row.file_size),
    createdAt: row.created_at as string,
  }))
}

export async function getPdfUsageSummary(): Promise<PdfUsageSummary> {
  await ensureRecipePdfStorageReady()
  const result = await runSqlAsync(
    'SELECT COUNT(*) as totalCount, COALESCE(SUM(file_size), 0) as totalBytes FROM recipe_pdf_attachments;'
  )
  const row = result.rows.item(0)
  return {
    totalCount: Number(row?.totalCount ?? 0),
    totalBytes: Number(row?.totalBytes ?? 0),
  }
}

export async function addRecipePdfAttachment(input: {
  recipeId: string
  uri: string
  name: string
  size: number
}): Promise<RecipePdfAttachment> {
  await ensureRecipePdfStorageReady()
  await ensureDir()

  const id = makeId()
  const createdAt = new Date().toISOString()
  const destination = buildDestinationPath(input.name)

  if (Platform.OS !== 'web') {
    await FileSystem.copyAsync({ from: input.uri, to: destination })
  } else {
    // On web, keep the original uri.
  }

  const fileUri = Platform.OS === 'web' ? input.uri : destination
  const fileSize = input.size

  await runSqlAsync(
    `INSERT INTO recipe_pdf_attachments
      (id, recipe_id, file_name, file_uri, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?);`,
    [id, input.recipeId, input.name, fileUri, fileSize, createdAt]
  )

  return {
    id,
    recipeId: input.recipeId,
    fileName: input.name,
    fileUri,
    fileSize,
    createdAt,
  }
}

export async function deleteRecipePdfAttachment(id: string): Promise<void> {
  await ensureRecipePdfStorageReady()
  const result = await runSqlAsync(
    'SELECT file_uri as fileUri FROM recipe_pdf_attachments WHERE id = ?;',
    [id]
  )
  const row = result.rows.item(0)
  if (row?.fileUri && FileSystem.documentDirectory && !row.fileUri.startsWith('http')) {
    try {
      await FileSystem.deleteAsync(row.fileUri, { idempotent: true })
    } catch {
      // ignore delete errors for stale files
    }
  }
  await runSqlAsync('DELETE FROM recipe_pdf_attachments WHERE id = ?;', [id])
}

export async function deleteRecipePdfAttachmentsForRecipe(recipeId: string): Promise<void> {
  await ensureRecipePdfStorageReady()
  const result = await runSqlAsync(
    'SELECT id, file_uri as fileUri FROM recipe_pdf_attachments WHERE recipe_id = ?;',
    [recipeId]
  )
  const attachments = result.rows._array as { id: string; fileUri: string }[]
  for (const attachment of attachments) {
    if (attachment.fileUri && FileSystem.documentDirectory && !attachment.fileUri.startsWith('http')) {
      try {
        await FileSystem.deleteAsync(attachment.fileUri, { idempotent: true })
      } catch {
        // ignore delete errors for stale files
      }
    }
  }
  await runSqlAsync('DELETE FROM recipe_pdf_attachments WHERE recipe_id = ?;', [recipeId])
}
