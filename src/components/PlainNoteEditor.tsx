import { useState, type KeyboardEvent } from 'react'
import type { NoteDocument } from '../lib/types'

interface PlainNoteEditorProps {
  note: NoteDocument
  isSaving: boolean
  onSave: (noteId: string, title: string, body: string) => Promise<void>
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

export function PlainNoteEditor({ note, isSaving, onSave }: PlainNoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)

  const isDirty = title !== note.title || body !== note.body

  const handleSubmit = async () => {
    if (!isDirty || isSaving) {
      return
    }

    await onSave(note.id, title, body)
  }

  const handleKeyDown = async (event: KeyboardEvent<HTMLFormElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      await handleSubmit()
    }
  }

  return (
    <form
      className="workspace-stack"
      onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}
      onKeyDown={handleKeyDown}
    >
      <section className="workspace-card">
        <header className="editor-header">
          <div>
            <p className="editor-header__eyebrow">Standard note</p>
            <h2 className="workspace-card__title">{note.title.trim() || 'Untitled note'}</h2>
            <p className="workspace-card__body">Updated {formatUpdatedAt(note.updatedAt)}</p>
          </div>
          <div className="editor-header__actions">
            <span className={`save-state ${isDirty ? 'save-state--warning' : 'save-state--muted'}`}>
              {isDirty ? 'Unsaved changes' : 'Up to date'}
            </span>
            <button type="submit" className="btn btn--primary" disabled={!isDirty || isSaving}>
              {isSaving ? 'Saving…' : 'Save note'}
            </button>
          </div>
        </header>

        <div className="field-group">
          <label className="field-label" htmlFor="plain-note-title">
            Title
          </label>
          <input
            id="plain-note-title"
            className="text-input"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
          />
        </div>

        <div className="field-group field-group--fill">
          <label className="field-label" htmlFor="plain-note-body">
            Content
          </label>
          <textarea
            id="plain-note-body"
            className="text-area"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write here"
          />
        </div>
      </section>
    </form>
  )
}
