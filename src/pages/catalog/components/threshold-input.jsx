import { useState } from 'react';

import { Input } from '@/components/ui';

// Stock alert level. Empty means "use the server's default", which the response echoes back.
export function ThresholdInput({ value, fallback, onChange }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? (value || (fallback != null ? String(fallback) : ''));
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft);
    onChange(draft === '' || !(n >= 0) ? '' : String(Math.floor(n)));
    setDraft(null);
  };
  return (
    <label className="row" style={{ gap: 8, fontSize: 13 }}>
      <span className="muted">Low stock at</span>
      <Input
        type="number"
        min="0"
        step="1"
        suffix="units"
        style={{ width: 80 }}
        value={shown}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        aria-label="Low-stock threshold"
      />
    </label>
  );
}
