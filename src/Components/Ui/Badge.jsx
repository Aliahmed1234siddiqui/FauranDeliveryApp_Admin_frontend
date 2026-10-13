// Maps a status string to a consistent color across the whole portal.
// Add new statuses here rather than inlining colors in each page.
const STATUS_STYLES = {
  // order statuses
  placed: "bg-status-infoBg text-status-info",
  accepted: "bg-status-infoBg text-status-info",
  preparing: "bg-status-warningBg text-status-warning",
  ready: "bg-status-warningBg text-status-warning",
  rider_assigned: "bg-status-warningBg text-status-warning",
  picked_up: "bg-status-warningBg text-status-warning",
  on_the_way: "bg-status-warningBg text-status-warning",
  delivered: "bg-status-successBg text-status-success",
  cancelled: "bg-status-dangerBg text-status-danger",

  // approval statuses
  pending: "bg-status-warningBg text-status-warning",
  approved: "bg-status-successBg text-status-success",
  rejected: "bg-status-dangerBg text-status-danger",

  // active/blocked
  active: "bg-status-successBg text-status-success",
  blocked: "bg-status-dangerBg text-status-danger",

  // payment
  paid: "bg-status-successBg text-status-success",
  failed: "bg-status-dangerBg text-status-danger",
  refunded: "bg-status-infoBg text-status-info",
};

const LABELS = {
  rider_assigned: "Rider assigned",
  picked_up: "Picked up",
  on_the_way: "On the way",
};

export default function Badge({ status }) {
  const style = STATUS_STYLES[status] || "bg-surface text-ink-muted";
  const label = LABELS[status] || (status ? status.replace(/_/g, " ") : "—");
  return <span className={`badge capitalize ${style}`}>{label}</span>;
}
