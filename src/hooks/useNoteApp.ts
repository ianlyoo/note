import { useCallback, useEffect, useRef, useState } from 'react'
import { getBridge } from '../lib/api'
import type { BootstrapData, LockedItemType, MutationResult } from '../lib/types'

interface StatusMessage {
  tone: 'error'
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
    ) => {
      setPendingAction(actionName)

      try {
        const result = await mutation()
        setBootstrap(result.bootstrap)

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
      runMutation('setMasterPassword', () => getBridge().setMasterPassword(password)),
    lockProtectedSession: async () =>
      runMutation('lockProtectedSession', () => getBridge().lockProtectedSession()),
    savePlainNote: async (noteId: string, title: string, body: string) =>
      runMutation(`savePlain:${noteId}`, () => getBridge().savePlainNote(noteId, title, body)),
    saveProtectedNote: async (title: string, body: string) =>
      runMutation('saveProtected', () => getBridge().saveProtectedNote(title, body)),
    pickAndLockTarget: async (targetType: LockedItemType) =>
      runMutation(`pick:${targetType}`, () => getBridge().pickAndLockTarget(targetType)),
    unlockTarget: async (lockId: string) =>
      runMutation(`unlock:${lockId}`, () => getBridge().unlockTarget(lockId)),
    reconcileLockedItems: async () =>
      runMutation('reconcileLockedItems', () => getBridge().reconcileLockedItems()),
    revealLockedItem: async (lockId: string) => {
      setPendingAction(`reveal:${lockId}`)

      try {
        const result = await getBridge().revealLockedItem(lockId)

        if (!result.ok) {
          setStatus({
            tone: 'error',
            message: result.message ?? 'Could not reveal item.',
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
  }
}
