import { useState } from 'react';
import { Building2, Info, Percent, Radar, Save, Store, TriangleAlert } from 'lucide-react';
import { useQueryState } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { settingsApi } from '../services/api';
import { money } from '../lib/format';
import { Badge, Button, Card, ErrorState, Field, Input, KeyValue, PageHeader, Skeleton, Toggle } from '../ui/primitives';

const SECTIONS = [
  { value: 'general', label: 'General', icon: Building2 },
  { value: 'radius', label: 'Delivery radius', icon: Radar },
  { value: 'commission', label: 'Commission', icon: Percent },
];

// Form values are strings while typing; compare and validate as numbers.
const toStrings = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, typeof v === 'boolean' ? v : String(v ?? '')]));
const isDirty = (form, initial) => JSON.stringify(form) !== JSON.stringify(initial);

// `rules`: { key: { min, max, whole, label } } → { key: message }
function validateNumbers(form, rules) {
  const errors = {};
  Object.entries(rules).forEach(([key, { min, max, whole }]) => {
    const raw = form[key];
    const n = Number(raw);
    if (raw === '' || Number.isNaN(n)) errors[key] = 'Enter a number';
    else if (whole && !Number.isInteger(n)) errors[key] = 'Use a whole number';
    else if (min !== undefined && n < min) errors[key] = `Must be at least ${min}`;
    else if (max !== undefined && n > max) errors[key] = `Must be ${max} or less`;
  });
  return errors;
}

function SaveBar({ dirty, saving, onSave, onReset, blocked }) {
  if (!dirty) return null;
  return (
    <div className="save-bar">
      <span>{blocked ? 'Fix the highlighted fields to save' : 'You have unsaved changes'}</span>
      <span className="spacer" />
      <Button variant="ghost" size="sm" onClick={onReset}>Discard</Button>
      <Button variant="accent" size="sm" icon={Save} loading={saving} disabled={blocked} onClick={onSave}>Save changes</Button>
    </div>
  );
}

function NumberField({ label, hint, error, value, onChange, suffix, step = 1, min, max }) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => <Input id={id} type="number" inputMode="decimal" step={step} min={min} max={max} suffix={suffix} value={value} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

const GENERAL_RULES = {
  lowStockThreshold: { min: 0, whole: true },
  failedDeliveryWaitMin: { min: 0, max: 60, whole: true },
  maxFailedCodDeliveries: { min: 1, max: 10, whole: true },
};

function StripeStatus({ stripe = {} }) {
  const yesNo = (on, yes, no) => <Badge tone={on ? 'success' : 'warning'} dot>{on ? yes : no}</Badge>;
  return (
    <Card title="Card payments (Stripe)" subtitle="Read-only. Set up on the server.">
      <KeyValue items={[
        ['API keys', yesNo(stripe.configured, 'Configured', 'Not configured')],
        ['Webhook', yesNo(stripe.webhookConfigured, 'Configured', 'Not configured')],
        ['Currency', stripe.currency?.toUpperCase()],
      ]}
      />
    </Card>
  );
}

// PUT /admin/settings/general { lowStockThreshold, requireProductApproval, failedDeliveryWaitMin, maxFailedCodDeliveries }
function General({ data, onSaved }) {
  const [initial] = useState(() => toStrings({
    lowStockThreshold: data.inventory?.lowStockThreshold,
    requireProductApproval: Boolean(data.products?.requireProductApproval),
    failedDeliveryWaitMin: data.failedDeliveries?.failedDeliveryWaitMin,
    maxFailedCodDeliveries: data.failedDeliveries?.maxFailedCodDeliveries,
  }));
  const [form, setForm] = useState(initial);
  const [run, saving] = useAction();
  const errors = validateNumbers(form, GENERAL_RULES);
  const invalid = Object.keys(errors).length > 0;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => !invalid && run(() => settingsApi.updateGeneral(form), { success: 'General settings saved' }).then(onSaved).catch(() => {});

  return (
    <div className="stack">
      <Card title="Catalog & inventory">
        <div className="stack" style={{ gap: 18 }}>
          <div className="form-grid">
            <NumberField label="Low stock threshold" suffix="units" min={0} value={form.lowStockThreshold} onChange={set('lowStockThreshold')} error={errors.lowStockThreshold} hint="Products at or below this count are flagged as low stock" />
          </div>
          <hr />
          <Toggle label="Require product approval" description="New vendor products stay hidden from customers until an admin approves them." checked={form.requireProductApproval} onChange={set('requireProductApproval')} />
        </div>
      </Card>
      <Card title="Failed deliveries" subtitle="What happens when a rider can't reach the customer">
        <div className="form-grid">
          <NumberField label="Wait before marking failed" suffix="minutes" min={0} max={60} value={form.failedDeliveryWaitMin} onChange={set('failedDeliveryWaitMin')} error={errors.failedDeliveryWaitMin} hint="0–60 minutes" />
          <NumberField label="Failed COD deliveries allowed" suffix="orders" min={1} max={10} value={form.maxFailedCodDeliveries} onChange={set('maxFailedCodDeliveries')} error={errors.maxFailedCodDeliveries} hint="1–10. Most failed cash-on-delivery attempts allowed" />
        </div>
      </Card>
      <StripeStatus stripe={data.stripe} />
      <SaveBar dirty={isDirty(form, initial)} blocked={invalid} saving={saving} onSave={save} onReset={() => setForm(initial)} />
    </div>
  );
}

