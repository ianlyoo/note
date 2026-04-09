import type { NoteBridge } from './types'

declare global {
  interface Window {
    noteBridge: NoteBridge
  }
}

export function getBridge() {
  if (!window.noteBridge) {
    throw new Error('Note desktop bridge is not available.')
  }

  return window.noteBridge
}
