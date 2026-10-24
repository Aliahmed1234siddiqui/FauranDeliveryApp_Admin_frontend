import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { cx } from '@/utils/cx';

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  tone = 'brand',
  footer,
  spark,
  onClick,
}) {
  const up = trend > 0;
  return (
    <div
      className={cx('stat-card', onClick && 'is-clickable')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-top">
        <span className={cx('stat-icon', `tone-${tone}`)}>
          <Icon size={18} />
        </span>
        {trend !== undefined && (
          <span className={cx('trend', up ? 'trend-up' : 'trend-down')}>
            {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="stat-label">{label}</p>
      <div className="stat-value">{value}</div>
      {spark}
      {(trendLabel || footer) && <div className="stat-foot">{footer || trendLabel}</div>}
    </div>
  );
}
