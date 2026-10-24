import { Loader2 } from 'lucide-react';

import { cx } from '@/utils/cx';

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading,
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cx('btn', `btn-${variant}`, `btn-${size}`, !children && 'btn-icon-only', className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="spin" />
      ) : (
        Icon && <Icon size={size === 'sm' ? 14 : 16} />
      )}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}
