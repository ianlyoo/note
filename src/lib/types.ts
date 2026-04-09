export type NoteKind = 'plain' | 'protected'
export type LockedItemType = 'file' | 'directory'
export type LockStatus = 'locked' | 'missing' | 'conflict' | 'error'

export interface NoteDocument {
  id: string
  title: string
  kind: NoteKind
  body: string
  preview: string
  updatedAt: string
  isLocked: boolean
}

export interface LockedItem {
  id: string
  targetType: LockedItemType
  originalPath: string
  lockedPath: string
  originalName: string
  parentPath: string
  status: LockStatus
  updatedAt: string
  lastError?: string
}

export interface BootstrapData {
  hasPassword: boolean
  sessionUnlocked: boolean
  protectedNoteId: string
  notes: NoteDocument[]
  lockedItems: LockedItem[]
}

export interface MutationResult {
  bootstrap: BootstrapData
  message?: string
}

export interface NoteBridge {
  bootstrap: () => Promise<BootstrapData>
  setMasterPassword: (password: string) => Promise<MutationResult>
  unlockProtectedNote: (password: string) => Promise<MutationResult>
  lockProtectedSession: () => Promise<MutationResult>
  savePlainNote: (noteId: string, title: string, body: string) => Promise<MutationResult>
  saveProtectedNote: (title: string, body: string) => Promise<MutationResult>
  pickAndLockTarget: (targetType: LockedItemType) => Promise<MutationResult>
  unlockTarget: (lockId: string) => Promise<MutationResult>
  reconcileLockedItems: () => Promise<MutationResult>
  revealLockedItem: (lockId: string) => Promise<{ ok: boolean; message?: string }>
}
