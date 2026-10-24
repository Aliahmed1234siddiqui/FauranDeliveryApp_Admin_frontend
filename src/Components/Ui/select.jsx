import { ChevronDown } from 'lucide-react';

import { cx } from '@/utils/cx';

export function Select({ value, onChange, options, className, label, ...props }) {
  return (
    <label className={cx('select', className)}>
      {label && <span className="select-label">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)} {...props}>
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o} value={o}>
              {o}
            </option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
      <ChevronDown size={15} />
    </label>
  );
}
