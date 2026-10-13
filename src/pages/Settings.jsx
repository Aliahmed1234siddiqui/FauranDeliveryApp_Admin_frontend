import { useState } from 'react';
import { Building2, Info, Percent, Radar, Save, Store, TriangleAlert } from 'lucide-react';
import { useQueryState } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { adminApi } from '../services/adminApi';
import { money, timeAgo } from '../lib/format';
import { Button, Card, Field, Input, PageHeader, Skeleton, Toggle } from '../ui/primitives';

const SECTIONS = [
  { value: 'general', label: 'General', icon: Building2 },
  { value: 'radius', label: 'Delivery radius', icon: Radar },
  { value: 'commission', label: 'Commission', icon: Percent },
];

function SaveBar({ dirty, saving, onSave, onReset }) {
  if (!dirty) return null;
  return (
    <div className="save-bar">
      <span>You have unsaved changes</span>
      <span className="spacer" />
      <Button variant="ghost" size="sm" onClick={onReset}>Discard</Button>
      <Button variant="accent" size="sm" icon={Save} loading={saving} onClick={onSave}>Save changes</Button>
    </div>
  );
}

// PUT /admin/settings/general
function General({ initial, onSaved }) {
  const [form, setForm] = useState(initial);
  const [run, saving] = useAction();
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (k, numeric) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? (numeric ? Number(e.target.value) : e.target.value) : e }));
  const save = () => run(() => adminApi.updateGeneralSettings(form), { success: 'General settings saved' }).then(onSaved).catch(() => {});

  return (
    <div className="stack">
      <Card title="Platform" subtitle="Shown to customers, vendors and riders">
        <div className="form-grid">
          <Field label="Platform name">{(id) => <Input id={id} value={form.platformName} onChange={set('platformName')} />}</Field>
          <Field label="Currency">{(id) => <select id={id} className="input" value={form.currency} onChange={set('currency')}><option value="PKR">PKR - Pakistani rupee</option></select>}</Field>
          <Field label="Support email">{(id) => <Input id={id} type="email" value={form.supportEmail} onChange={set('supportEmail')} />}</Field>
          <Field label="Support phone">{(id) => <Input id={id} value={form.supportPhone} onChange={set('supportPhone')} />}</Field>
        </div>
      </Card>
      <Card title="Orders & delivery" subtitle="Rules applied at checkout">
        <div className="form-grid">
          <Field label="Base delivery fee" hint="Charged below the free-delivery threshold">{(id) => <Input id={id} type="number" prefix="Rs." value={form.baseDeliveryFee} onChange={set('baseDeliveryFee', true)} />}</Field>
          <Field label="Free delivery above" hint={`Orders over ${money(form.freeDeliveryThreshold)} ship free`}>{(id) => <Input id={id} type="number" prefix="Rs." value={form.freeDeliveryThreshold} onChange={set('freeDeliveryThreshold', true)} />}</Field>
          <Field label="Minimum order value">{(id) => <Input id={id} type="number" prefix="Rs." value={form.minOrderValue} onChange={set('minOrderValue', true)} />}</Field>
          <Field label="COD limit per order" hint="Larger orders must be prepaid">{(id) => <Input id={id} type="number" prefix="Rs." value={form.codLimit} onChange={set('codLimit', true)} />}</Field>
          <Field label="Auto-cancel unaccepted orders after">{(id) => <Input id={id} type="number" suffix="minutes" value={form.autoCancelMinutes} onChange={set('autoCancelMinutes', true)} />}</Field>
          <Field label="Return window">{(id) => <Input id={id} type="number" suffix="hours" value={form.returnWindowHours} onChange={set('returnWindowHours', true)} />}</Field>
        </div>
      </Card>
      <Card title="Availability">
        <div className="stack" style={{ gap: 18 }}>
          <Toggle label="Accepting orders" description="Turn off to pause checkout everywhere, e.g. during a city-wide shutdown." checked={form.acceptingOrders} onChange={set('acceptingOrders')} />
          <hr />
          <Toggle label="Maintenance mode" description="Shows a maintenance screen in all apps. Admin portal stays available." checked={form.maintenanceMode} onChange={set('maintenanceMode')} />
          {form.maintenanceMode && <div className="callout callout-warning"><TriangleAlert size={16} /><div><strong>All customer, vendor and rider apps will go offline</strong> as soon as you save.</div></div>}
        </div>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setForm(initial)} />
    </div>
  );
}

