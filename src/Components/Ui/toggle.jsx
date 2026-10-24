import { cx } from '@/utils/cx';

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label className={cx('toggle-row', disabled && 'is-disabled')}>
      {(label || description) && (
        <span className="toggle-copy">
          {label && <strong>{label}</strong>}
          {description && <small>{description}</small>}
        </span>
      )}
      <span className={cx('toggle', checked && 'is-on')}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-knob" />
      </span>
    </label>
  );
}
