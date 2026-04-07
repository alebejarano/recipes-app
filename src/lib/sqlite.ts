import { Platform } from 'react-native'
import type { SQLiteDatabase, SQLiteRunResult } from 'expo-sqlite'

type SqlParam = string | number | null

type SqlBatchStatement = {
  sql: string
  params?: SqlParam[]
}

type SqlRunResult = {
  changes: number
  lastInsertRowId: number
}

let dbPromise: Promise<SQLiteDatabase> | null = null
let hasWarned = false

function warnOnce() {
  if (hasWarned) return
  hasWarned = true
  console.warn('SQLite is not enabled on web in this build. Falling back to no-op storage.')
}

async function getDatabaseAsync(): Promise<SQLiteDatabase | null> {
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
): Promise<SqlRunResult | SQLiteRunResult> {
  if (Platform.OS === 'web') {
    warnOnce()
    return {
      changes: 0,
      lastInsertRowId: 0,
    }
  }

  const database = await getDatabaseAsync()
  if (!database) {
    return {
      changes: 0,
      lastInsertRowId: 0,
    }
  }
  return database.runAsync(sql, params)
}

export async function runSqlBatchAsync(statements: SqlBatchStatement[]) {
  if (Platform.OS === 'web') {
    warnOnce()
    return
  }

  const database = await getDatabaseAsync()
  if (!database) return

  await database.withExclusiveTransactionAsync(async (txn) => {
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
  if (!database) return []
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
  if (!database) return null
  return database.getFirstAsync<T>(sql, params)
}
