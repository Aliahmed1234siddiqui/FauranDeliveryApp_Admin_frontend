import { useState } from 'react';
import { Info, Store, TriangleAlert } from 'lucide-react';

import { Card } from '@/components/ui';
import { useAction } from '@/hooks';
import { settingsApi } from '@/services/api';

import { isDirty, toStrings, validateNumbers } from '../settings-utils';
import { NumberField } from './number-field';
import { SaveBar } from './save-bar';

function validateRadius(form) {
  const errors = validateNumbers(form, {
    initialKm: { min: 0.5 },
    stepKm: { min: 0.5 },
    maxKm: { max: 50 },
    timeoutSec: { min: 10, max: 600 },
  });
  if (!errors.maxKm && !errors.initialKm && Number(form.maxKm) < Number(form.initialKm))
    errors.maxKm = 'Must be at least the starting radius';
  return errors;
}

// Preview rings for the search radius (only drawn when the values are valid).
function RadiusPreview({ initialKm, stepKm, maxKm, timeoutSec }) {
  const rings = [];
  for (let r = initialKm; r < maxKm && rings.length < 8; r += stepKm) rings.push(+r.toFixed(1));
  const totalWait = (rings.length + 1) * timeoutSec;
  return (
    <Card
      title="Preview"
      subtitle={`${rings.length + 1} search steps · up to ${Math.round((totalWait / 60) * 10) / 10} min before giving up`}
    >
      <div className="radius-viz">
        <div className="radius-ring is-max" style={{ width: '100%', height: '100%' }}>
          <span>{maxKm} km max</span>
        </div>
        {rings.map((r) => (
          <div
            key={r}
            className="radius-ring"
            style={{ width: `${(r / maxKm) * 100}%`, height: `${(r / maxKm) * 100}%` }}
          >
            {r === rings[0] && <span>{r} km</span>}
          </div>
        ))}
        <span className="radius-center">
          <Store size={16} />
        </span>
      </div>
      <div className="callout callout-info" style={{ marginTop: 18 }}>
        <Info size={16} />
        <div>
          Search starts at <strong>{initialKm} km</strong>, grows by <strong>{stepKm} km</strong> every{' '}
          <strong>{timeoutSec}s</strong>, and stops at <strong>{maxKm} km</strong>.
        </div>
      </div>
    </Card>
  );
}

// PUT /admin/settings/radius { initialKm, stepKm, maxKm, timeoutSec }
export function RadiusSettings({ radius, onSaved }) {
  const [initial] = useState(() =>
    toStrings({
      initialKm: radius.initialKm,
      stepKm: radius.stepKm,
      maxKm: radius.maxKm,
      timeoutSec: radius.timeoutSec,
    }),
  );
  const [form, setForm] = useState(initial);
  const [run, saving] = useAction();
  const errors = validateRadius(form);
  const invalid = Object.keys(errors).length > 0;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const save = () =>
    !invalid &&
    run(() => settingsApi.updateRadius(form), { success: 'Delivery radius saved' })
      .then(onSaved)
      .catch(() => {});
  const n = (k) => Number(form[k]);

  return (
    <div className="stack">
      <div className="grid grid-2">
        <Card
          title="Rider search radius"
          subtitle="How far Fauran Mart looks for a rider when an order is ready"
        >
          <div className="stack">
            <NumberField
              label="Starting radius"
              suffix="km"
              step={0.5}
              min={0.5}
              value={form.initialKm}
              onChange={set('initialKm')}
              error={errors.initialKm}
              hint="First search ring. At least 0.5 km"
            />
            <NumberField
              label="Expand by"
              suffix="km"
              step={0.5}
              min={0.5}
              value={form.stepKm}
              onChange={set('stepKm')}
              error={errors.stepKm}
              hint="Added each time nobody accepts. At least 0.5 km"
            />
            <NumberField
              label="Maximum radius"
              suffix="km"
              step={0.5}
              max={50}
              value={form.maxKm}
              onChange={set('maxKm')}
              error={errors.maxKm}
              hint="Search stops here. Up to 50 km"
            />
            <NumberField
              label="Wait per ring"
              suffix="sec"
              min={10}
              max={600}
              value={form.timeoutSec}
              onChange={set('timeoutSec')}
              error={errors.timeoutSec}
              hint="Time before expanding. 10–600 seconds"
            />
          </div>
        </Card>
        {invalid ? (
          <Card title="Preview">
            <div className="callout callout-danger">
              <TriangleAlert size={16} />
              Fix the highlighted fields to see the preview.
            </div>
          </Card>
        ) : (
          <RadiusPreview
            initialKm={n('initialKm')}
            stepKm={n('stepKm')}
            maxKm={n('maxKm')}
            timeoutSec={n('timeoutSec')}
          />
        )}
      </div>
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
