import { Star } from 'lucide-react';

import { Card, KeyValue, Progress, StatusBadge } from '@/components/ui';
import { statusLabel } from '@/constants/status';
import { compactMoney, money, num, pct } from '@/utils/format';

export function PerformanceCard({ stats, rating, totalRatings }) {
  const deliveredShare = stats.totalOrders ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0;
  const byStatus = Object.entries(stats.ordersByStatus || {}).filter(([, n]) => n > 0);
  return (
    <Card title="Performance" subtitle="Lifetime">
      <div className="mini-stats">
        <div className="mini-stat">
          <span>Orders</span>
          <strong>{num(stats.totalOrders)}</strong>
        </div>
        <div className="mini-stat">
          <span>Gross sales</span>
          <strong>{compactMoney(stats.totalSales)}</strong>
        </div>
        <div className="mini-stat">
          <span>Rating</span>
          <strong className="row" style={{ gap: 4 }}>
            {totalRatings ? rating : '—'}{' '}
            {totalRatings > 0 && <Star size={15} fill="var(--accent)" color="var(--accent)" />}
          </strong>
        </div>
        <div className="mini-stat">
          <span>Cancelled</span>
          <strong>{num(stats.cancelledOrders)}</strong>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <KeyValue
          items={[
            ['Platform commission', money(stats.platformCommission)],
            ['Vendor payout', money(stats.vendorPayout)],
          ]}
        />
      </div>
      {stats.totalOrders > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span className="text-2">
              Delivered ({num(stats.deliveredOrders)} of {num(stats.totalOrders)})
            </span>
            <strong>{pct(deliveredShare)}</strong>
          </div>
          <Progress value={deliveredShare} tone={deliveredShare > 90 ? 'success' : 'warning'} />
        </div>
      )}
      {byStatus.length > 0 && (
        <div className="row row-wrap" style={{ marginTop: 16, gap: 6 }}>
          {byStatus.map(([status, n]) => (
            <StatusBadge key={status} status={status} label={`${statusLabel(status)} · ${num(n)}`} />
          ))}
        </div>
      )}
    </Card>
  );
}
