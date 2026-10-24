import { SETTLEMENT_METHOD_LABELS } from '@/constants';
import { SETTLEMENT_METHODS } from '@/services/api';
import { timeAgo, titleCase } from '@/utils/format';

export const METHOD_OPTIONS = SETTLEMENT_METHODS.map((m) => ({
  value: m,
  label: SETTLEMENT_METHOD_LABELS[m] || titleCase(m),
}));

export const methodLabel = (m) => SETTLEMENT_METHOD_LABELS[m] || titleCase(m || '');

export const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

export const amountError = (form, max, overMessage) => {
  const amount = Number(form.amount);
  if (form.amount === '') return '';
  if (!(amount > 0)) return 'Enter an amount above zero';
  return amount > max ? overMessage : '';
};

export const lastPayout = (at) => (at ? timeAgo(at) : <span className="muted">Never</span>);
