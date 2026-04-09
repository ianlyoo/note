interface StatusBannerProps {
  tone: 'success' | 'error' | 'info'
  message: string
  onDismiss?: () => void
}

export function StatusBanner({ tone, message, onDismiss }: StatusBannerProps) {
  return (
    <div
      className={`status-banner status-banner--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
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
