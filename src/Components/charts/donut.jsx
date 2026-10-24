import { useState } from 'react';

// Donut for part-to-whole with <= 5 slices. Legend is always rendered beside it.
export function Donut({ data, size = 168, thickness = 22, centerLabel, centerValue, format = (v) => v }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offsets = data.map((_, i) => data.slice(0, i).reduce((s, d) => s + (d.value / total) * c, 0));
  const active = hover !== null ? data[hover] : null;
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            className="donut-track"
            strokeWidth={thickness}
          />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const gap = data.length > 1 ? 2 : 0;
            return (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={hover === i ? thickness + 4 : thickness}
                strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                strokeDashoffset={-offsets[i]}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ transition: 'stroke-width .15s' }}
              />
            );
          })}
        </svg>
        <div className="donut-center">
          <strong>{active ? format(active.value) : centerValue}</strong>
          <span>{active ? active.label : centerLabel}</span>
        </div>
      </div>
      <ul className="legend">
        {data.map((d, i) => (
          <li
            key={d.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={hover === i ? 'is-active' : ''}
          >
            <i style={{ background: d.color }} />
            <span>{d.label}</span>
            <b>{format(d.value)}</b>
            <em>{((d.value / total) * 100).toFixed(0)}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