function validateRadius(form) {
  const errors = validateNumbers(form, {
    initialKm: { min: 0.5 },
    stepKm: { min: 0.5 },
    maxKm: { max: 50 },
    timeoutSec: { min: 10, max: 600 },
  });
  if (!errors.maxKm && !errors.initialKm && Number(form.maxKm) < Number(form.initialKm)) errors.maxKm = 'Must be at least the starting radius';
  return errors;
}

// Preview rings for the search radius (only drawn when the values are valid).
function RadiusPreview({ initialKm, stepKm, maxKm, timeoutSec }) {
  const rings = [];
  for (let r = initialKm; r < maxKm && rings.length < 8; r += stepKm) rings.push(+r.toFixed(1));
  const totalWait = (rings.length + 1) * timeoutSec;
  return (
    <Card title="Preview" subtitle={`${rings.length + 1} search steps · up to ${Math.round((totalWait / 60) * 10) / 10} min before giving up`}>
      <div className="radius-viz">
        <div className="radius-ring is-max" style={{ width: '100%', height: '100%' }}><span>{maxKm} km max</span></div>
        {rings.map((r) => (
          <div key={r} className="radius-ring" style={{ width: `${(r / maxKm) * 100}%`, height: `${(r / maxKm) * 100}%` }}>{r === rings[0] && <span>{r} km</span>}</div>
        ))}
        <span className="radius-center"><Store size={16} /></span>
      </div>
      <div className="callout callout-info" style={{ marginTop: 18 }}><Info size={16} /><div>Search starts at <strong>{initialKm} km</strong>, grows by <strong>{stepKm} km</strong> every <strong>{timeoutSec}s</strong>, and stops at <strong>{maxKm} km</strong>.</div></div>
    </Card>
  );
}

// PUT /admin/settings/radius { initialKm, stepKm, maxKm, timeoutSec }
function RadiusSettings({ radius, onSaved }) {
  const [initial] = useState(() => toStrings({ initialKm: radius.initialKm, stepKm: radius.stepKm, maxKm: radius.maxKm, timeoutSec: radius.timeoutSec }));
  const [form, setForm] = useState(initial);
  const [run, saving] = useAction();
  const errors = validateRadius(form);
  const invalid = Object.keys(errors).length > 0;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () => !invalid && run(() => settingsApi.updateRadius(form), { success: 'Delivery radius saved' }).then(onSaved).catch(() => {});
  const n = (k) => Number(form[k]);

  return (
    <div className="stack">
      <div className="grid grid-2">
        <Card title="Rider search radius" subtitle="How far Fauran looks for a rider when an order is ready">
          <div className="stack">
            <NumberField label="Starting radius" suffix="km" step={0.5} min={0.5} value={form.initialKm} onChange={set('initialKm')} error={errors.initialKm} hint="First search ring. At least 0.5 km" />
            <NumberField label="Expand by" suffix="km" step={0.5} min={0.5} value={form.stepKm} onChange={set('stepKm')} error={errors.stepKm} hint="Added each time nobody accepts. At least 0.5 km" />
            <NumberField label="Maximum radius" suffix="km" step={0.5} max={50} value={form.maxKm} onChange={set('maxKm')} error={errors.maxKm} hint="Search stops here. Up to 50 km" />
            <NumberField label="Wait per ring" suffix="sec" min={10} max={600} value={form.timeoutSec} onChange={set('timeoutSec')} error={errors.timeoutSec} hint="Time before expanding. 10–600 seconds" />
          </div>
        </Card>
        {invalid
          ? <Card title="Preview"><div className="callout callout-danger"><TriangleAlert size={16} />Fix the highlighted fields to see the preview.</div></Card>
          : <RadiusPreview initialKm={n('initialKm')} stepKm={n('stepKm')} maxKm={n('maxKm')} timeoutSec={n('timeoutSec')} />}
      </div>
      <SaveBar dirty={isDirty(form, initial)} blocked={invalid} saving={saving} onSave={save} onReset={() => setForm(initial)} />
    </div>
  );
}

