import { useMemo, useState } from 'react'
import { NoteSidebar } from './components/NoteSidebar'
import { PlainNoteEditor } from './components/PlainNoteEditor'
import { ProtectedNoteGate } from './components/ProtectedNoteGate'
import { ProtectedNoteWorkspace } from './components/ProtectedNoteWorkspace'
import { StatusBanner } from './components/StatusBanner'
import { useNoteApp } from './hooks/useNoteApp'

function App() {
  const {
    bootstrap,
    isLoading,
    pendingAction,
    status,
    dismissStatus,
    reloadBootstrap,
    setMasterPassword,
    lockProtectedSession,
    savePlainNote,
    saveProtectedNote,
    pickAndLockTarget,
    unlockTarget,
    reconcileLockedItems,
    revealLockedItem,
  } = useNoteApp()
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  const resolvedSelectedNoteId = useMemo(() => {
    if (!bootstrap) {
      return null
    }

    if (selectedNoteId && bootstrap.notes.some((note) => note.id === selectedNoteId)) {
      return selectedNoteId
    }

    return bootstrap.notes[0]?.id ?? bootstrap.protectedNoteId ?? null
  }, [bootstrap, selectedNoteId])

  const selectedNote = useMemo(() => {
    if (!bootstrap || !resolvedSelectedNoteId) {
      return null
    }

    return bootstrap.notes.find((note) => note.id === resolvedSelectedNoteId) ?? null
  }, [bootstrap, resolvedSelectedNoteId])

  if (!bootstrap && isLoading) {
    return (
      <div className="app-shell app-shell--state">
        <section className="state-panel" aria-live="polite">
          <p className="state-panel__eyebrow">Note</p>
          <h1 className="state-panel__title">Loading your workspace</h1>
          <p className="state-panel__body">Opening your notes and restoring the last workspace state.</p>
        </section>
      </div>
    )
  }

  if (!bootstrap) {
    return (
      <div className="app-shell app-shell--state">
        <section className="state-panel" aria-live="polite">
          <p className="state-panel__eyebrow">Note</p>
          <h1 className="state-panel__title">The workspace could not be loaded</h1>
          <p className="state-panel__body">
            {status?.message ?? 'The desktop bridge did not return note data.'}
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              void reloadBootstrap()
            }}
            disabled={isLoading}
          >
            Try again
          </button>
        </section>
      </div>
    )
  }

  if (!bootstrap.hasPassword) {
    return (
      <div className="app-shell app-shell--state app-shell--setup">
        {status ? (
          <StatusBanner tone={status.tone} message={status.message} onDismiss={dismissStatus} />
        ) : null}

        <ProtectedNoteGate
          isBusy={pendingAction === 'setMasterPassword'}
          onSetPassword={async (password) => {
            await setMasterPassword(password)
          }}
        />
      </div>
    )
  }

  const isProtectedWorkspaceOpen = Boolean(
    selectedNote && selectedNote.kind === 'protected' && !selectedNote.isLocked && bootstrap.sessionUnlocked,
  )

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div>
          <p className="app-topbar__eyebrow">Personal notes</p>
          <h1 className="app-topbar__title">Note</h1>
        </div>
        <p className="app-topbar__meta">
          {bootstrap.notes.length} {bootstrap.notes.length === 1 ? 'note' : 'notes'}
        </p>
      </header>

      <main className="app-main">
        <aside className="sidebar" aria-label="Notes list">
          <NoteSidebar
            notes={bootstrap.notes}
            selectedNoteId={resolvedSelectedNoteId}
            onSelect={setSelectedNoteId}
          />
        </aside>

        <section className="workspace">
          {status ? (
            <StatusBanner tone={status.tone} message={status.message} onDismiss={dismissStatus} />
          ) : null}

          {!selectedNote ? (
            <section className="workspace-card workspace-card--empty">
              <h2 className="workspace-card__title">Select a note</h2>
              <p className="workspace-card__body">
                Pick a note from the list to start writing.
              </p>
            </section>
          ) : isProtectedWorkspaceOpen ? (
            <ProtectedNoteWorkspace
              key={selectedNote.id}
              note={selectedNote}
              lockedItems={bootstrap.lockedItems}
              pendingAction={pendingAction}
              onSave={async (title, body) => {
                await saveProtectedNote(title, body)
              }}
              onLockSession={async () => {
                await lockProtectedSession()
              }}
              onPickAndLock={async (targetType) => {
                await pickAndLockTarget(targetType)
              }}
              onRefreshLockedItems={async () => {
                await reconcileLockedItems()
              }}
              onUnlockTarget={async (lockId) => {
                await unlockTarget(lockId)
              }}
              onRevealTarget={async (lockId) => {
                await revealLockedItem(lockId)
              }}
            />
          ) : (
            <PlainNoteEditor
              key={`${selectedNote.id}:${selectedNote.isLocked ? 'locked' : 'open'}`}
              note={selectedNote}
              isSaving={pendingAction === `savePlain:${selectedNote.id}`}
              onSave={async (noteId, title, body) => {
                await savePlainNote(noteId, title, body)
              }}
            />
          )}
        </section>
      </main>
    </div>
  )
}

export default App
