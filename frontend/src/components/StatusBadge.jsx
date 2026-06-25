function StatusBadge({ status }) {
  const statusClass =
    status === "Paid" ||
    status === "Cleared" ||
    status === "Generated"
      ? "status-success"
      : status === "Pending" ||
        status === "Unpaid"
      ? "status-warning"
      : "status-danger";

  return (
    <span className={`status-badge ${statusClass}`}>
      {status}
    </span>
  );
}

export default StatusBadge;