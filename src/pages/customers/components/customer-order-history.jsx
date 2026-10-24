import { Card, Code, StatusBadge } from '@/components/ui';
import { Link, paths, useRouter } from '@/router';
import { money, timeAgo } from '@/utils/format';

export function OrderHistory({ orders, customerId }) {
  const { navigate } = useRouter();
  return (
    <Card
      title="Recent orders"
      className="card-flush"
      action={
        orders.length > 0 && (
          <Link to={paths.orders({ customerId })} className="link-btn">
            View all
          </Link>
        )
      }
    >
      <div className="table-scroll" style={{ marginTop: 12 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Store</th>
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
              <tr key={o._id} className="is-clickable" onClick={() => navigate(paths.order(o.orderId))}>
                <td>
                  <Code>{o.orderId}</Code>
                </td>
                <td className="cell-strong">{o.vendor?.storeName || '—'}</td>
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
