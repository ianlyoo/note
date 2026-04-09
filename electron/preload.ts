import { contextBridge, ipcRenderer } from 'electron'

import type { LockedItemType, NoteBridge } from '../src/lib/types'

const bridge: NoteBridge = {
  bootstrap: () => ipcRenderer.invoke('note:bootstrap'),
  setMasterPassword: (password: string) => ipcRenderer.invoke('note:set-master-password', password),
  unlockProtectedNote: (password: string) => ipcRenderer.invoke('note:unlock-protected', password),
  lockProtectedSession: () => ipcRenderer.invoke('note:lock-session'),
  savePlainNote: (noteId: string, title: string, body: string) =>
    ipcRenderer.invoke('note:save-plain-note', noteId, title, body),
  saveProtectedNote: (title: string, body: string) =>
    ipcRenderer.invoke('note:save-protected-note', title, body),
  pickAndLockTarget: (targetType: LockedItemType) => ipcRenderer.invoke('note:pick-and-lock', targetType),
  unlockTarget: (lockId: string) => ipcRenderer.invoke('note:unlock-target', lockId),
  reconcileLockedItems: () => ipcRenderer.invoke('note:reconcile-locks'),
  revealLockedItem: (lockId: string) => ipcRenderer.invoke('note:reveal-locked-item', lockId),
}

contextBridge.exposeInMainWorld('noteBridge', bridge)
