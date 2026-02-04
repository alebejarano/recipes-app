import * as SQLite from 'expo-sqlite'

const DB_NAME = 'recipes.db'

let db: SQLite.SQLiteDatabase | null = null

function getDatabase() {
  if (!db) {
    db = SQLite.openDatabase(DB_NAME)
  }
  return db
}

export function runSqlAsync(
  sql: string,
  params: (string | number | null)[] = []
): Promise<SQLite.SQLResultSet> {
  const database = getDatabase()
  return new Promise((resolve, reject) => {
    database.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_tx, result) => resolve(result),
        (_tx, error) => {
          reject(error)
          return true
        }
      )
    })
  })
}

export function runSqlBatchAsync(statements: { sql: string; params?: (string | number | null)[] }[]) {
  const database = getDatabase()
  return new Promise<void>((resolve, reject) => {
    database.transaction((tx) => {
      for (const statement of statements) {
        tx.executeSql(statement.sql, statement.params ?? [])
      }
    }, reject, resolve)
  })
}
