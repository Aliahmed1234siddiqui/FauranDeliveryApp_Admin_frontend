import { Button, Card, StatusBadge } from '@/components/ui';
import { money, num } from '@/utils/format';

const productStatus = (p) => (!p.isApproved ? 'pending' : p.isActive ? 'active' : 'inactive');

export function ProductsCard({ products, total, onOpen, onAll }) {
  return (
    <Card
      title="Products"
      subtitle={`${num(total)} listed`}
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
              <th>Product</th>
              <th>Price</th>
              <th className="hide-sm">Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                  No products yet
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p._id} className="is-clickable" onClick={() => onOpen(p)}>
                <td>
                  <span className="cell-strong">{p.name}</span>
                  <span className="cell-sub">{p.productId}</span>
                </td>
                <td>
                  {p.discountPrice ? (
                    <>
                      {money(p.discountPrice)} <s className="muted">{money(p.price)}</s>
                    </>
                  ) : (
                    money(p.price)
                  )}
                </td>
                <td className="hide-sm">
                  {num(p.stock)} {p.unit}
                </td>
                <td>
                  <StatusBadge status={productStatus(p)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
