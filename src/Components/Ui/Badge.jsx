import { cx } from '@/utils/cx';

export function Badge({ tone = 'neutral', dot, icon: Icon, children, className }) {
  return (
    <span className={cx('badge', `badge-${tone}`, className)}>
      {dot && <span className="badge-dot" />}
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}
