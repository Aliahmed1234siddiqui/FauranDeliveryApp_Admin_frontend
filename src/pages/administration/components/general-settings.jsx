import { useState } from 'react';

import { Card, Toggle } from '@/components/ui';
import { useAction } from '@/hooks';
import { settingsApi } from '@/services/api';

import { isDirty, toStrings, validateNumbers } from '../settings-utils';
import { NumberField } from './number-field';
import { SaveBar } from './save-bar';
import { StripeStatus } from './stripe-status';

const GENERAL_RULES = {
  lowStockThreshold: { min: 0, whole: true },
  failedDeliveryWaitMin: { min: 0, max: 60, whole: true },
  maxFailedCodDeliveries: { min: 1, max: 10, whole: true },
};

// PUT /admin/settings/general { lowStockThreshold, requireProductApproval, failedDeliveryWaitMin, maxFailedCodDeliveries }
export function General({ data, onSaved }) {
  const [initial] = useState(() =>
    toStrings({
      lowStockThreshold: data.inventory?.lowStockThreshold,
      requireProductApproval: Boolean(data.products?.requireProductApproval),
      failedDeliveryWaitMin: data.failedDeliveries?.failedDeliveryWaitMin,
      maxFailedCodDeliveries: data.failedDeliveries?.maxFailedCodDeliveries,
    }),
  );
  const [form, setForm] = useState(initial);
  const [run, saving] = useAction();
  const errors = validateNumbers(form, GENERAL_RULES);
  const invalid = Object.keys(errors).length > 0;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () =>
    !invalid &&
    run(() => settingsApi.updateGeneral(form), { success: 'General settings saved' })
      .then(onSaved)
      .catch(() => {});

  return (
    <div className="stack">
      <Card title="Catalog & inventory">
        <div className="stack" style={{ gap: 18 }}>
          <div className="form-grid">
            <NumberField
              label="Low stock threshold"
              suffix="units"
              min={0}
              value={form.lowStockThreshold}
              onChange={set('lowStockThreshold')}
              error={errors.lowStockThreshold}
              hint="Products at or below this count are flagged as low stock"
            />
          </div>
          <hr />
          <Toggle
            label="Require product approval"
            description="New vendor products stay hidden from customers until an admin approves them."
            checked={form.requireProductApproval}
            onChange={set('requireProductApproval')}
          />
        </div>
      </Card>
      <Card title="Failed deliveries" subtitle="What happens when a rider can't reach the customer">
        <div className="form-grid">
          <NumberField
            label="Wait before marking failed"
            suffix="minutes"
            min={0}
            max={60}
            value={form.failedDeliveryWaitMin}
            onChange={set('failedDeliveryWaitMin')}
            error={errors.failedDeliveryWaitMin}
            hint="0–60 minutes"
          />
          <NumberField
            label="Failed COD deliveries allowed"
            suffix="orders"
            min={1}
            max={10}
            value={form.maxFailedCodDeliveries}
            onChange={set('maxFailedCodDeliveries')}
            error={errors.maxFailedCodDeliveries}
            hint="1–10. Most failed cash-on-delivery attempts allowed"
          />
        </div>
      </Card>
      <StripeStatus stripe={data.stripe} />
      <SaveBar
        dirty={isDirty(form, initial)}
        blocked={invalid}
        saving={saving}
        onSave={save}
        onReset={() => setForm(initial)}
      />
    </div>
  );
}
