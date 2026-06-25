function EmptyState({
  message = "No records found",
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h3>{message}</h3>
      <p>Try changing search or filters</p>
    </div>
  );
}

export default EmptyState;