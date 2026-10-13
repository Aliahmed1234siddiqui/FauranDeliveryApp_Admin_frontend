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

// Mock data is anchored to 13 Oct 2026, so "now" is that day while mocking.
const NOW = () => Math.max(Date.now(), new Date('2026-10-13T12:00:00').getTime());

export function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Math.max(0, (NOW() - new Date(iso).getTime()) / 1000);
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
