import { useState } from 'react'
import { StatusBanner } from './StatusBanner'

interface ProtectedNoteGateProps {
  isBusy: boolean
  onSetPassword: (password: string) => Promise<void>
}

export function ProtectedNoteGate({ isBusy, onSetPassword }: ProtectedNoteGateProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!password.trim()) {
      setValidationMessage('Enter a password to continue.')
      return
    }

    if (password !== confirmPassword) {
      setValidationMessage('The passwords do not match yet.')
      return
    }

    setValidationMessage(null)
    await onSetPassword(password)
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <section className="workspace-card workspace-card--gate">
      <div className="gate-panel">
        <p className="gate-panel__eyebrow">First-time setup</p>
        <h2 className="workspace-card__title">Set a password once for this device</h2>
        <p className="workspace-card__body">
          Save a password now. After setup, the app opens as a normal memo window and you can keep writing notes as usual.
        </p>

        {validationMessage ? <StatusBanner tone="error" message={validationMessage} /> : null}

        <form
          className="gate-form"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="field-group">
            <label className="field-label" htmlFor="protected-password">
              Password
            </label>
            <input
              id="protected-password"
              className="text-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="protected-password-confirm">
              Confirm password
            </label>
            <input
              id="protected-password-confirm"
              className="text-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="gate-panel__actions">
            <button type="submit" className="btn btn--primary" disabled={isBusy}>
              {isBusy ? 'Saving…' : 'Save password'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
