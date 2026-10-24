export function ChartLegend({ items }) {
  return (
    <div className="chart-legend">
      {items.map((i) => (
        <span key={i.label}>
          <i
            style={{
              background: i.color,
              ...(i.dashed ? { background: 'none', borderTop: `2px dashed ${i.color}`, height: 0 } : {}),
            }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
