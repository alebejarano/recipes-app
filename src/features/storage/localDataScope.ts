let activeOwnerUserId: string | null = null

export function setActiveLocalDataOwner(userId: string | null | undefined) {
  const normalized = userId?.trim()
  activeOwnerUserId = normalized || null
}

export function getActiveLocalDataOwner() {
  return activeOwnerUserId
}

export function getLocalDataScopeKey() {
  return activeOwnerUserId ?? 'guest'
}

export function getLocalDataOwnerFilter(column = 'owner_user_id') {
  if (activeOwnerUserId) {
    return {
      sql: `${column} = ?`,
      params: [activeOwnerUserId],
    }
  }

  return {
    sql: `(${column} IS NULL OR ${column} = '')`,
    params: [],
  }
}
