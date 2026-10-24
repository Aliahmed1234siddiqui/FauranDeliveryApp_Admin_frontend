import { Boxes, CircleAlert, PackageX, TriangleAlert, Wallet } from 'lucide-react';

import { Skeleton, StatCard } from '@/components/ui';
import { compactMoney, num } from '@/utils/format';

export function Summary({ data, onPending }) {
  if (!data)
    return (
      <div className="stat-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="stat-card" key={i}>
            <Skeleton h={96} />
          </div>
        ))}
      </div>
    );
  const s = data.summary || {};
  return (
    <div className="stat-grid">
      <StatCard
        icon={Boxes}
        label="Products"
        value={num(s.totalProducts)}
        footer={`${num(s.activeProducts)} visible · ${num(s.totalUnits)} units`}
      />
      <StatCard
        icon={CircleAlert}
        tone="blue"
        label="Waiting for approval"
        value={num(s.pendingApproval)}
        footer="Not visible to customers yet"
        onClick={onPending}
      />
      <StatCard
        icon={TriangleAlert}
        tone="amber"
        label="Low stock"
        value={num(s.lowStock)}
        footer={`At or below ${num(data.threshold)} units`}
      />
      <StatCard
        icon={PackageX}
        tone="rose"
        label="Out of stock"
        value={num(s.outOfStock)}
        footer="Customers can't order these"
      />
      <StatCard
        icon={Wallet}
        tone="violet"
        label="Stock value"
        value={compactMoney(s.stockValue)}
        footer="Units on hand at their price"
      />
    </div>
  );
}
