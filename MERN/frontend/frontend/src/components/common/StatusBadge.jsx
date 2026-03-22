const normalizeStatus = (status) => String(status ?? "unknown").toLowerCase();

const variantByStatus = {
  draft: "status-warning",
  pending: "status-neutral",
  unpaid: "status-neutral",
  open: "status-info",
  published: "status-info",
  accepted: "status-info",
  assigned: "status-info",
  searching: "status-info",
  locked: "status-primary",
  paid: "status-primary",
  released: "status-success",
  completed: "status-success",
  confirmed: "status-success",
  refunded: "status-danger",
  rejected: "status-danger",
  failed: "status-danger",
};

export const StatusBadge = ({ status, className = "" }) => {
  const normalizedStatus = normalizeStatus(status);
  const variantClass = variantByStatus[normalizedStatus] ?? "status-neutral";

  return (
    <span className={`status-badge ${variantClass} ${className}`.trim()}>
      {normalizedStatus}
    </span>
  );
};
