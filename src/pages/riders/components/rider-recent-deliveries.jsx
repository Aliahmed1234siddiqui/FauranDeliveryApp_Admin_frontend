import { Badge, Card, Code, StatusBadge } from '@/components/ui';
import { timeAgo } from '@/utils/format';

export function RecentDeliveries({ orders, onOpen }) {
  return (
    <Card title="Recent deliveries" className="card-flush">
      <div className="table-scroll" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Store</th>
              <th className="hide-sm">Customer</th>
              <th>Payment</th>
              <th>Status</th>
              <th className="hide-sm">When</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                  No deliveries yet
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o._id} className="is-clickable" onClick={() => onOpen(o)}>
                <td>
                  <Code>{o.orderId}</Code>
                </td>
                <td className="cell-strong">{o.vendor?.storeName || '—'}</td>
                <td className="hide-sm">{o.customer?.name || '—'}</td>
                <td>
                  <Badge tone={o.paymentMethod === 'cod' ? 'warning' : 'neutral'}>
                    {o.paymentMethod === 'cod' ? 'COD' : 'Card'}
                  </Badge>
                </td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td className="hide-sm">{timeAgo(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
