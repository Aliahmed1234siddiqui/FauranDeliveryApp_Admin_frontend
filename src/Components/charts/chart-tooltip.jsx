export function ChartTooltip({ x, y, width, children }) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return (
    <div className="chart-tip" style={{ left, top: y }}>
      {children}
    </div>
  );
}
