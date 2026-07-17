function EmptyState({
  icon = "📂",
  title = "No records found",
  message =
    "There is currently no data available.",
  actionLabel = "",
  onAction,
}) {
  return (
    <div className="api-empty-state">
      <div className="api-empty-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;