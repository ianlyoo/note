import type { LockStatus } from './types'

export const PROTECTED_NOTE_ID = 'note-protected'
export const LOCK_PREFIX = '.__note_locked__'

export function buildLockedName(id: string, originalName: string) {
  return `${LOCK_PREFIX}${id.slice(0, 8)}__${originalName}`
}

export function createPreview(body: string) {
  return body.trim().replace(/\s+/g, ' ').slice(0, 96)
}

export function matchesUnlockText(input: string, password: string | null) {
  if (!password) {
    return false
  }

  return input.trim() === password.trim()
}

export function deriveLockStatus(params: {
  originalExists: boolean
  lockedExists: boolean
  lastError?: string
}): LockStatus {
  const { originalExists, lockedExists, lastError } = params

  if (lastError) {
    return 'error'
  }

  if (lockedExists && !originalExists) {
    return 'locked'
  }

  if (lockedExists && originalExists) {
    return 'conflict'
  }

  return 'missing'
}
