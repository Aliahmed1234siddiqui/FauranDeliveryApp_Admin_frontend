import { useQueryState } from '@/router';
import { lastDays } from '@/utils/format';

import { PRESETS } from '../reports-utils';

const DEFAULT_DAYS = '30';

// Shared from/to range kept in the URL; empty params fall back to the last 30 days.
export function useDateRange() {
  const fallback = lastDays(DEFAULT_DAYS);
  const [from, setFrom] = useQueryState('from', '');
  const [to, setTo] = useQueryState('to', '');
  const range = { from: from || fallback.from, to: to || fallback.to };
  const setRange = (next) => {
    setFrom(next.from);
    setTo(next.to);
  };
  const preset =
    PRESETS.find((p) => {
      const r = lastDays(p.value);
      return r.from === range.from && r.to === range.to;
    })?.value || '';
  return {
    range,
    setRange,
    preset,
    setPreset: (days) => setRange(days === DEFAULT_DAYS ? { from: '', to: '' } : lastDays(days)),
  };
}
