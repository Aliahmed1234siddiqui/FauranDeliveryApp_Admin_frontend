export default function StatCard({ label, value, icon: Icon, accent = "brand", trend }) {
  const accentClasses = {
    brand: "bg-brand-light text-brand",
    amber: "bg-accent-light text-accent-dark",
    info: "bg-status-infoBg text-status-info",
    danger: "bg-status-dangerBg text-status-danger",
  };

  return (
    <div className="card flex items-start justify-between p-5">
      <div>
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
        {trend && <p className="mt-1 text-xs text-status-success">{trend}</p>}
      </div>
      {Icon && (
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
