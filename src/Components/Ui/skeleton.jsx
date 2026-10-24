import { cx } from '@/utils/cx';

export function Skeleton({ w = '100%', h = 14, r = 6, className }) {
  return <span className={cx('skeleton', className)} style={{ width: w, height: h, borderRadius: r }} />;
}
