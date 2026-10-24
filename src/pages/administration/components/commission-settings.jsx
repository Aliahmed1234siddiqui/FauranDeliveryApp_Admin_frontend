import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';

import { Card, Field, Input } from '@/components/ui';
import { useAction } from '@/hooks';
import { settingsApi } from '@/services/api';
import { money } from '@/utils/format';

import { validateNumbers } from '../settings-utils';
import { SaveBar } from './save-bar';

// PUT /admin/settings/commission { percent }
export function CommissionSettings({ commission, onSaved }) {
  const initial = String(commission?.percent ?? '');
  const [percent, setPercent] = useState(initial);
  const [sample, setSample] = useState('2500');
  const [run, saving] = useAction();
  const error = validateNumbers({ percent }, { percent: { min: 0, max: 100 } }).percent;
  const value = error ? 0 : Number(percent);
  const save = () =>
    !error &&
    run(() => settingsApi.updateCommission(percent), { success: `Commission set to ${value}%` })
      .then(onSaved)
      .catch(() => {});
  const subtotal = Number(sample) || 0;
  const fee = Math.round((subtotal * value) / 100);
  const changed = percent !== initial;

  return (
    <div className="stack">
      <div className="grid grid-2">
        <Card title="Platform commission" subtitle="Fauran Mart's share of each order's product sales">
          <Field label="Commission rate" error={error} hint="0–100%, decimals allowed.">
            {(id) => (
              <Input
                id={id}
                type="number"
                min="0"
                max="100"
                step="0.5"
                suffix="%"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
              />
            )}
          </Field>
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={value}
            onChange={(e) => setPercent(e.target.value)}
            style={{ marginTop: 14 }}
            aria-label="Commission rate"
          />
          {changed && !error && (
            <div className="callout callout-warning" style={{ marginTop: 14 }}>
              <TriangleAlert size={16} />
              <div>
                Changes from <strong>{initial}%</strong> to <strong>{value}%</strong>. It applies to new
                orders only.
              </div>
            </div>
          )}
        </Card>
        <Card title="What a vendor gets" subtitle="Try an order value">
          <Field label="Products subtotal">
            {(id) => (
              <Input
                id={id}
                type="number"
                min="0"
                prefix="Rs."
                value={sample}
                onChange={(e) => setSample(e.target.value)}
              />
            )}
          </Field>
          <div className="totals" style={{ marginTop: 10 }}>
            <div>
              <span>Products subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div>
              <span>Fauran Mart commission ({value}%)</span>
              <span className="neg">− {money(fee)}</span>
            </div>
            <div className="grand">
              <span>Vendor payout</span>
              <span>{money(subtotal - fee)}</span>
            </div>
          </div>
        </Card>
      </div>
      <SaveBar
        dirty={changed}
        blocked={!!error}
        saving={saving}
        onSave={save}
        onReset={() => setPercent(initial)}
      />
    </div>
  );
}
