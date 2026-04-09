import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { BootstrapData, LockedItem, LockedItemType, MutationResult, NoteDocument } from '../src/lib/types'
import { PROTECTED_NOTE_ID, createPreview } from '../src/lib/utils'
import { decryptProtectedBody, encryptProtectedBody, hashPassword, verifyPassword } from './crypto'
import type { StoredNote, StoredState } from './models'
import { StateStore } from './stateStore'
import { createLockRecord, lockTarget, reconcileRecord, unlockTarget as unlockTargetPath, validateLockablePath } from './lockService'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null
let store: StateStore | null = null
let sessionPassword: string | null = null

function requireUnlockedSession() {
  if (!sessionPassword) {
    throw new Error('Unlock the protected note before managing protected items.')
  }

  return sessionPassword
}

function ensureStore() {
  if (!store) {
    throw new Error('Note state store is not ready yet.')
  }

  return store
}

function protectedNoteBody(note: StoredNote) {
  if (!sessionPassword || !note.encryptedBody) {
    return ''
  }

  return decryptProtectedBody(note.encryptedBody, sessionPassword)
}

function toNoteDocument(note: StoredNote): NoteDocument {
  const isProtected = note.id === PROTECTED_NOTE_ID
  const body = isProtected ? protectedNoteBody(note) : note.plainBody
  const locked = isProtected && !sessionPassword

  return {
    id: note.id,
    title: note.title,
    kind: note.kind,
    body,
    preview: locked ? 'Open this note and enter the password to reveal protected items.' : createPreview(body),
    updatedAt: note.updatedAt,
    isLocked: locked,
  }
}

