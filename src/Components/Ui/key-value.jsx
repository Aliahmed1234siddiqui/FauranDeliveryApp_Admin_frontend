export function KeyValue({ items, columns = 2 }) {
  return (
    <dl className="kv" style={{ '--kv-cols': columns }}>
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k} className="kv-item">
          <dt>{k}</dt>
          <dd>{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
