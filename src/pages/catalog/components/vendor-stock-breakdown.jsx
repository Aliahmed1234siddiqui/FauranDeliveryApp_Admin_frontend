import { Boxes } from 'lucide-react';

import { EmptyState, Progress, Skeleton } from '@/components/ui';
import { money, num } from '@/utils/format';

// byVendor rows carry the store's Mongo _id as `vendorId`; it's only used for the link.
export function VendorBreakdown({ rows, onOpen }) {
  if (!rows) return <Skeleton h={300} />;
  if (!rows.length)
    return (
      <EmptyState
        icon={Boxes}
        title="No stock yet"
        description="Stores appear here once they list products."
      />
    );
  return (
    <div className="list">
      {rows.map((v) => (
        <div
          key={v.vendorId}
          className={`list-item ${onOpen ? 'is-clickable' : ''}`}
          style={{ display: 'block' }}
          onClick={onOpen ? () => onOpen(v) : undefined}
        >
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ fontSize: 13.5 }}>{v.storeName}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              {num(v.products)} products
            </span>
          </div>
          <Progress value={v.lowStock} max={v.products || 1} tone="warning" />
          <div className="row" style={{ gap: 12, marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <span>{num(v.units)} units</span>
            <span>{money(v.stockValue)}</span>
            {v.lowStock > 0 && <span style={{ color: 'var(--warning)' }}>{num(v.lowStock)} low</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