function sortNotes(notes: NoteDocument[]) {
  return [...notes].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

function sortLockedItems(items: LockedItem[]) {
  return [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
}

async function buildBootstrap(): Promise<BootstrapData> {
  const state = await ensureStore().load()
  const sessionUnlocked = Boolean(sessionPassword)

  return {
    hasPassword: Boolean(state.passwordConfig),
    sessionUnlocked,
    protectedNoteId: PROTECTED_NOTE_ID,
    notes: sortNotes(state.notes.map(toNoteDocument)),
    lockedItems: sessionUnlocked ? sortLockedItems(state.lockedItems) : [],
  }
}

async function mutateResult(mutator: (state: StoredState) => Promise<void> | void, message?: string): Promise<MutationResult> {
  await ensureStore().mutate(async (state) => {
    await mutator(state)
  })

  return {
    bootstrap: await buildBootstrap(),
    message,
  }
}

function getProtectedNote(state: StoredState) {
  const note = state.notes.find((entry) => entry.id === PROTECTED_NOTE_ID)

  if (!note) {
    throw new Error('Protected note is missing from state.')
  }

  return note
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1120,
    minHeight: 720,
    backgroundColor: '#101417',
    title: 'Note',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  store = new StateStore(app.getPath('userData'))
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('note:bootstrap', async () => buildBootstrap())

ipcMain.handle('note:set-master-password', async (_event, password: string) => {
  if (password.trim().length < 6) {
    throw new Error('Use a password with at least 6 characters.')
  }

  const result = await mutateResult((state) => {
    if (state.passwordConfig) {
      throw new Error('A password has already been created for this Note profile.')
    }

    state.passwordConfig = hashPassword(password)

    const protectedNote = getProtectedNote(state)
    protectedNote.encryptedBody = encryptProtectedBody(protectedNote.plainBody, password)
    protectedNote.plainBody = ''
    protectedNote.updatedAt = new Date().toISOString()
  }, 'Protected note is now configured.')

  sessionPassword = password
  return {
    ...result,
    bootstrap: await buildBootstrap(),
  }
})

ipcMain.handle('note:unlock-protected', async (_event, password: string) => {
  const state = await ensureStore().load()

  if (!state.passwordConfig) {
    throw new Error('Create a password first.')
  }

  if (!verifyPassword(password, state.passwordConfig)) {
    throw new Error('The password did not match this Note profile.')
  }

  sessionPassword = password

  return {
    bootstrap: await buildBootstrap(),
    message: 'Protected note unlocked.',
  }
})

ipcMain.handle('note:lock-session', async () => {
  sessionPassword = null
  return {
    bootstrap: await buildBootstrap(),
    message: 'Protected note locked.',
  }
})

ipcMain.handle('note:save-plain-note', async (_event, noteId: string, title: string, body: string) => {
  return mutateResult((state) => {
    const note = state.notes.find((entry) => entry.id === noteId && entry.kind === 'plain')

    if (!note) {
      throw new Error('Plain note not found.')
    }

    note.title = title.trim() || 'Untitled'
    note.plainBody = body
    note.updatedAt = new Date().toISOString()
  }, 'Note saved.')
})

ipcMain.handle('note:save-protected-note', async (_event, title: string, body: string) => {
  const activePassword = requireUnlockedSession()

  return mutateResult((state) => {
    const note = getProtectedNote(state)
    note.title = title.trim() || 'Reference'
    note.encryptedBody = encryptProtectedBody(body, activePassword)
    note.updatedAt = new Date().toISOString()
  }, 'Protected note saved.')
})

ipcMain.handle('note:pick-and-lock', async (_event, targetType: LockedItemType) => {
  requireUnlockedSession()

  if (!mainWindow) {
    throw new Error('Main window is not available.')
  }

  const selection = await dialog.showOpenDialog(mainWindow, {
    properties: targetType === 'directory' ? ['openDirectory'] : ['openFile'],
  })

  if (selection.canceled || selection.filePaths.length === 0) {
    return {
      bootstrap: await buildBootstrap(),
      message: 'Nothing was selected.',
    }
  }

  const pickedPath = selection.filePaths[0]
  const pendingRecord = await createLockRecord(pickedPath)

  await mutateResult((state) => {
    validateLockablePath(pickedPath, app.getPath('userData'))

    const alreadyTracked = state.lockedItems.some(
      (item) => item.originalPath === pickedPath || item.lockedPath === pickedPath,
    )

    if (alreadyTracked) {
      throw new Error('That path is already managed by Note.')
    }

    state.lockedItems.unshift({
      ...pendingRecord,
      status: 'error',
      lastError: 'Lock operation did not finish yet.',
      updatedAt: new Date().toISOString(),
    })
  })

  try {
    const lockedRecord = await ensureStore().mutate(async (state) => {
      const item = state.lockedItems.find((entry) => entry.id === pendingRecord.id)

      if (!item) {
        throw new Error('Lock record disappeared before the operation completed.')
      }

      const nextRecord = await lockTarget(pendingRecord, state.journal)
      Object.assign(item, nextRecord)
      item.lastError = undefined

      return nextRecord
    })

    return {
      bootstrap: await buildBootstrap(),
      message: `${lockedRecord.targetType === 'directory' ? 'Folder' : 'File'} locked.`,
    }
  } catch (error) {
    await ensureStore().mutate((state) => {
      const item = state.lockedItems.find((entry) => entry.id === pendingRecord.id)

      if (item) {
        item.status = 'error'
        item.lastError = error instanceof Error ? error.message : 'The lock operation failed.'
        item.updatedAt = new Date().toISOString()
        state.journal.push({
          id: crypto.randomUUID(),
          lockId: item.id,
          phase: 'failed',
          createdAt: new Date().toISOString(),
          payload: {
            stage: 'lock',
            message: item.lastError,
          },
        })
      }
    })

    throw error
  }
})

ipcMain.handle('note:unlock-target', async (_event, lockId: string) => {
  requireUnlockedSession()

  return mutateResult(async (state) => {
    const item = state.lockedItems.find((entry) => entry.id === lockId)

    if (!item) {
      throw new Error('Locked item not found.')
    }

    await unlockTargetPath(item, state.journal)
    state.lockedItems = state.lockedItems.filter((entry) => entry.id !== lockId)
  }, 'Target restored to its original path.')
})

ipcMain.handle('note:reconcile-locks', async () => {
  requireUnlockedSession()

  return mutateResult(async (state) => {
    const nextItems: LockedItem[] = []

    for (const item of state.lockedItems) {
      const reconciled = await reconcileRecord(item)

      if (reconciled.keep) {
        nextItems.push(reconciled.record)
      }
    }

    state.lockedItems = nextItems
  }, 'Lock records refreshed.')
})

ipcMain.handle('note:reveal-locked-item', async (_event, lockId: string) => {
  requireUnlockedSession()

  const state = await ensureStore().load()
  const item = state.lockedItems.find((entry) => entry.id === lockId)

  if (!item) {
    return {
      ok: false,
      message: 'Locked item not found.',
    }
  }

  const targetToReveal = item.status === 'locked' ? item.lockedPath : item.originalPath
  shell.showItemInFolder(targetToReveal)

  return {
    ok: true,
    message: 'Opened the current filesystem location.',
  }
})
