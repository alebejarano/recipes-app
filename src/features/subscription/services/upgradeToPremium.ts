import { supabase } from '@/lib/supabase'
import { triggerFolderSync } from '@/features/folders/sync/folderSync'
import { triggerNoteSync } from '@/features/notes/sync/noteSync'
import { triggerRecipeSync } from '@/features/recipes/sync/recipeSync'
import { migrateLocalDataToCloudOnPremium } from '@/features/sync/premiumMigration'
import type { BillingCycle, Plan, UpgradeStatus } from '@/features/subscription/context/SubscriptionContext'
import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getAllAsync } from '@/lib/sqlite'

type UpgradeToPremiumArgs = {
  userId: string
  billingCycle: BillingCycle
  setPlan: (nextPlan: Plan, options?: { billingCycle?: BillingCycle }) => Promise<void>
  setUpgradeStatus: (nextStatus: UpgradeStatus) => Promise<void>
}

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

async function buildSnapshotEntities() {
  await ensureLocalSqliteMigrationReady()
  const [recipeRows, noteRows, folderRows] = await Promise.all([
    getAllAsync<RecipeLocalRow>('SELECT * FROM local_recipes ORDER BY updated_at ASC;'),
    getAllAsync<NoteLocalRow>('SELECT * FROM local_notes ORDER BY updated_at ASC;'),
    getAllAsync<FolderLocalRow>('SELECT * FROM local_folders ORDER BY updated_at ASC;'),
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
    folders,
  }
}

export async function upgradeToPremium(args: UpgradeToPremiumArgs): Promise<void> {
  const userId = args.userId.trim()
  if (!userId) throw new Error('Missing user id for premium upgrade')

  await args.setUpgradeStatus('running')

  const entities = await buildSnapshotEntities()
  const payload: PremiumUpgradeSyncPayload = {
    billingCycle: args.billingCycle,
    idempotencyKey: createIdempotencyKey(),
    clientTimestamp: new Date().toISOString(),
    entities,
  }

  try {
    const { error } = await supabase.functions.invoke('premium-upgrade-sync', {
      body: payload,
    })

    if (error) {
      // Temporary fallback while premium-upgrade-sync is being introduced.
      if (!isFunctionMissingError(error)) throw error
      await migrateLocalDataToCloudOnPremium(userId)
    }

    await args.setPlan('premium', { billingCycle: args.billingCycle })
    await Promise.all([
      triggerRecipeSync(),
      triggerNoteSync(),
      triggerFolderSync(),
    ])
    await args.setUpgradeStatus('idle')
  } catch (error) {
    await args.setUpgradeStatus('failed')
    throw error
  }
}
