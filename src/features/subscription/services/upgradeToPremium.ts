import AsyncStorage from '@react-native-async-storage/async-storage'

import { supabase } from '@/lib/supabase'
import { triggerFolderSync } from '@/features/folders/sync/folderSync'
import { triggerNoteSync } from '@/features/notes/sync/noteSync'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { tagLocalDataAsMigratable } from '@/features/storage/localAccountLinking'
import { markLocalFolderSynced } from '@/features/folders/storage/localFoldersStorage'
import { markLocalNoteSynced } from '@/features/notes/storage/localNotesStorage'
import { markLocalRecipeSynced } from '@/features/recipes/storage/localRecipesStorage'
import type { BillingCycle, Plan, UpgradeStatus } from '@/features/subscription/context/SubscriptionContext'
import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync, runSqlAsync } from '@/lib/sqlite'

type UpgradeToPremiumArgs = {
  userId: string
  billingCycle: BillingCycle
  setPlan: (nextPlan: Plan, options?: { billingCycle?: BillingCycle }) => Promise<void>
  setUpgradeStatus: (nextStatus: UpgradeStatus) => Promise<void>
}

export const PREMIUM_UPGRADE_MIGRATION_KEY_PREFIX = 'premium:upgrade-migration:completed:'
let premiumUpgradeInFlight: Promise<void> | null = null

type PremiumUpgradeSyncPayload = {
  billingCycle: BillingCycle
  idempotencyKey: string
  clientTimestamp: string
  entities: {
    recipes: RecipeUpgradeSnapshotRow[]
    notes: NoteUpgradeSnapshotRow[]
    folders: FolderUpgradeSnapshotRow[]
  }
}

type RecipeLocalRow = {
  id: string
  cloud_id: string | null
  version: number | null
  updated_at: string
  deleted_at: string | null
  title: string
  subtitle: string | null
  description: string | null
  emoji: string | null
  image_url: string | null
  steps_text: string | null
  ingredients_json: string
  folders_json: string
  meal_times_json: string
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  servings: number | null
}

type NoteLocalRow = {
  id: string
  cloud_id: string | null
  version: number | null
  updated_at: string
  deleted_at: string | null
  title: string | null
  content: string | null
  pinned_at: string | null
}

type FolderLocalRow = {
  id: string
  cloud_id: string | null
  version: number | null
  updated_at: string
  deleted_at: string | null
  name: string
  emoji: string | null
}

type RecipeUpgradeSnapshotRow = {
  localId: string
  cloudId: string | null
  version: number
  updatedAt: string
  deletedAt: string | null
  data: {
    title: string
    subtitle: string | null
    description: string | null
    emoji: string | null
    imageUrl: string | null
    stepsText: string | null
    ingredientsJson: string
    foldersJson: string
    mealTimesJson: string
    prepTimeMinutes: number | null
    cookTimeMinutes: number | null
    servings: number | null
  }
}

type NoteUpgradeSnapshotRow = {
  localId: string
  cloudId: string | null
  version: number
  updatedAt: string
  deletedAt: string | null
  data: {
    title: string | null
    content: string | null
    pinnedAt: string | null
  }
}

type FolderUpgradeSnapshotRow = {
  localId: string
  cloudId: string | null
  version: number
  updatedAt: string
  deletedAt: string | null
  data: {
    name: string
    emoji: string | null
  }
}

type CanonicalEntityRow = {
  id?: string
  clientId?: string | null
  client_id?: string | null
}

type UpgradeInvokeResponse = {
  canonical?: {
    recipes?: CanonicalEntityRow[]
    notes?: CanonicalEntityRow[]
    folders?: CanonicalEntityRow[]
  }
}

type DuplicateCloudRow = {
  cloud_id: string
}

type DuplicateLocalRow = {
  id: string
}

