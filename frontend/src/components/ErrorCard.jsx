function ErrorCard({
  title = "Unable to load data",
  message =
    "An unexpected error occurred.",
  onRetry,
  retryLabel = "Try Again",
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? "api-error-card api-error-card-compact"
          : "api-error-card"
      }
      role="alert"
    >
      <div className="api-error-icon">
        ⚠️
      </div>

      <div className="api-error-content">
        <h3>{title}</h3>

        <p>{message}</p>

        <div className="api-error-help">
          <span>
            Check that the backend server is
            running.
          </span>

          <span>
            Expected address:
            http://localhost:5001
          </span>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          className="api-error-retry-button"
          onClick={onRetry}
        >
          ↻ {retryLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorCard;