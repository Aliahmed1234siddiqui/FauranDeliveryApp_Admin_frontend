import { useState } from 'react';

import { ChartTooltip } from './chart-tooltip';
import { niceMax, useWidth } from './chart-utils';

// Vertical bars, one series. Hover shows the exact value.
export function BarChart({
  data,
  x,
  y,
  height = 240,
  color = 'var(--chart-brand)',
  formatY = (v) => v,
  formatX = (v) => v,
  highlightLast,
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { t: 12, r: 8, b: 28, l: 52 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;
  const max = niceMax(Math.max(...data.map((d) => d[y])));
  const slot = w / data.length;
  const bw = Math.max(4, Math.min(28, slot - 6));
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(w / 56)));

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} onMouseLeave={() => setHover(null)} role="img">
          <g transform={`translate(${pad.l},${pad.t})`}>
            {[0, 1, 2, 3, 4].map((i) => {
              const v = (max / 4) * i;
              const yy = h - (v / max) * h;
              return (
                <g key={i}>
                  <line x1={0} x2={w} y1={yy} y2={yy} className="chart-grid" />
                  <text x={-10} y={yy} dy="0.32em" textAnchor="end" className="chart-axis">
                    {formatY(v)}
                  </text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const bh = Math.max(2, (d[y] / max) * h);
              const bx = i * slot + (slot - bw) / 2;
              const dim = hover !== null && hover !== i;
              const fill = highlightLast && i === data.length - 1 ? 'var(--chart-accent)' : color;
              return (
                <g key={i} onMouseEnter={() => setHover(i)}>
                  <rect x={i * slot} y={0} width={slot} height={h} fill="transparent" />
                  <path
                    d={`M ${bx},${h} L ${bx},${h - bh + 4} Q ${bx},${h - bh} ${bx + 4},${h - bh} L ${bx + bw - 4},${h - bh} Q ${bx + bw},${h - bh} ${bx + bw},${h - bh + 4} L ${bx + bw},${h} Z`}
                    fill={fill}
                    opacity={dim ? 0.45 : 1}
                    className="chart-bar"
                  />
                  {i % labelEvery === 0 &&
                    (data.length - 1 - i >= labelEvery * 0.8 || i === data.length - 1) && (
                      <text x={i * slot + slot / 2} y={h + 18} textAnchor="middle" className="chart-axis">
                        {formatX(d[x])}
                      </text>
                    )}
                </g>
              );
            })}
          </g>
        </svg>
      )}
      {hover !== null && width > 0 && (
        <ChartTooltip x={pad.l + hover * slot + slot / 2} y={pad.t} width={width}>
          <strong>{formatX(data[hover][x], true)}</strong>
          <span className="tip-row">
            <b>{formatY(data[hover][y], true)}</b>
          </span>
        </ChartTooltip>
      )}
    </div>
  );
}
