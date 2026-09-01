const TTL_MS = 5 * 60 * 1000

const locks = new Map<string, number>()

const held = (userId: string) => {
  const expiresAt = locks.get(userId)

  if (expiresAt === undefined) {
    return false
  }

  if (expiresAt <= Date.now()) {
    locks.delete(userId)

    return false
  }

  return true
}

export const acquireSyncLock = (userId: string) => {
  if (held(userId)) {
    return false
  }

  locks.set(userId, Date.now() + TTL_MS)

  return true
}

export const renewSyncLock = (userId: string) => {
  if (held(userId)) {
    locks.set(userId, Date.now() + TTL_MS)
  }
}

export const releaseSyncLock = (userId: string) => {
  locks.delete(userId)
}
