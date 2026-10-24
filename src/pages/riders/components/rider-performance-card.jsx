import { Star } from 'lucide-react';

import { Card, KeyValue, Progress } from '@/components/ui';
import { money, num, pct } from '@/utils/format';

export function PerformanceCard({ stats }) {
  const successRate = stats.totalAssigned ? (stats.deliveries / stats.totalAssigned) * 100 : 0;
  return (
    <Card title="Delivery performance" subtitle="Lifetime">
      <div className="mini-stats">
        <div className="mini-stat">
          <span>Deliveries</span>
          <strong>{num(stats.deliveries)}</strong>
        </div>
        <div className="mini-stat">
          <span>Rating</span>
          <strong className="row" style={{ gap: 4 }}>
            {stats.totalRatings ? stats.rating : '—'}{' '}
            {stats.totalRatings > 0 && <Star size={15} fill="var(--accent)" color="var(--accent)" />}
          </strong>
        </div>
        <div className="mini-stat">
          <span>Earnings</span>
          <strong>{money(stats.totalEarnings)}</strong>
        </div>
        <div className="mini-stat">
          <span>Avg. delivery</span>
          <strong>{stats.avgDeliveryMinutes ? `${Math.round(stats.avgDeliveryMinutes)} min` : '—'}</strong>
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <KeyValue
          items={[
            ['Assigned orders', num(stats.totalAssigned)],
            ['Cancelled', num(stats.cancelled)],
            ['Failed deliveries', num(stats.failedDeliveries)],
            ['COD collected', money(stats.cashCollected)],
          ]}
        />
      </div>
      {stats.totalAssigned > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span className="text-2">
              Delivered ({num(stats.deliveries)} of {num(stats.totalAssigned)} assigned)
            </span>
            <strong>{pct(successRate)}</strong>
          </div>
          <Progress value={successRate} tone={successRate > 90 ? 'success' : 'warning'} />
        </div>
      )}
    </Card>
  );
}
