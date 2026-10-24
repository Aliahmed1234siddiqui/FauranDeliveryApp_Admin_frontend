import { useId } from 'react';

import { cx } from '@/utils/cx';

export function Field({ label, hint, error, children, required, className }) {
  const id = useId();
  return (
    <div className={cx('field', error && 'has-error', className)}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {typeof children === 'function' ? children(id) : children}
      {error ? <p className="field-error">{error}</p> : hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
