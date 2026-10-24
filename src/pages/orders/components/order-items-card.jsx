import { Package } from 'lucide-react';

import { Badge, Card } from '@/components/ui';
import { money } from '@/utils/format';

export function ItemsCard({ order: o }) {
  const count = o.items.length;
  return (
    <Card
      title="Items"
      subtitle={`${count} product${count === 1 ? '' : 's'} from ${o.vendor?.storeName || 'the store'}`}
    >
      <div className="line-items">
        {o.items.map((it, i) => {
          const image = it.product?.images?.[0];
          return (
            <div className="line-item" key={`${it.product?.productId || it.product}-${i}`}>
              <span className="line-item-icon" style={image ? { overflow: 'hidden' } : undefined}>
                {image ? (
                  <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Package size={18} />
                )}
              </span>
              <div>
                <strong>{it.name || it.product?.name}</strong>
                <small>
                  {it.quantity} × {money(it.price)}
                  {it.product?.productId && <> · {it.product.productId}</>}
                </small>
              </div>
              <b>{money(it.quantity * it.price)}</b>
            </div>
          );
        })}
      </div>
      <div className="totals">
        <div>
          <span>Subtotal</span>
          <span>{money(o.subtotal)}</span>
        </div>
        <div>
          <span>Delivery fee</span>
          <span>{o.deliveryFee ? money(o.deliveryFee) : <Badge tone="success">Free</Badge>}</span>
        </div>
        <div className="grand">
          <span>Total</span>
          <span>{money(o.totalAmount)}</span>
        </div>
        <div style={{ fontSize: 12.5 }}>
          <span className="muted">Fauran Mart commission</span>
          <span className="muted">{money(o.platformCommission)}</span>
        </div>
        <div style={{ fontSize: 12.5 }}>
          <span className="muted">Vendor payout</span>
          <span className="muted">{money(o.vendorPayout)}</span>
        </div>
      </div>
    </Card>
  );
}
