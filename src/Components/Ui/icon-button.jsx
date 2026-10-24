import { cx } from '@/utils/cx';

export function IconButton({ icon: Icon, label, tone, className, size = 17, ...props }) {
  return (
    <button
      type="button"
      className={cx('icon-btn', tone && `icon-btn-${tone}`, className)}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={size} />
    </button>
  );
}
