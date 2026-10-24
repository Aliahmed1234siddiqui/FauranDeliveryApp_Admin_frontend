import { Button, Card, Code, StatusBadge } from '@/components/ui';
import { money, timeAgo } from '@/utils/format';

export function RecentOrders({ orders, onOpen, onAll }) {
  return (
    <Card
      title="Recent orders"
      padded
      className="card-flush"
      action={
        <Button variant="ghost" size="sm" onClick={onAll}>
          View all
        </Button>
      }
    >
      <div className="table-scroll" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th className="hide-sm">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                  No orders yet
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o._id} className="is-clickable" onClick={() => onOpen(o)}>
                <td>
                  <Code>{o.orderId}</Code>
                </td>
                <td className="cell-strong">{o.customer?.name || '—'}</td>
                <td>{money(o.totalAmount)}</td>
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
