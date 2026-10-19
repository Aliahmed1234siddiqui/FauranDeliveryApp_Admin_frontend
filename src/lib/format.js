export const money = (n = 0) => `Rs. ${Math.round(Number(n) || 0).toLocaleString('en-PK')}`;

export function compactMoney(n = 0) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 10000000) return `Rs. ${(v / 10000000).toFixed(2)} Cr`;
  if (Math.abs(v) >= 100000) return `Rs. ${(v / 100000).toFixed(2)} Lac`;
  if (Math.abs(v) >= 1000) return `Rs. ${(v / 1000).toFixed(1)}k`;
  return money(v);
}

export const num = (n = 0) => (Number(n) || 0).toLocaleString('en-PK');
export const compactNum = (n = 0) => (Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export function date(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function dateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

export function time(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return date(iso);
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export const pct = (n, digits = 1) => `${Number(n || 0).toFixed(digits)}%`;

export const titleCase = (s = '') => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const shortDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

// Local calendar date as YYYY-MM-DD (the format every `from` / `to` filter takes).
export function ymd(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

/** `{ from, to }` covering the last `days` days including today. `to` is inclusive on the server. */
export function lastDays(days) {
  const start = new Date();
  start.setDate(start.getDate() - (Number(days) - 1));
  return { from: ymd(start), to: ymd() };
}

// Period labels from /reports/sales: "2026-10-19" · "2026-W42" · "2026-10" · "2026".
export function periodLabel(period = '') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return shortDay(period);
  if (/^\d{4}-W\d{2}$/.test(period)) return `Wk ${period.slice(6)}`;
  if (/^\d{4}-\d{2}$/.test(period)) return new Date(`${period}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  return period;
}

// GeoJSON [lng, lat] point -> { lat, lng }, or null for the unset [0, 0] default.
export function toLatLng(point) {
  const [lng, lat] = point?.coordinates || [];
  return lat || lng ? { lat, lng } : null;
}
