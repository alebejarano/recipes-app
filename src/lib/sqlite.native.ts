import * as SQLite from 'expo-sqlite'

const DB_NAME = 'recipes.db'

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null
let operationQueue: Promise<void> = Promise.resolve()

async function getDatabaseAsync() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (database) => {
      await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;')
      return database
    })
  }
  return dbPromise
}

function enqueueDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = operationQueue.then(operation, operation)
  operationQueue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

export async function runSqlAsync(
  sql: string,
  params: (string | number | null)[] = []
): Promise<SQLite.SQLiteRunResult> {
  return enqueueDatabaseOperation(async () => {
    const database = await getDatabaseAsync()
    return database.runAsync(sql, params)
  })
}

export async function runSqlBatchAsync(statements: { sql: string; params?: (string | number | null)[] }[]) {
  await enqueueDatabaseOperation(async () => {
    const database = await getDatabaseAsync()
    await database.withExclusiveTransactionAsync(async (txn) => {
      for (const statement of statements) {
        await txn.runAsync(statement.sql, statement.params ?? [])
      }
    })
  })
}

export async function getAllAsync<T>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T[]> {
  return enqueueDatabaseOperation(async () => {
    const database = await getDatabaseAsync()
    return database.getAllAsync<T>(sql, params)
  })
}

export async function getFirstAsync<T>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T | null> {
  return enqueueDatabaseOperation(async () => {
    const database = await getDatabaseAsync()
    return database.getFirstAsync<T>(sql, params)
  })
}
