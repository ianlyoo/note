import type { NoteDocument } from '../lib/types'

interface NoteSidebarProps {
  notes: NoteDocument[]
  selectedNoteId: string | null
  onSelect: (noteId: string) => void
}

function formatUpdatedAt(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Recently updated'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function NoteSidebar({ notes, selectedNoteId, onSelect }: NoteSidebarProps) {
  return (
    <div className="sidebar-panel">
      <div className="sidebar-panel__header">
        <div>
          <p className="sidebar-panel__eyebrow">Notes</p>
          <h2 className="sidebar-panel__title">All notes</h2>
        </div>
        <span className="sidebar-panel__count">{notes.length}</span>
      </div>

      <ul className="note-list">
        {notes.map((note) => {
          const isSelected = note.id === selectedNoteId

          return (
            <li key={note.id} className="note-list__entry">
              <button
                type="button"
                className={`note-list__item ${isSelected ? 'note-list__item--selected' : ''}`}
                onClick={() => onSelect(note.id)}
              >
                <div className="note-list__header">
                  <h3 className="note-list__title">{note.title.trim() || 'Untitled note'}</h3>
                  <span className="note-list__time">{formatUpdatedAt(note.updatedAt)}</span>
                </div>
                <p className="note-list__preview">{note.preview.trim() || 'No additional text yet.'}</p>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
