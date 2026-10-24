import { Field, Input } from '@/components/ui';

export function NumberField({ label, hint, error, value, onChange, suffix, step = 1, min, max }) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id) => (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          suffix={suffix}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}
