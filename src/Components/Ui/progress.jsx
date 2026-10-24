export function Progress({ value, max = 100, tone = 'brand' }) {
  return (
    <span className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <span
        className={`progress-bar tone-bg-${tone}`}
        style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
      />
    </span>
  );
}