function dedupeFoldersByNormalizedName(rows: FolderUpgradeSnapshotRow[]): FolderUpgradeSnapshotRow[] {
  const byName = new Map<string, FolderUpgradeSnapshotRow>()

  for (const row of rows) {
    const normalizedName = row.data.name.trim().toLowerCase()
    if (!normalizedName) continue

    const existing = byName.get(normalizedName)
    if (!existing) {
      byName.set(normalizedName, row)
      continue
    }

    const existingVersion = existing.version ?? 1
    const nextVersion = row.version ?? 1
    if (nextVersion > existingVersion) {
      byName.set(normalizedName, row)
      continue
    }
    if (nextVersion < existingVersion) {
      continue
    }

    const existingTime = Date.parse(existing.updatedAt)
    const nextTime = Date.parse(row.updatedAt)
    if (Number.isFinite(nextTime) && (!Number.isFinite(existingTime) || nextTime > existingTime)) {
      byName.set(normalizedName, row)
    }
  }

  return [...byName.values()]
}

function createIdempotencyKey() {
  const randomUuid = globalThis.crypto?.randomUUID?.()
  if (randomUuid) return randomUuid
  return `upgrade_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function isFunctionMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const message = String((error as { message?: unknown }).message ?? '').toLowerCase()
  return (
    message.includes('function not found') ||
    message.includes('does not exist') ||
    message.includes('404')
  )
}

async function extractInvokeErrorDetails(error: unknown): Promise<string> {
  if (!error || typeof error !== 'object') return ''
  const context = (error as { context?: { text?: () => Promise<string> } }).context
  if (!context?.text) return ''
  try {
    const raw = await context.text()
    if (!raw) return ''
    try {
      const parsed = JSON.parse(raw) as { error?: unknown; message?: unknown }
      const fromError = typeof parsed.error === 'string' ? parsed.error : ''
      const fromMessage = typeof parsed.message === 'string' ? parsed.message : ''
      return fromError || fromMessage || raw
    } catch {
      return raw
    }
  } catch {
    return ''
  }
}

function isBackendRolloutMismatch(error: unknown, details: string): boolean {
  const baseMessage =
    String((error as { message?: unknown })?.message ?? '').toLowerCase()
  const combined = `${baseMessage} ${details.toLowerCase()}`

  return (
    combined.includes('premium_upgrade_merge') ||
    combined.includes('function public.premium_upgrade_merge') ||
    combined.includes('premium_upgrade_requests') ||
    combined.includes('user_entitlements') ||
    combined.includes('client_version') ||
    combined.includes('client_updated_at') ||
    combined.includes('column') && combined.includes('does not exist') ||
    combined.includes('relation') && combined.includes('does not exist')
  )
}

async function buildSnapshotEntities(ownerUserId: string) {
  await ensureLocalSqliteMigrationReady()
  const owner = ownerUserId.trim()
  if (!owner) return { recipes: [], notes: [], folders: [] }
  const [recipeRows, noteRows, folderRows] = await Promise.all([
    getAllAsync<RecipeLocalRow>('SELECT * FROM local_recipes WHERE owner_user_id = ? ORDER BY updated_at ASC;', [owner]),
    getAllAsync<NoteLocalRow>('SELECT * FROM local_notes WHERE owner_user_id = ? ORDER BY updated_at ASC;', [owner]),
    getAllAsync<FolderLocalRow>('SELECT * FROM local_folders WHERE owner_user_id = ? ORDER BY updated_at ASC;', [owner]),
  ])

  const recipes: RecipeUpgradeSnapshotRow[] = recipeRows.map((row) => ({
    localId: row.id,
    cloudId: row.cloud_id ?? null,
    version: row.version ?? 1,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
    data: {
      title: row.title,
      subtitle: row.subtitle ?? null,
      description: row.description ?? null,
      emoji: row.emoji ?? null,
      imageUrl: row.image_url ?? null,
      stepsText: row.steps_text ?? null,
      ingredientsJson: row.ingredients_json,
      foldersJson: row.folders_json,
      mealTimesJson: row.meal_times_json,
      prepTimeMinutes: row.prep_time_minutes ?? null,
      cookTimeMinutes: row.cook_time_minutes ?? null,
      servings: row.servings ?? null,
    },
  }))

  const notes: NoteUpgradeSnapshotRow[] = noteRows.map((row) => ({
    localId: row.id,
    cloudId: row.cloud_id ?? null,
    version: row.version ?? 1,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
    data: {
      title: row.title ?? null,
      content: row.content ?? null,
      pinnedAt: row.pinned_at ?? null,
    },
  }))

  const folders: FolderUpgradeSnapshotRow[] = folderRows.map((row) => ({
    localId: row.id,
    cloudId: row.cloud_id ?? null,
    version: row.version ?? 1,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
    data: {
      name: row.name,
      emoji: row.emoji ?? null,
    },
  }))

  return {
    recipes,
    notes,
    folders: dedupeFoldersByNormalizedName(folders),
  }
}

function readCanonicalClientId(item: CanonicalEntityRow) {
  return item.clientId ?? item.client_id ?? null
}

async function dedupeLocalRowsByCloudId(params: {
  table: 'local_recipes' | 'local_notes' | 'local_folders'
  ownerUserId: string
  preferredByCloudId: Map<string, string>
}) {
  const duplicates = await getAllAsync<DuplicateCloudRow>(
    `SELECT cloud_id
      FROM ${params.table}
      WHERE owner_user_id = ?
        AND cloud_id IS NOT NULL
      GROUP BY cloud_id
      HAVING COUNT(*) > 1;`,
    [params.ownerUserId]
  )

  for (const duplicate of duplicates) {
    const cloudId = duplicate.cloud_id
    if (!cloudId) continue

    const rows = await getAllAsync<DuplicateLocalRow>(
      `SELECT id
        FROM ${params.table}
        WHERE owner_user_id = ?
          AND cloud_id = ?;`,
      [params.ownerUserId, cloudId]
    )
    if (rows.length <= 1) continue

    const preferred = params.preferredByCloudId.get(cloudId) ?? null
    const keeper =
      (preferred ? rows.find((row) => row.id === preferred)?.id : null) ??
      rows.find((row) => !row.id.startsWith('cloud_'))?.id ??
      rows[0]?.id

    for (const row of rows) {
      if (row.id === keeper) continue
      await runSqlAsync(`DELETE FROM ${params.table} WHERE id = ?;`, [row.id])
    }
  }
}

async function reconcileUpgradeCanonicalMappings(params: {
  userId: string
  responseData: UpgradeInvokeResponse | null
}) {
  const canonical = params.responseData?.canonical
  if (!canonical) return

  const preferredRecipeByCloudId = new Map<string, string>()
  const preferredNoteByCloudId = new Map<string, string>()
  const preferredFolderByCloudId = new Map<string, string>()

  for (const item of canonical.recipes ?? []) {
    const cloudId = typeof item.id === 'string' ? item.id : ''
    const localId = readCanonicalClientId(item)
    if (!cloudId || !localId) continue
    await markLocalRecipeSynced({
      localId,
      ownerUserId: params.userId,
      cloudId,
    })
    preferredRecipeByCloudId.set(cloudId, localId)
  }

  for (const item of canonical.notes ?? []) {
    const cloudId = typeof item.id === 'string' ? item.id : ''
    const localId = readCanonicalClientId(item)
    if (!cloudId || !localId) continue
    await markLocalNoteSynced({
      localId,
      ownerUserId: params.userId,
      cloudId,
    })
    preferredNoteByCloudId.set(cloudId, localId)
  }

  for (const item of canonical.folders ?? []) {
    const cloudId = typeof item.id === 'string' ? item.id : ''
    const localId = readCanonicalClientId(item)
    if (!cloudId || !localId) continue
    await markLocalFolderSynced({
      localId,
      ownerUserId: params.userId,
      cloudId,
    })
    preferredFolderByCloudId.set(cloudId, localId)
  }

  await dedupeLocalRowsByCloudId({
    table: 'local_recipes',
    ownerUserId: params.userId,
    preferredByCloudId: preferredRecipeByCloudId,
  })
  await dedupeLocalRowsByCloudId({
    table: 'local_notes',
    ownerUserId: params.userId,
    preferredByCloudId: preferredNoteByCloudId,
  })
  await dedupeLocalRowsByCloudId({
    table: 'local_folders',
    ownerUserId: params.userId,
    preferredByCloudId: preferredFolderByCloudId,
  })
}

export async function hasCompletedPremiumUpgradeMigration(userId: string): Promise<boolean> {
  const normalizedUserId = userId.trim()
  if (!normalizedUserId) return false
  return (await AsyncStorage.getItem(`${PREMIUM_UPGRADE_MIGRATION_KEY_PREFIX}${normalizedUserId}`)) === '1'
}

export async function upgradeToPremium(args: UpgradeToPremiumArgs): Promise<void> {
  if (premiumUpgradeInFlight) return premiumUpgradeInFlight

  const operation = runPremiumUpgrade(args)
  premiumUpgradeInFlight = operation
  try {
    await operation
  } finally {
    premiumUpgradeInFlight = null
  }
}

async function runPremiumUpgrade(args: UpgradeToPremiumArgs): Promise<void> {
  const userId = args.userId.trim()
  if (!userId) throw new Error('Missing user id for premium upgrade')

  await args.setUpgradeStatus('running')

  // Premium is the explicit opt-in to back up this device's existing local
  // kitchen. Claim only unowned legacy rows; other accounts' rows stay scoped.
  await tagLocalDataAsMigratable(userId)
  const entities = await buildSnapshotEntities(userId)
  const payload: PremiumUpgradeSyncPayload = {
    billingCycle: args.billingCycle,
    idempotencyKey: createIdempotencyKey(),
    clientTimestamp: new Date().toISOString(),
    entities,
  }

  try {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
    if (refreshError) {
      throw new Error('Your session expired. Please sign in again.')
    }

    const accessToken =
      refreshed.session?.access_token ??
      (await supabase.auth.getSession()).data.session?.access_token ??
      null
    if (!accessToken) {
      throw new Error('Your session expired. Please sign in again.')
    }

    const { data, error } = await supabase.functions.invoke('premium-upgrade-sync', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: payload,
    })

    if (error) {
      const details = await extractInvokeErrorDetails(error)
      if (isFunctionMissingError(error) || isBackendRolloutMismatch(error, details)) {
        // Do not fall back to one-by-one creates here. That path cannot atomically
        // attach each local record to its cloud record, so retrying it can duplicate
        // a user's recipes or folders. A later retry of the idempotent function is safe.
        throw new Error(
          'Your subscription is active, but your kitchen could not be backed up yet. Please try again in a moment.'
        )
      }
      const normalizedMessage =
        details ||
        String((error as { message?: unknown })?.message ?? '') ||
        'Premium upgrade sync failed'
      throw new Error(normalizedMessage)
    } else {
      await reconcileUpgradeCanonicalMappings({
        userId,
        responseData: (data ?? null) as UpgradeInvokeResponse | null,
      })
    }

    await args.setPlan('premium', { billingCycle: args.billingCycle })
    await Promise.all([
      triggerRecipeSync(),
      triggerNoteSync(),
      triggerFolderSync(),
    ])
    await AsyncStorage.setItem(`${PREMIUM_UPGRADE_MIGRATION_KEY_PREFIX}${userId}`, '1')
    await args.setUpgradeStatus('idle')
  } catch (error) {
    await args.setUpgradeStatus('failed')
    throw error
  }
}
