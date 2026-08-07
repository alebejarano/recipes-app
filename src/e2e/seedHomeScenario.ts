import { createLocalNote } from '@/features/notes/storage/localNotesStorage'
import { createLocalRecipe } from '@/features/recipes/storage/localRecipesStorage'
import { ensureImportsStorageReady, registerImport } from '@/features/recipes/storage/importsStorage'
import { ensureLocalSqliteMigrationReady } from '@/lib/localSqliteMigration'
import { runSqlAsync } from '@/lib/sqlite'

export type HomeScenario = 'empty' | 'notes' | 'import' | 'one' | 'five' | 'six' | 'nineteen' | 'twenty' | 'activity' | 'meal-fallback'

export async function seedHomeScenario(scenario: HomeScenario) {
  await ensureLocalSqliteMigrationReady()
  await ensureImportsStorageReady()
  await Promise.all([
    runSqlAsync('DELETE FROM local_recipes;'),
    runSqlAsync('DELETE FROM local_notes;'),
    runSqlAsync('DELETE FROM imports;'),
  ])

  if (scenario === 'notes') {
    await createLocalNote({ title: 'Kitchen note', content: 'Buy basil.' })
    return
  }
  if (scenario === 'import') {
    await registerImport({ kind: 'document', fileName: 'Pasta.pdf', fileUri: 'file:///e2e/Pasta.pdf', bytes: 1024 })
    return
  }
  if (scenario === 'activity') {
    await createLocalNote({ title: 'Newest note', content: 'Added last.' })
    await registerImport({ kind: 'document', fileName: 'Older import.pdf', fileUri: 'file:///e2e/older.pdf', bytes: 1024 })
  }

  const count = scenario === 'one' ? 1 : scenario === 'five' ? 5 : scenario === 'six' ? 6 : scenario === 'nineteen' ? 19 : scenario === 'twenty' ? 20 : scenario === 'meal-fallback' ? 2 : scenario === 'activity' ? 1 : 0
  for (let index = 1; index <= count; index += 1) {
    await createLocalRecipe({
      title: scenario === 'meal-fallback' ? `Fallback recipe ${index}` : `Recipe ${index}`,
      subtitle: null,
      description: null,
      emoji: '🍝',
      imageUrl: null,
      prepTimeMinutes: 15,
      cookTimeMinutes: 15,
      servings: 2,
      ingredients: ['Pasta'],
      steps: ['Cook and serve.'],
      folders: null,
      mealTimes: scenario === 'meal-fallback' ? ['breakfast'] : ['dinner'],
    }, { plan: 'premium' })
  }
}
