import type { LockedItem, LockedItemType, NoteKind } from '../src/lib/types'

export interface PasswordConfig {
  salt: string
  hash: string
}

export interface EncryptedNoteBody {
  salt: string
  iv: string
  authTag: string
  ciphertext: string
}

export interface StoredNote {
  id: string
  title: string
  kind: NoteKind
  plainBody: string
  encryptedBody: EncryptedNoteBody | null
  updatedAt: string
}

export interface JournalEntry {
  id: string
  lockId: string
  phase: 'prepare' | 'renamed' | 'hidden-applied' | 'restored' | 'failed'
  createdAt: string
  payload: Record<string, string>
}

export interface StoredState {
  version: 1
  passwordConfig: PasswordConfig | null
  notes: StoredNote[]
  lockedItems: LockedItem[]
  journal: JournalEntry[]
}

function nowIso() {
  return new Date().toISOString()
}

export function createDefaultState(): StoredState {
  const now = nowIso()

  return {
    version: 1,
    passwordConfig: null,
    notes: [
      {
        id: 'note-daily',
        title: 'Daily',
        kind: 'plain',
        plainBody: 'Things to remember:\n- dinner at 7\n- call mom\n- install game patch later',
        encryptedBody: null,
        updatedAt: now,
      },
      {
        id: 'note-projects',
        title: 'Projects',
        kind: 'plain',
        plainBody: 'This app keeps ordinary notes on the surface and private lock controls behind one protected note.',
        encryptedBody: null,
        updatedAt: now,
      },
      {
        id: 'note-protected',
        title: 'Reference',
        kind: 'protected',
        plainBody: '',
        encryptedBody: null,
        updatedAt: now,
      },
    ],
    lockedItems: [],
    journal: [],
  }
}

export function inferTargetTypeFromStats(isDirectory: boolean): LockedItemType {
  return isDirectory ? 'directory' : 'file'
}
