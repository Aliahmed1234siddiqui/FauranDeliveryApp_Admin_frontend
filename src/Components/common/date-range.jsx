import { CalendarDays, X } from 'lucide-react';

import { IconButton } from '@/components/ui';

// From / to date filter. Values are YYYY-MM-DD strings; `to` is inclusive on the server.
export function DateRange({ from, to, onChange }) {
  return (
    <div className="date-range">
      <CalendarDays size={16} className="muted" />
      <input
        type="date"
        className="input"
        value={from || ''}
        max={to || undefined}
        onChange={(e) => onChange({ from: e.target.value, to })}
        aria-label="From date"
      />
      <span className="muted">→</span>
      <input
        type="date"
        className="input"
        value={to || ''}
        min={from || undefined}
        onChange={(e) => onChange({ from, to: e.target.value })}
        aria-label="To date"
      />
      {(from || to) && (
        <IconButton icon={X} label="Clear dates" onClick={() => onChange({ from: '', to: '' })} />
      )}
    </div>
  );
}