// PUT /admin/settings/radius  { initialKm, stepKm, maxKm, timeoutSec }
function RadiusSettings({ initial, onSaved }) {
  const [form, setForm] = useState(initial);
  const [run, saving] = useAction();
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const error = form.initialKm > form.maxKm ? 'Starting radius cannot be larger than the maximum' : form.stepKm <= 0 ? 'Step must be above zero' : '';
  const save = () => run(() => adminApi.updateRadiusSettings(form), { success: 'Delivery radius saved' }).then(onSaved).catch(() => {});
  const rings = [];
  for (let r = form.initialKm; r < form.maxKm && rings.length < 8 && form.stepKm > 0; r += form.stepKm) rings.push(+r.toFixed(1));
  const totalWait = (rings.length + 1) * form.timeoutSec;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: Number(e.target.value) }));

  return (
    <div className="stack">
      <div className="grid grid-2">
        <Card title="Rider & store search radius" subtitle="How far Fauran looks when matching an order">
          <div className="stack">
            {[
              ['initialKm', 'Starting radius', 0.5, 10, 0.5, 'km', 'First search ring around the customer'],
              ['stepKm', 'Expand by', 0.5, 5, 0.5, 'km', 'Added each time nobody accepts'],
              ['maxKm', 'Maximum radius', 1, 20, 0.5, 'km', 'Search stops here'],
              ['timeoutSec', 'Wait per ring', 10, 180, 5, 'sec', 'Time before expanding'],
            ].map(([key, label, min, max, step, unit, hint]) => (
              <Field key={key} label={<span className="row" style={{ justifyContent: 'space-between', width: '100%' }}>{label}<strong style={{ color: 'var(--brand)' }}>{form[key]} {unit}</strong></span>} hint={hint}>
                <input type="range" min={min} max={max} step={step} value={form[key]} onChange={set(key)} aria-label={label} />
              </Field>
            ))}
            {error && <div className="callout callout-danger"><TriangleAlert size={16} />{error}</div>}
          </div>
        </Card>
        <Card title="Preview" subtitle={`${rings.length + 1} search steps · up to ${Math.round(totalWait / 60 * 10) / 10} min before giving up`}>
          <div className="radius-viz">
            <div className="radius-ring is-max" style={{ width: '100%', height: '100%' }}><span>{form.maxKm} km max</span></div>
            {rings.map((r) => (
              <div key={r} className="radius-ring" style={{ width: `${(r / form.maxKm) * 100}%`, height: `${(r / form.maxKm) * 100}%` }}>{r === rings[0] && <span>{r} km</span>}</div>
            ))}
            <span className="radius-center"><Store size={16} /></span>
          </div>
          <div className="callout callout-info" style={{ marginTop: 18 }}><Info size={16} /><div>Search starts at <strong>{form.initialKm} km</strong>, grows by <strong>{form.stepKm} km</strong> every <strong>{form.timeoutSec}s</strong>, and stops at <strong>{form.maxKm} km</strong>.</div></div>
        </Card>
      </div>
      <SaveBar dirty={dirty && !error} saving={saving} onSave={save} onReset={() => setForm(initial)} />
    </div>
  );
}

// PUT /admin/settings/commission  { percent }
function CommissionSettings({ initial, onSaved }) {
  const [percent, setPercent] = useState(initial.percent);
  const [sample, setSample] = useState(2500);
  const [run, saving] = useAction();
  const valid = percent >= 0 && percent <= 50;
  const save = () => run(() => adminApi.updateCommissionSettings(Number(percent)), { success: `Commission set to ${percent}%` }).then(onSaved).catch(() => {});
  const fee = Math.round((sample * percent) / 100);

  return (
    <div className="stack">
      <div className="grid grid-2">
        <Card title="Platform commission" subtitle="Charged on every order from a partner kiryana store">
          <Field label="Commission rate" error={!valid ? 'Use a value between 0% and 50%' : undefined} hint="Dark stores are owned by Fauran and never pay commission.">
            {(id) => <Input id={id} type="number" min="0" max="50" step="0.5" suffix="%" value={percent} onChange={(e) => setPercent(e.target.value === '' ? '' : Number(e.target.value))} />}
          </Field>
          <input type="range" min="0" max="30" step="0.5" value={percent || 0} onChange={(e) => setPercent(Number(e.target.value))} style={{ marginTop: 14 }} aria-label="Commission rate" />
          {percent !== initial.percent && valid && <div className="callout callout-warning" style={{ marginTop: 14 }}><TriangleAlert size={16} /><div>Changes from <strong>{initial.percent}%</strong> to <strong>{percent}%</strong>. It applies to new orders only. Partner stores are notified by email.</div></div>}
        </Card>
        <Card title="What a vendor sees" subtitle="Try an order value">
          <Field label="Order subtotal">{(id) => <Input id={id} type="number" prefix="Rs." value={sample} onChange={(e) => setSample(Number(e.target.value))} />}</Field>
          <div className="totals" style={{ marginTop: 10 }}>
            <div><span>Order subtotal</span><span>{money(sample)}</span></div>
            <div><span>Fauran commission ({percent || 0}%)</span><span className="neg">− {money(fee)}</span></div>
            <div className="grand"><span>Vendor receives</span><span>{money(sample - fee)}</span></div>
          </div>
        </Card>
      </div>
      <SaveBar dirty={percent !== initial.percent && valid} saving={saving} onSave={save} onReset={() => setPercent(initial.percent)} />
    </div>
  );
}

export default function Settings() {
  const [section, setSection] = useQueryState('section', 'general');
  const { data, loading, reload } = useApi(() => adminApi.getSettings(), []);

  return (
    <>
      <PageHeader title="Settings" description="Platform-wide rules. Changes apply immediately across every app." meta={data && <span>Last changed {timeAgo(data.updatedAt)}</span>} />
      <div className="settings-layout">
        <nav className="settings-nav">
          {SECTIONS.map((s) => <button type="button" key={s.value} className={section === s.value ? 'is-active' : ''} onClick={() => setSection(s.value)}><s.icon size={16} />{s.label}</button>)}
        </nav>
        <div>
          {loading && !data ? <Skeleton h={420} r={16} /> : (
            <>
              {section === 'general' && <General key={data.updatedAt} initial={data.general} onSaved={reload} />}
              {section === 'radius' && <RadiusSettings key={data.updatedAt} initial={data.radius} onSaved={reload} />}
              {section === 'commission' && <CommissionSettings key={data.updatedAt} initial={data.commission} onSaved={reload} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}
