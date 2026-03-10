import { Platform } from 'react-native'

type SqlParam = string | number | null

type SqlBatchStatement = {
  sql: string
  params?: SqlParam[]
}

type SqlRunResult = {
  changes: number
  lastInsertRowId: number
}

let dbPromise: Promise<any> | null = null
let hasWarned = false

function warnOnce() {
  if (hasWarned) return
  hasWarned = true
  console.warn('SQLite is not enabled on web in this build. Falling back to no-op storage.')
}

async function getDatabaseAsync() {
  if (Platform.OS === 'web') {
    return null
  }

  if (!dbPromise) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLite = require('expo-sqlite') as typeof import('expo-sqlite')
    dbPromise = SQLite.openDatabaseAsync('recipes.db')
  }

  return dbPromise
}

export async function runSqlAsync(
  sql: string,
  params: SqlParam[] = []
): Promise<SqlRunResult | import('expo-sqlite').SQLiteRunResult> {
  if (Platform.OS === 'web') {
    warnOnce()
    return {
      changes: 0,
      lastInsertRowId: 0,
    }
  }

  const database = await getDatabaseAsync()
  return database.runAsync(sql, params)
}

export async function runSqlBatchAsync(statements: SqlBatchStatement[]) {
  if (Platform.OS === 'web') {
    warnOnce()
    return
  }

  const database = await getDatabaseAsync()
  await database.withExclusiveTransactionAsync(async (txn: any) => {
    for (const statement of statements) {
      await txn.runAsync(statement.sql, statement.params ?? [])
    }
  })
}

export async function getAllAsync<T>(
  sql: string,
  params: SqlParam[] = []
): Promise<T[]> {
  if (Platform.OS === 'web') {
    warnOnce()
    return []
  }

  const database = await getDatabaseAsync()
  return database.getAllAsync<T>(sql, params)
}

export async function getFirstAsync<T>(
  sql: string,
  params: SqlParam[] = []
): Promise<T | null> {
  if (Platform.OS === 'web') {
    warnOnce()
    return null
  }

  const database = await getDatabaseAsync()
  return database.getFirstAsync<T>(sql, params)
}
