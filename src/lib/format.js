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

// The backend works in Pakistan time (days, weeks, months and date filters), so every
// timestamp is shown in Asia/Karachi too, whatever the viewer's own clock says.
export const TIME_ZONE = 'Asia/Karachi';

export function date(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TIME_ZONE });
}

export function dateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: TIME_ZONE });
}

export function time(iso, { seconds = false } = {}) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: seconds ? '2-digit' : undefined, hour12: true, timeZone: TIME_ZONE });
}

/** Today in Pakistan, e.g. "Monday, 26 October". */
export const longToday = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIME_ZONE });

/** The current hour (0-23) in Pakistan. */
export const karachiHour = () => Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: TIME_ZONE }).format(new Date()));

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

// Label for a plain YYYY-MM-DD day. Read and written as UTC so the label never shifts a day.
export const shortDay = (iso) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });

// Pakistan calendar date as YYYY-MM-DD (the format every `from` / `to` filter takes).
// The server reads it as 00:00-23:59 Pakistan time, so never send a UTC ISO string instead.
export function ymd(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TIME_ZONE }).format(new Date(d));
}

/** `{ from, to }` covering the last `days` Pakistan days including today. `to` is inclusive on the server. */
export function lastDays(days) {
  const to = ymd();
  const start = new Date(`${to}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (Number(days) - 1));
  return { from: start.toISOString().slice(0, 10), to };
}

// Period labels from /reports/sales: "2026-10-19" · "2026-W42" · "2026-10" · "2026".
export function periodLabel(period = '') {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return shortDay(period);
  if (/^\d{4}-W\d{2}$/.test(period)) return `Wk ${period.slice(6)}`;
  if (/^\d{4}-\d{2}$/.test(period)) return new Date(`${period}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
  return period;
}

// Fauran Mart's total earnings on a money row: commission from vendors + commission from riders.
// Rows from before rider commission existed have no `profit`, so fall back to the sum.
export const profitOf = (r = {}) => r.profit ?? (Number(r.platformCommission) || 0) + (Number(r.riderCommission) || 0);

// What riders receive: delivery fees minus the rider commission.
export const riderPayoutOf = (r = {}) => r.riderPayout ?? (Number(r.deliveryFees) || 0) - (Number(r.riderCommission) || 0);

// GeoJSON [lng, lat] point -> { lat, lng }, or null for the unset [0, 0] default.
export function toLatLng(point) {
  const [lng, lat] = point?.coordinates || [];
  return lat || lng ? { lat, lng } : null;
}
