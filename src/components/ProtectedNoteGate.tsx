import { useState } from 'react'
import { StatusBanner } from './StatusBanner'

interface ProtectedNoteGateProps {
  mode: 'setup' | 'unlock'
  isBusy: boolean
  onSetPassword?: (password: string) => Promise<void>
  onUnlock?: (password: string) => Promise<void>
}

export function ProtectedNoteGate({
  mode,
  isBusy,
  onSetPassword,
  onUnlock,
}: ProtectedNoteGateProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!password.trim()) {
      setValidationMessage('Enter a password to continue.')
      return
    }

    if (mode === 'setup') {
      if (!onSetPassword) {
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
      return
    }

    if (!onUnlock) {
      return
    }

    setValidationMessage(null)
    await onUnlock(password)
    setPassword('')
  }

  return (
    <section className="workspace-card workspace-card--gate">
      <div className="gate-panel">
        <p className="gate-panel__eyebrow">Protected note</p>
        <h2 className="workspace-card__title">
          {mode === 'setup' ? 'Create a password for the protected area' : 'Unlock the protected note'}
        </h2>
        <p className="workspace-card__body">
          {mode === 'setup'
            ? 'Set a password once to open the protected note and manage locked files or folders.'
            : 'Enter the password for this device to edit the protected note and manage locked items.'}
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
              autoComplete={mode === 'setup' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'setup' ? (
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
          ) : null}

          <div className="gate-panel__actions">
            <button type="submit" className="btn btn--primary" disabled={isBusy}>
              {mode === 'setup'
                ? isBusy
                  ? 'Saving…'
                  : 'Create password'
                : isBusy
                  ? 'Unlocking…'
                  : 'Unlock protected note'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
