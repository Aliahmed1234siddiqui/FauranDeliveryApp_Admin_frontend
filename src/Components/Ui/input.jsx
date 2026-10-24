import { cx } from '@/utils/cx';

export function Input({ prefix, suffix, className, ...props }) {
  if (!prefix && !suffix) return <input className={cx('input', className)} {...props} />;
  return (
    <div className={cx('input-group', className)}>
      {prefix && <span className="input-affix">{prefix}</span>}
      <input className="input" {...props} />
      {suffix && <span className="input-affix">{suffix}</span>}
    </div>
  );
}
