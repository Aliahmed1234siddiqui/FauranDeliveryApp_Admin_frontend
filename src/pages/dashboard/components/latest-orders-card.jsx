import { ArrowRight } from 'lucide-react';

import { Button, Card, EmptyState, Identity, Skeleton, StatusBadge } from '@/components/ui';
import { PAYMENT_METHODS } from '@/constants';
import { paths, useRouter } from '@/router';
import { money, timeAgo } from '@/utils/format';

const SKELETON_ROWS = 5;

export function LatestOrdersCard({ summary: s, failed }) {
  const { navigate } = useRouter();
  return (
    <Card
      title="Latest orders"
      subtitle="Most recent activity across the marketplace"
      action={
        <Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => navigate(paths.orders())}>
          View all
        </Button>
      }
      className="table-card card-flush"
    >
      <div className="table-scroll" style={{ marginTop: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th className="hide-sm">Store</th>
              <th>Total</th>
              <th>Status</th>
              <th className="hide-sm">Placed</th>
            </tr>
          </thead>
          <tbody>
            {(s?.recentOrders || []).map((o) => (
              <tr key={o._id} className="is-clickable" onClick={() => navigate(paths.order(o.orderId))}>
                <td>
                  <span className="mono-chip">{o.orderId}</span>
                </td>
                <td>
                  <Identity
                    name={o.customer?.name || '—'}
                    sub={PAYMENT_METHODS[o.paymentMethod] || o.paymentMethod}
                  />
                </td>
                <td className="hide-sm">{o.vendor?.storeName || '—'}</td>
                <td className="cell-strong">{money(o.totalAmount)}</td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="hide-sm">{timeAgo(o.createdAt)}</td>
              </tr>
            ))}
            {s && !s.recentOrders?.length && (
              <tr>
                <td colSpan={6}>
                  <EmptyState title="No orders yet" />
                </td>
              </tr>
            )}
            {!s &&
              !failed &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6}>
                    <Skeleton />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
