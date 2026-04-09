import { execFile } from 'node:child_process'
import { access, rename, stat } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

import type { LockedItem, LockStatus } from '../src/lib/types'
import { buildLockedName, deriveLockStatus } from '../src/lib/utils'
import { inferTargetTypeFromStats, type JournalEntry } from './models'

const execFileAsync = promisify(execFile)

function nowIso() {
  return new Date().toISOString()
}

async function exists(targetPath: string) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function setWindowsHidden(targetPath: string, hidden: boolean) {
  if (process.platform !== 'win32') {
    return
  }

  const args = hidden ? ['+H', '+S', targetPath] : ['-H', '-S', targetPath]
  await execFileAsync('attrib', args)
}

export function validateLockablePath(targetPath: string, appDataPath: string) {
  if (!targetPath) {
    throw new Error('Pick a file or folder first.')
  }

  const normalizedTarget = path.resolve(targetPath)
  const normalizedAppData = path.resolve(appDataPath)

  if (normalizedTarget === path.parse(normalizedTarget).root) {
    throw new Error('Root drives cannot be locked in this version.')
  }

  if (normalizedTarget.startsWith(normalizedAppData)) {
    throw new Error('Note cannot lock its own internal data directory.')
  }

  if (path.basename(normalizedTarget).startsWith('.__note_locked__')) {
    throw new Error('This path already looks like a managed Note lock target.')
  }
}

export async function createLockRecord(originalPath: string): Promise<LockedItem> {
  const fileStats = await stat(originalPath)
  const id = crypto.randomUUID()
  const parentPath = path.dirname(originalPath)
  const originalName = path.basename(originalPath)
  const lockedPath = path.join(parentPath, buildLockedName(id, originalName))

  if (await exists(lockedPath)) {
    throw new Error('A Note-managed lock target already exists beside this path.')
  }

  return {
    id,
    targetType: inferTargetTypeFromStats(fileStats.isDirectory()),
    originalPath,
    lockedPath,
    originalName,
    parentPath,
    status: 'locked',
    updatedAt: nowIso(),
  }
}

export async function lockTarget(record: LockedItem, journal: JournalEntry[]) {
  journal.push({
    id: crypto.randomUUID(),
    lockId: record.id,
    phase: 'prepare',
    createdAt: nowIso(),
    payload: {
      from: record.originalPath,
      to: record.lockedPath,
    },
  })

  await rename(record.originalPath, record.lockedPath)

  try {
    journal.push({
      id: crypto.randomUUID(),
      lockId: record.id,
      phase: 'renamed',
      createdAt: nowIso(),
      payload: {
        to: record.lockedPath,
      },
    })

    await setWindowsHidden(record.lockedPath, true)

    journal.push({
      id: crypto.randomUUID(),
      lockId: record.id,
      phase: 'hidden-applied',
      createdAt: nowIso(),
      payload: {
        to: record.lockedPath,
      },
    })
  } catch (error) {
    try {
      await rename(record.lockedPath, record.originalPath)
    } catch {
      journal.push({
        id: crypto.randomUUID(),
        lockId: record.id,
        phase: 'failed',
        createdAt: nowIso(),
        payload: {
          stage: 'rollback',
          lockedPath: record.lockedPath,
        },
      })
    }

    throw error
  }

  return {
    ...record,
    status: 'locked' as LockStatus,
    updatedAt: nowIso(),
    lastError: undefined,
  }
}

export async function unlockTarget(record: LockedItem, journal: JournalEntry[]) {
  if (await exists(record.originalPath)) {
    throw new Error('The original path is already occupied. Clear it before unlocking.')
  }

  await setWindowsHidden(record.lockedPath, false)
  await rename(record.lockedPath, record.originalPath)

  journal.push({
    id: crypto.randomUUID(),
    lockId: record.id,
    phase: 'restored',
    createdAt: nowIso(),
    payload: {
      restoredTo: record.originalPath,
    },
  })
}

export async function reconcileRecord(record: LockedItem) {
  const originalExists = await exists(record.originalPath)
  const lockedExists = await exists(record.lockedPath)
  const status = deriveLockStatus({ originalExists, lockedExists, lastError: record.lastError })

  return {
    keep: lockedExists || (!lockedExists && !originalExists),
    record: {
      ...record,
      status,
      updatedAt: nowIso(),
    },
  }
}
