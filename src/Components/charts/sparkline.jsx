import { useWidth } from './chart-utils';

export function Sparkline({ values, color = 'var(--chart-brand)', height = 36 }) {
  const [ref, width] = useWidth();
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map(
    (v, i) =>
      `${(i / (values.length - 1)) * width},${height - 3 - ((v - min) / (max - min || 1)) * (height - 6)}`,
  );
  return (
    <div ref={ref} className="sparkline" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} aria-hidden="true">
          <path d={`M ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`} fill={color} opacity="0.1" />
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}
