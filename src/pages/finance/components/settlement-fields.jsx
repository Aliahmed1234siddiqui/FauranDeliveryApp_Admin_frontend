import { Field, Input } from '@/components/ui';
import { money } from '@/utils/format';

import { METHOD_OPTIONS } from '../payouts-utils';

// Amount / method / reference / note, shared by the payout and cash-deposit dialogs.
export function SettlementFields({ form, setForm, error, max, amountLabel }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <>
      <Field label={amountLabel} required error={error} hint={`Up to ${money(max)}`}>
        {(id) => (
          <Input
            id={id}
            prefix="Rs."
            type="number"
            min="1"
            max={max}
            value={form.amount}
            onChange={set('amount')}
            autoFocus
          />
        )}
      </Field>
      <div className="row" style={{ gap: 6, marginTop: -8 }}>
        {[0.25, 0.5, 1].map((f) => (
          <button
            key={f}
            type="button"
            className="chip chip-add"
            onClick={() => setForm((s) => ({ ...s, amount: String(f === 1 ? max : Math.floor(max * f)) }))}
          >
            {f === 1 ? 'Full amount' : `${f * 100}%`}
          </button>
        ))}
      </div>
      <div className="form-grid">
        <Field label="Method">
          {(id) => (
            <select id={id} className="input" value={form.method} onChange={set('method')}>
              {METHOD_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Reference" hint="Bank / wallet transaction id or receipt no.">
          {(id) => (
            <Input id={id} value={form.reference} onChange={set('reference')} placeholder="IBFT123456" />
          )}
        </Field>
        <Field label="Note" className="span-2">
          {(id) => (
            <Input
              id={id}
              value={form.note}
              onChange={set('note')}
              placeholder="e.g. Weekly settlement, week 41"
            />
          )}
        </Field>
      </div>
    </>
  );
}
