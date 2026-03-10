type SqlParam = string | number | null

type SqlBatchStatement = {
  sql: string
  params?: SqlParam[]
}

type WebSqlRunResult = {
  changes: number
  lastInsertRowId: number
}

let hasWarned = false

function warnOnce() {
  if (hasWarned) return
  hasWarned = true
  console.warn('SQLite is not enabled on web in this build. Falling back to no-op storage.')
}

export async function runSqlAsync(
  _sql: string,
  _params: SqlParam[] = []
): Promise<WebSqlRunResult> {
  warnOnce()
  return {
    changes: 0,
    lastInsertRowId: 0,
  }
}

export async function runSqlBatchAsync(_statements: SqlBatchStatement[]) {
  warnOnce()
}

export async function getAllAsync<T>(
  _sql: string,
  _params: SqlParam[] = []
): Promise<T[]> {
  warnOnce()
  return []
}

export async function getFirstAsync<T>(
  _sql: string,
  _params: SqlParam[] = []
): Promise<T | null> {
  warnOnce()
  return null
}
