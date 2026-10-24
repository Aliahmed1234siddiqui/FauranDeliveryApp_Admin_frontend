// Ranked horizontal bars - for "top N" lists where the label matters most.
export function BarList({ items, format = (v) => v, color = 'var(--chart-brand)', onItemClick }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="barlist">
      {items.map((item, i) => (
        <li
          key={item.key || item.label}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
          className={onItemClick ? 'is-clickable' : ''}
        >
          <div className="barlist-row">
            <span className="barlist-rank">{String(i + 1).padStart(2, '0')}</span>
            <span className="barlist-label">{item.label}</span>
            {item.meta && <span className="barlist-meta">{item.meta}</span>}
            <b>{format(item.value)}</b>
          </div>
          <span className="barlist-track">
            <span style={{ width: `${(item.value / max) * 100}%`, background: color }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
