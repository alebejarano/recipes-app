import * as SQLite from 'expo-sqlite'

const DB_NAME = 'recipes.db'

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null

async function getDatabaseAsync() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME)
  }
  return dbPromise
}

export async function runSqlAsync(
  sql: string,
  params: (string | number | null)[] = []
): Promise<SQLite.SQLiteRunResult> {
  const database = await getDatabaseAsync()
  return database.runAsync(sql, params)
}

export async function runSqlBatchAsync(statements: { sql: string; params?: (string | number | null)[] }[]) {
  const database = await getDatabaseAsync()
  await database.withExclusiveTransactionAsync(async (txn) => {
    for (const statement of statements) {
      await txn.runAsync(statement.sql, statement.params ?? [])
    }
  })
}

export async function getAllAsync<T>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T[]> {
  const database = await getDatabaseAsync()
  return database.getAllAsync<T>(sql, params)
}

export async function getFirstAsync<T>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T | null> {
  const database = await getDatabaseAsync()
  return database.getFirstAsync<T>(sql, params)
}
