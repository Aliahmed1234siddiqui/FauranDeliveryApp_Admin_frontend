import { Lock } from 'lucide-react';

import { Button } from '@/components/ui';
import { titleCase } from '@/utils/format';

const PRESETS = [
  { label: 'Operations', perms: ['dashboard', 'vendors', 'riders', 'orders', 'customers'] },
  { label: 'Support', perms: ['orders', 'customers'] },
  { label: 'Finance', perms: ['dashboard', 'payments', 'reports'] },
  { label: 'Catalog', perms: ['products', 'catalog', 'inventory'] },
];

// Checkbox grid from GET /admin/permissions. You can only grant permissions you have yourself.
export function PermissionPicker({ permissions, value, onChange, canGrant, locked, error }) {
  const grantable = permissions.filter((p) => canGrant(p.key)).map((p) => p.key);
  const toggle = (key) => onChange(value.includes(key) ? value.filter((p) => p !== key) : [...value, key]);
  return (
    <div className="form-section">
      <div className="row row-wrap" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="form-section-title">Page access</div>
          <p className="form-section-desc" style={{ marginBottom: 0 }}>
            {locked
              ? "You can't change your own permissions. Ask another admin."
              : `${value.length} of ${permissions.length} permissions · you can only grant ones you have`}
          </p>
        </div>
        {!locked && (
          <div className="row" style={{ gap: 4 }}>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => onChange([...new Set([...value.filter((k) => !canGrant(k)), ...grantable])])}
            >
              All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => onChange(value.filter((k) => !canGrant(k)))}
            >
              None
            </Button>
          </div>
        )}
      </div>
      {!locked && (
        <div className="row row-wrap" style={{ gap: 6, margin: '12px 0' }}>
          <span className="muted" style={{ fontSize: 12.5 }}>
            Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.label}
              className="chip chip-add"
              onClick={() => onChange(p.perms.filter((k) => grantable.includes(k)))}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="field-error" style={{ marginBottom: 10 }}>
          {error}
        </p>
      )}
      <div className="perm-grid" style={locked ? { marginTop: 12 } : undefined}>
        {permissions.map((p) => {
          const on = value.includes(p.key);
          const disabled = locked || !canGrant(p.key);
          return (
            <label
              key={p.key}
              className={`perm ${on ? 'is-on' : ''}`}
              style={disabled ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
              title={
                !locked && disabled ? "You don't have this permission, so you can't grant it" : undefined
              }
            >
              <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(p.key)} />
              <div>
                <strong>{titleCase(p.key)}</strong>
                <small>{p.description}</small>
              </div>
              {!locked && disabled && (
                <Lock size={14} className="muted" style={{ flex: 'none', marginLeft: 'auto' }} />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
