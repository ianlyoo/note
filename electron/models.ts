import type { LockedItem, LockedItemType, NoteKind } from '../src/lib/types'

export interface StoredNote {
  id: string
  title: string
  kind: NoteKind
  body: string
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
  version: 2
  password: string | null
  notes: StoredNote[]
  lockedItems: LockedItem[]
  journal: JournalEntry[]
}

interface LegacyStoredNote {
  id?: unknown
  title?: unknown
  kind?: unknown
  plainBody?: unknown
  updatedAt?: unknown
}

interface LegacyStoredState {
  version?: unknown
  passwordConfig?: unknown
  notes?: unknown
  lockedItems?: unknown
  journal?: unknown
}

function nowIso() {
  return new Date().toISOString()
}

export function createDefaultState(): StoredState {
  const now = nowIso()

  return {
    version: 2,
    password: null,
    notes: [
      {
        id: 'note-daily',
        title: 'Daily',
        kind: 'plain',
        body: 'Things to remember:\n- dinner at 7\n- call mom\n- install game patch later',
        updatedAt: now,
      },
      {
        id: 'note-projects',
        title: 'Projects',
        kind: 'plain',
        body: 'This app keeps ordinary notes on the surface and private lock controls behind one hidden note.',
        updatedAt: now,
      },
      {
        id: 'note-protected',
        title: 'Reference',
        kind: 'protected',
        body: '',
        updatedAt: now,
      },
    ],
    lockedItems: [],
    journal: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeNote(value: unknown): StoredNote | null {
  if (!isRecord(value)) {
    return null
  }

  const note = value as LegacyStoredNote

  if (typeof note.id !== 'string' || typeof note.title !== 'string') {
    return null
  }

  const kind = note.kind === 'protected' ? 'protected' : 'plain'
  const updatedAt = typeof note.updatedAt === 'string' ? note.updatedAt : nowIso()
  const body = typeof note.plainBody === 'string' ? note.plainBody : typeof value.body === 'string' ? value.body : ''

  return {
    id: note.id,
    title: note.title,
    kind,
    body,
    updatedAt,
  }
}

export function normalizeState(raw: unknown): StoredState {
  if (!isRecord(raw)) {
    return createDefaultState()
  }

  const state = raw as LegacyStoredState

  if (state.version === 2) {
    const notes = Array.isArray(state.notes)
      ? state.notes.map(normalizeNote).filter((note): note is StoredNote => note !== null)
      : []

    return {
      version: 2,
      password: typeof raw.password === 'string' ? raw.password : null,
      notes: notes.length > 0 ? notes : createDefaultState().notes,
      lockedItems: Array.isArray(state.lockedItems) ? (state.lockedItems as LockedItem[]) : [],
      journal: Array.isArray(state.journal) ? (state.journal as JournalEntry[]) : [],
    }
  }

  const legacyNotes = Array.isArray(state.notes)
    ? state.notes.map(normalizeNote).filter((note): note is StoredNote => note !== null)
    : []

  const defaultState = createDefaultState()

  return {
    version: 2,
    password: null,
    notes: legacyNotes.length > 0 ? legacyNotes : defaultState.notes,
    lockedItems: Array.isArray(state.lockedItems) ? (state.lockedItems as LockedItem[]) : [],
    journal: Array.isArray(state.journal) ? (state.journal as JournalEntry[]) : [],
  }
}

export function inferTargetTypeFromStats(isDirectory: boolean): LockedItemType {
  return isDirectory ? 'directory' : 'file'
}
