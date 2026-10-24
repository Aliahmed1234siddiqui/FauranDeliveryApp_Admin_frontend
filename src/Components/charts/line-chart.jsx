import { useMemo, useState } from 'react';

import { ChartTooltip } from './chart-tooltip';
import { niceMax, useWidth } from './chart-utils';

// Line/area chart. series: [{ key, label, color, dashed?, area? }]; band: { low, high } keys.
export function LineChart({
  data,
  x,
  series,
  band,
  height = 260,
  formatY = (v) => v,
  formatX = (v) => v,
  formatTip = formatY,
  ticks = 4,
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { t: 12, r: 12, b: 28, l: 52 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;

  const max = useMemo(
    () =>
      niceMax(
        Math.max(
          ...data.flatMap((d) => [...series.map((s) => d[s.key] ?? 0), band ? (d[band.high] ?? 0) : 0]),
        ),
      ),
    [data, series, band],
  );
  const sx = (i) => (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const sy = (v) => h - (v / max) * h;
  const path = (key) =>
    data.map((d, i) => (d[key] == null ? null : `${sx(i)},${sy(d[key])}`)).filter(Boolean);
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(w / 64)));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - pad.l) / w) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={series.map((s) => s.label).join(', ')}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          <g transform={`translate(${pad.l},${pad.t})`}>
            {Array.from({ length: ticks + 1 }, (_, i) => {
              const v = (max / ticks) * i;
              return (
                <g key={i}>
                  <line x1={0} x2={w} y1={sy(v)} y2={sy(v)} className="chart-grid" />
                  <text x={-10} y={sy(v)} dy="0.32em" textAnchor="end" className="chart-axis">
                    {formatY(v)}
                  </text>
                </g>
              );
            })}
            {data.map(
              (d, i) =>
                ((i % labelEvery === 0 && data.length - 1 - i >= labelEvery * 0.8) ||
                  i === data.length - 1) && (
                  <text
                    key={i}
                    x={sx(i)}
                    y={h + 18}
                    textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
                    className="chart-axis"
                  >
                    {formatX(d[x])}
                  </text>
                ),
            )}
            {band && (
              <path
                d={`M ${data
                  .map((d, i) => (d[band.high] == null ? null : `${sx(i)},${sy(d[band.high])}`))
                  .filter(Boolean)
                  .join(' L ')} L ${data
                  .map((d, i) => (d[band.low] == null ? null : `${sx(i)},${sy(d[band.low])}`))
                  .filter(Boolean)
                  .reverse()
                  .join(' L ')} Z`}
                className="chart-band"
              />
            )}
            {series.map((s) => {
              const pts = path(s.key);
              if (!pts.length) return null;
              const firstIdx = data.findIndex((d) => d[s.key] != null);
              const lastIdx = data.length - 1 - [...data].reverse().findIndex((d) => d[s.key] != null);
              return (
                <g key={s.key}>
                  {s.area !== false && !s.dashed && (
                    <path
                      d={`M ${pts.join(' L ')} L ${sx(lastIdx)},${h} L ${sx(firstIdx)},${h} Z`}
                      fill={`url(#grad-${s.key})`}
                    />
                  )}
                  <polyline
                    points={pts.join(' ')}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={s.dashed ? '5 5' : undefined}
                  />
                </g>
              );
            })}
            {hover !== null && (
              <g>
                <line x1={sx(hover)} x2={sx(hover)} y1={0} y2={h} className="chart-crosshair" />
                {series.map(
                  (s) =>
                    data[hover][s.key] != null && (
                      <circle
                        key={s.key}
                        cx={sx(hover)}
                        cy={sy(data[hover][s.key])}
                        r="4.5"
                        fill={s.color}
                        className="chart-dot"
                      />
                    ),
                )}
              </g>
            )}
            <rect x={0} y={0} width={w} height={h} fill="transparent" />
          </g>
        </svg>
      )}
      {hover !== null && width > 0 && (
        <ChartTooltip x={pad.l + sx(hover)} y={pad.t} width={width}>
          <strong>{formatX(data[hover][x], true)}</strong>
          {series.map(
            (s) =>
              data[hover][s.key] != null && (
                <span key={s.key} className="tip-row">
                  <i style={{ background: s.color }} />
                  {s.label}
                  <b>{formatTip(data[hover][s.key])}</b>
                </span>
              ),
          )}
          {band && data[hover][band.low] != null && (
            <span className="tip-row tip-muted">
              Range
              <b>
                {formatTip(data[hover][band.low])} – {formatTip(data[hover][band.high])}
              </b>
            </span>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}
