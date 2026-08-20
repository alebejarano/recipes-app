import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { getFirstAsync, runSqlAsync } from '@/lib/sqlite'
import { ensureImportsStorageReady } from '@/features/recipes/storage/importsStorage'
import { ensureRecipeDocumentStorageReady } from '@/features/recipes/storage/recipeDocumentStorage'

export async function tagLocalDataAsMigratable(ownerUserId: string) {
  const trimmedUserId = ownerUserId.trim()
  if (!trimmedUserId) return { recipes: 0, notes: 0, folders: 0, documents: 0, imports: 0 }

  await ensureLocalSqliteMigrationReady()
  await Promise.all([ensureRecipeDocumentStorageReady(), ensureImportsStorageReady()])

  const [recipesCountRow, notesCountRow, foldersCountRow, documentsCountRow, importsCountRow] = await Promise.all([
    getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM local_recipes
       WHERE owner_user_id IS NULL OR owner_user_id = '';`
    ),
    getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM local_notes
       WHERE owner_user_id IS NULL OR owner_user_id = '';`
    ),
    getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM local_folders
       WHERE owner_user_id IS NULL OR owner_user_id = '';`
    ),
    getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM recipe_documents
       WHERE owner_user_id IS NULL OR owner_user_id = '';`
    ),
    getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM imports
       WHERE owner_user_id IS NULL OR owner_user_id = '';`
    ),
  ])

  await Promise.all([
    runSqlAsync(
      `UPDATE local_recipes SET owner_user_id = ?
       WHERE owner_user_id IS NULL OR owner_user_id = '';`,
      [trimmedUserId]
    ),
    runSqlAsync(
      `UPDATE local_notes SET owner_user_id = ?
       WHERE owner_user_id IS NULL OR owner_user_id = '';`,
      [trimmedUserId]
    ),
    runSqlAsync(
      `UPDATE local_folders SET owner_user_id = ?
       WHERE owner_user_id IS NULL OR owner_user_id = '';`,
      [trimmedUserId]
    ),
    runSqlAsync(
      `UPDATE recipe_documents SET owner_user_id = ?
       WHERE owner_user_id IS NULL OR owner_user_id = '';`,
      [trimmedUserId]
    ),
    runSqlAsync(
      `UPDATE imports SET owner_user_id = ?
       WHERE owner_user_id IS NULL OR owner_user_id = '';`,
      [trimmedUserId]
    ),
  ])

  return {
    recipes: Number(recipesCountRow?.count ?? 0),
    notes: Number(notesCountRow?.count ?? 0),
    folders: Number(foldersCountRow?.count ?? 0),
    documents: Number(documentsCountRow?.count ?? 0),
    imports: Number(importsCountRow?.count ?? 0),
  }
}
