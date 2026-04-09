import { useCallback, useEffect, useRef, useState } from 'react'
import { getBridge } from '../lib/api'
import type { BootstrapData, LockedItemType, MutationResult } from '../lib/types'

interface StatusMessage {
  tone: 'success' | 'error' | 'info'
  message: string
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while talking to the desktop bridge.'
}

export function useNoteApp() {
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusMessage | null>(null)
  const didLoadRef = useRef(false)

  const runMutation = useCallback(
    async (
      actionName: string,
      mutation: () => Promise<MutationResult>,
      fallbackMessage: string,
      successTone: StatusMessage['tone'] = 'success',
    ) => {
      setPendingAction(actionName)

      try {
        const result = await mutation()
        setBootstrap(result.bootstrap)

        if (result.message || fallbackMessage) {
          setStatus({
            tone: successTone,
            message: result.message ?? fallbackMessage,
          })
        }

        return result
      } catch (error) {
        setStatus({ tone: 'error', message: getErrorMessage(error) })
        return null
      } finally {
        setPendingAction(null)
      }
    },
    [],
  )

  const reloadBootstrap = useCallback(async () => {
    setIsLoading(true)

    try {
      const nextBootstrap = await getBridge().bootstrap()
      setBootstrap(nextBootstrap)
      setStatus(null)
    } catch (error) {
      setStatus({ tone: 'error', message: getErrorMessage(error) })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (didLoadRef.current) {
      return
    }

    didLoadRef.current = true
    void reloadBootstrap()
  }, [reloadBootstrap])

  return {
    bootstrap,
    isLoading,
    pendingAction,
    status,
    dismissStatus: () => setStatus(null),
    reloadBootstrap,
    setMasterPassword: async (password: string) =>
      runMutation(
        'setMasterPassword',
        () => getBridge().setMasterPassword(password),
        'Password saved.',
      ),
    unlockProtectedNote: async (password: string) =>
      runMutation(
        'unlockProtectedNote',
        () => getBridge().unlockProtectedNote(password),
        'Protected note unlocked.',
      ),
    lockProtectedSession: async () =>
      runMutation(
        'lockProtectedSession',
        () => getBridge().lockProtectedSession(),
        'Protected note locked.',
        'info',
      ),
    savePlainNote: async (noteId: string, title: string, body: string) =>
      runMutation(
        `savePlain:${noteId}`,
        () => getBridge().savePlainNote(noteId, title, body),
        'Note saved.',
      ),
    saveProtectedNote: async (title: string, body: string) =>
      runMutation(
        'saveProtected',
        () => getBridge().saveProtectedNote(title, body),
        'Protected note saved.',
      ),
    pickAndLockTarget: async (targetType: LockedItemType) =>
      runMutation(
        `pick:${targetType}`,
        () => getBridge().pickAndLockTarget(targetType),
        targetType === 'file' ? 'File locked.' : 'Folder locked.',
      ),
    unlockTarget: async (lockId: string) =>
      runMutation(`unlock:${lockId}`, () => getBridge().unlockTarget(lockId), 'Target unlocked.'),
    reconcileLockedItems: async () =>
      runMutation(
        'reconcileLockedItems',
        () => getBridge().reconcileLockedItems(),
        'Locked items refreshed.',
        'info',
      ),
    revealLockedItem: async (lockId: string) => {
      setPendingAction(`reveal:${lockId}`)

      try {
        const result = await getBridge().revealLockedItem(lockId)
        setStatus({
          tone: result.ok ? 'info' : 'error',
          message: result.message ?? (result.ok ? 'Opened item location.' : 'Could not reveal item.'),
        })
        return result
      } catch (error) {
        setStatus({ tone: 'error', message: getErrorMessage(error) })
        return null
      } finally {
        setPendingAction(null)
      }
    },
  }
}
