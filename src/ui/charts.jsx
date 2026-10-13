import { useLayoutEffect, useMemo, useRef, useState } from 'react';

// Lightweight SVG charts, measured to their container so text and markers
// never stretch. Colors come from CSS custom properties (--series-*, --chart-*)
// so light and dark themes each get their own validated steps.

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function niceMax(v) {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const f = v / exp;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
}

function Tooltip({ x, y, width, children }) {
  const left = Math.min(Math.max(x, 70), width - 70);
  return <div className="chart-tip" style={{ left, top: y }}>{children}</div>;
}

// Line/area chart. series: [{ key, label, color, dashed?, area? }]; band: { low, high } keys.
export function LineChart({ data, x, series, band, height = 260, formatY = (v) => v, formatX = (v) => v, formatTip = formatY, ticks = 4 }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { t: 12, r: 12, b: 28, l: 52 };
  const w = Math.max(0, width - pad.l - pad.r);
  const h = height - pad.t - pad.b;

  const max = useMemo(() => niceMax(Math.max(...data.flatMap((d) => [...series.map((s) => d[s.key] ?? 0), band ? d[band.high] ?? 0 : 0]))), [data, series, band]);
  const sx = (i) => (data.length <= 1 ? w / 2 : (i / (data.length - 1)) * w);
  const sy = (v) => h - (v / max) * h;
  const path = (key) => data.map((d, i) => (d[key] == null ? null : `${sx(i)},${sy(d[key])}`)).filter(Boolean);
  const labelEvery = Math.ceil(data.length / Math.max(2, Math.floor(w / 64)));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - pad.l) / w) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  return (
    <div className="chart" ref={ref} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label={series.map((s) => s.label).join(', ')}>
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
                  <text x={-10} y={sy(v)} dy="0.32em" textAnchor="end" className="chart-axis">{formatY(v)}</text>
                </g>
              );
            })}
            {data.map((d, i) => ((i % labelEvery === 0 && data.length - 1 - i >= labelEvery * 0.8) || i === data.length - 1) && (
              <text key={i} x={sx(i)} y={h + 18} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} className="chart-axis">{formatX(d[x])}</text>
            ))}
            {band && (
              <path
                d={`M ${data.map((d, i) => (d[band.high] == null ? null : `${sx(i)},${sy(d[band.high])}`)).filter(Boolean).join(' L ')} L ${data.map((d, i) => (d[band.low] == null ? null : `${sx(i)},${sy(d[band.low])}`)).filter(Boolean).reverse().join(' L ')} Z`}
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
                  {s.area !== false && !s.dashed && <path d={`M ${pts.join(' L ')} L ${sx(lastIdx)},${h} L ${sx(firstIdx)},${h} Z`} fill={`url(#grad-${s.key})`} />}
                  <polyline points={pts.join(' ')} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '5 5' : undefined} />
                </g>
              );
            })}
            {hover !== null && (
              <g>
                <line x1={sx(hover)} x2={sx(hover)} y1={0} y2={h} className="chart-crosshair" />
                {series.map((s) => data[hover][s.key] != null && (
                  <circle key={s.key} cx={sx(hover)} cy={sy(data[hover][s.key])} r="4.5" fill={s.color} className="chart-dot" />
                ))}
              </g>
            )}
            <rect x={0} y={0} width={w} height={h} fill="transparent" />
          </g>
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tooltip x={pad.l + sx(hover)} y={pad.t} width={width}>
          <strong>{formatX(data[hover][x], true)}</strong>
          {series.map((s) => data[hover][s.key] != null && (
            <span key={s.key} className="tip-row"><i style={{ background: s.color }} />{s.label}<b>{formatTip(data[hover][s.key])}</b></span>
          ))}
          {band && data[hover][band.low] != null && <span className="tip-row tip-muted">Range<b>{formatTip(data[hover][band.low])} – {formatTip(data[hover][band.high])}</b></span>}
        </Tooltip>
      )}
    </div>
  );
}

// Vertical bars, one series. Hover shows the exact value.
export function BarChart({ data, x, y, height = 240, color = 'var(--chart-brand)', formatY = (v) => v, formatX = (v) => v, highlightLast }) {
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
                  <text x={-10} y={yy} dy="0.32em" textAnchor="end" className="chart-axis">{formatY(v)}</text>
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
                  <path d={`M ${bx},${h} L ${bx},${h - bh + 4} Q ${bx},${h - bh} ${bx + 4},${h - bh} L ${bx + bw - 4},${h - bh} Q ${bx + bw},${h - bh} ${bx + bw},${h - bh + 4} L ${bx + bw},${h} Z`} fill={fill} opacity={dim ? 0.45 : 1} className="chart-bar" />
                  {(i % labelEvery === 0 && (data.length - 1 - i >= labelEvery * 0.8 || i === data.length - 1)) && <text x={i * slot + slot / 2} y={h + 18} textAnchor="middle" className="chart-axis">{formatX(d[x])}</text>}
                </g>
              );
            })}
          </g>
        </svg>
      )}
      {hover !== null && width > 0 && (
        <Tooltip x={pad.l + hover * slot + slot / 2} y={pad.t} width={width}>
          <strong>{formatX(data[hover][x], true)}</strong>
          <span className="tip-row"><b>{formatY(data[hover][y], true)}</b></span>
        </Tooltip>
      )}
    </div>
  );
}

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
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="donut-track" strokeWidth={thickness} />
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
          <li key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={hover === i ? 'is-active' : ''}>
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

export function Sparkline({ values, color = 'var(--chart-brand)', height = 36 }) {
  const [ref, width] = useWidth();
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 3 - ((v - min) / (max - min || 1)) * (height - 6)}`);
  return (
    <div ref={ref} className="sparkline" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} aria-hidden="true">
          <path d={`M ${pts.join(' L ')} L ${width},${height} L 0,${height} Z`} fill={color} opacity="0.1" />
          <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

// Ranked horizontal bars - for "top N" lists where the label matters most.
export function BarList({ items, format = (v) => v, color = 'var(--chart-brand)', onItemClick }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="barlist">
      {items.map((item, i) => (
        <li key={item.key || item.label} onClick={onItemClick ? () => onItemClick(item) : undefined} className={onItemClick ? 'is-clickable' : ''}>
          <div className="barlist-row">
            <span className="barlist-rank">{String(i + 1).padStart(2, '0')}</span>
            <span className="barlist-label">{item.label}</span>
            {item.meta && <span className="barlist-meta">{item.meta}</span>}
            <b>{format(item.value)}</b>
          </div>
          <span className="barlist-track"><span style={{ width: `${(item.value / max) * 100}%`, background: color }} /></span>
        </li>
      ))}
    </ul>
  );
}

export function ChartLegend({ items }) {
  return (
    <div className="chart-legend">
      {items.map((i) => <span key={i.label}><i style={{ background: i.color, ...(i.dashed ? { background: 'none', borderTop: `2px dashed ${i.color}`, height: 0 } : {}) }} />{i.label}</span>)}
    </div>
  );
}
