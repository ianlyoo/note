interface StatusBannerProps {
  tone: 'success' | 'error' | 'info'
  message: string
  onDismiss?: () => void
}

export function StatusBanner({ tone, message, onDismiss }: StatusBannerProps) {
  if (tone !== 'error') {
    return null
  }

  return (
    <div
      className={`status-banner status-banner--${tone}`}
      role="alert"
      aria-live="assertive"
    >
      <p className="status-banner__message">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          className="status-banner__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss status message"
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
