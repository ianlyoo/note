import { useMemo, useState, type KeyboardEvent } from 'react'
import type { LockedItem, LockedItemType, LockStatus, NoteDocument } from '../lib/types'

interface ProtectedNoteWorkspaceProps {
  note: NoteDocument
  lockedItems: LockedItem[]
  pendingAction: string | null
  onSave: (title: string, body: string) => Promise<void>
  onExit: () => Promise<void>
  onPickAndLock: (targetType: LockedItemType) => Promise<void>
  onRefreshLockedItems: () => Promise<void>
  onUnlockTarget: (lockId: string) => Promise<void>
  onRevealTarget: (lockId: string) => Promise<void>
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Recently updated'
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function getStatusLabel(status: LockStatus) {
  switch (status) {
    case 'locked':
      return 'Stored'
    case 'missing':
      return 'Missing'
    case 'conflict':
      return 'Conflict'
    case 'error':
      return 'Needs care'
  }
}

function getStatusDetail(item: LockedItem) {
  switch (item.status) {
    case 'locked':
      return 'Saved with this note and ready to restore when you need it.'
    case 'missing':
      return 'The original item could not be found. Refresh after checking whether it was moved or removed.'
    case 'conflict':
      return 'A naming conflict needs attention before the original location can be restored cleanly.'
    case 'error':
      return item.lastError || 'This item could not be refreshed yet. Reveal its location for more detail.'
  }
}

export function ProtectedNoteWorkspace({
  note,
  lockedItems,
  pendingAction,
  onSave,
  onExit,
  onPickAndLock,
  onRefreshLockedItems,
  onUnlockTarget,
  onRevealTarget,
}: ProtectedNoteWorkspaceProps) {
  const [title, setTitle] = useState(note.title)

  const isDirty = title !== note.title

  const attentionCount = useMemo(
    () => lockedItems.filter((item) => item.status !== 'locked').length,
    [lockedItems],
  )

  const handleSubmit = async () => {
    if (!isDirty || pendingAction === 'saveProtected') {
      return
    }

    await onSave(title, note.body)
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      await handleSubmit()
    }
  }

  return (
    <form
      className="protected-workspace workspace-card workspace-card--editor workspace-card--canvas"
      onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}
      onKeyDown={handleKeyDown}
    >
      <header className="editor-header editor-header--workspace">
        <div>
          <p className="editor-header__eyebrow">Protected tools</p>
          <h2 className="workspace-card__title">Files and folders</h2>
          <p className="workspace-card__body">
            {lockedItems.length === 0
              ? 'Nothing has been added from this note yet.'
              : attentionCount > 0
                ? `${lockedItems.length} items, ${attentionCount} needing attention.`
                : `${lockedItems.length} items saved and in sync.`}
          </p>
        </div>
        <div className="editor-header__actions">
          <span className={`save-state ${isDirty ? 'save-state--warning' : 'save-state--muted'}`}>
            {isDirty ? 'Edited' : 'Saved'}
          </span>
          <button type="submit" className="btn btn--primary" disabled={!isDirty || pendingAction === 'saveProtected'}>
            {pendingAction === 'saveProtected' ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              void onExit()
            }}
            disabled={pendingAction === 'lockProtectedSession'}
          >
            {pendingAction === 'lockProtectedSession' ? 'Exiting…' : 'Exit'}
          </button>
        </div>
      </header>

      <div className="field-group field-group--title-row">
        <label className="field-label field-label--sr-only" htmlFor="protected-note-title">
          Title
        </label>
        <input
          id="protected-note-title"
          className="text-input text-input--title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
        />
      </div>

      <div className="toolbar-actions toolbar-actions--workspace">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            void onPickAndLock('file')
          }}
          disabled={pendingAction === 'pick:file'}
        >
          {pendingAction === 'pick:file' ? 'Selecting…' : 'Add file'}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            void onPickAndLock('directory')
          }}
          disabled={pendingAction === 'pick:directory'}
        >
          {pendingAction === 'pick:directory' ? 'Selecting…' : 'Add folder'}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            void onRefreshLockedItems()
          }}
          disabled={pendingAction === 'reconcileLockedItems'}
        >
          {pendingAction === 'reconcileLockedItems' ? 'Refreshing…' : 'Refresh list'}
        </button>
      </div>

      {lockedItems.length === 0 ? (
        <div className="empty-state empty-state--workspace">
          <p className="empty-state__title">No stored items yet</p>
          <p className="empty-state__body">
            Use <strong>Add file</strong> or <strong>Add folder</strong> to store something from this note.
          </p>
        </div>
      ) : (
        <ul className="managed-list managed-list--workspace">
          {lockedItems.map((item) => {
            const isUnlocking = pendingAction === `unlock:${item.id}`
            const isRevealing = pendingAction === `reveal:${item.id}`

            return (
              <li key={item.id} className="managed-item">
                <div className="managed-item__header">
                  <div>
                    <h3 className="managed-item__title">{item.originalName}</h3>
                    <p className="managed-item__meta">
                      {item.targetType === 'directory' ? 'Folder' : 'File'} · Updated{' '}
                      {formatUpdatedAt(item.updatedAt)}
                    </p>
                  </div>
                  <span className={`status-pill status-pill--${item.status}`}>{getStatusLabel(item.status)}</span>
                </div>

                <p className="managed-item__detail">{getStatusDetail(item)}</p>

                <dl className="path-grid">
                  <div>
                    <dt>Original location</dt>
                    <dd>{item.originalPath}</dd>
                  </div>
                  <div>
                    <dt>Stored location</dt>
                    <dd>{item.lockedPath}</dd>
                  </div>
                </dl>

                {item.lastError && item.status !== 'error' ? (
                  <p className="managed-item__detail managed-item__detail--muted">{item.lastError}</p>
                ) : null}

                <div className="managed-item__actions">
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      void onRevealTarget(item.id)
                    }}
                    disabled={isRevealing}
                  >
                    {isRevealing ? 'Opening…' : 'Show location'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
                      void onUnlockTarget(item.id)
                    }}
                    disabled={isUnlocking}
                  >
                    {isUnlocking ? 'Restoring…' : 'Restore item'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </form>
  )
}