// PUT /admin/settings/commission { percent }
function CommissionSettings({ commission, onSaved }) {
  const initial = String(commission?.percent ?? '');
  const [percent, setPercent] = useState(initial);
  const [sample, setSample] = useState('2500');
  const [run, saving] = useAction();
  const error = validateNumbers({ percent }, { percent: { min: 0, max: 100 } }).percent;
  const value = error ? 0 : Number(percent);
  const save = () => !error && run(() => settingsApi.updateCommission(percent), { success: `Commission set to ${value}%` }).then(onSaved).catch(() => {});
  const subtotal = Number(sample) || 0;
  const fee = Math.round((subtotal * value) / 100);
  const changed = percent !== initial;

  return (
    <div className="stack">
      <div className="grid grid-2">
        <Card title="Platform commission" subtitle="Fauran's share of each order's product sales">
          <Field label="Commission rate" error={error} hint="0–100%, decimals allowed.">
            {(id) => <Input id={id} type="number" min="0" max="100" step="0.5" suffix="%" value={percent} onChange={(e) => setPercent(e.target.value)} />}
          </Field>
          <input type="range" min="0" max="100" step="0.5" value={value} onChange={(e) => setPercent(e.target.value)} style={{ marginTop: 14 }} aria-label="Commission rate" />
          {changed && !error && <div className="callout callout-warning" style={{ marginTop: 14 }}><TriangleAlert size={16} /><div>Changes from <strong>{initial}%</strong> to <strong>{value}%</strong>. It applies to new orders only.</div></div>}
        </Card>
        <Card title="What a vendor gets" subtitle="Try an order value">
          <Field label="Products subtotal">{(id) => <Input id={id} type="number" min="0" prefix="Rs." value={sample} onChange={(e) => setSample(e.target.value)} />}</Field>
          <div className="totals" style={{ marginTop: 10 }}>
            <div><span>Products subtotal</span><span>{money(subtotal)}</span></div>
            <div><span>Fauran commission ({value}%)</span><span className="neg">− {money(fee)}</span></div>
            <div className="grand"><span>Vendor payout</span><span>{money(subtotal - fee)}</span></div>
          </div>
        </Card>
      </div>
      <SaveBar dirty={changed} blocked={!!error} saving={saving} onSave={save} onReset={() => setPercent(initial)} />
    </div>
  );
}

export default function Settings() {
  const [section, setSection] = useQueryState('section', 'general');
  const { data, loading, error, reload } = useApi(() => settingsApi.get(), []);
  // Remount the section after a save so its form starts from the saved values.
  const key = JSON.stringify(data);

  return (
    <>
      <PageHeader title="Settings" description="Platform-wide rules. Changes apply to new orders; orders already in progress keep the old values." />
      <div className="settings-layout">
        <nav className="settings-nav">
          {SECTIONS.map((s) => <button type="button" key={s.value} className={section === s.value ? 'is-active' : ''} onClick={() => setSection(s.value)}><s.icon size={16} />{s.label}</button>)}
        </nav>
        <div>
          {loading && !data ? <Skeleton h={420} r={16} /> : error && !data ? <Card><ErrorState error={error} onRetry={reload} /></Card> : (
            <>
              {section === 'general' && <General key={key} data={data} onSaved={reload} />}
              {section === 'radius' && <RadiusSettings key={key} radius={data.radius || {}} onSaved={reload} />}
              {section === 'commission' && <CommissionSettings key={key} commission={data.commission} onSaved={reload} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
