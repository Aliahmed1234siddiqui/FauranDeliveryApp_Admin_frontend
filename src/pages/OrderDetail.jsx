import { useState } from 'react';
import { Ban, Bike, Check, CheckCheck, Circle, Clock, CreditCard, MapPin, Package, Phone, Printer, RotateCcw, Store, User, X } from 'lucide-react';
import { useAction, useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { adminApi } from '../services/adminApi';
import { dateTime, money, time } from '../lib/format';
import { Badge, Button, Card, ErrorState, Identity, KeyValue, StatusBadge } from '../ui/primitives';
import { statusLabel } from '../ui/status';
import { ConfirmDialog } from '../ui/overlays';
import { BackLink, DetailSkeleton } from './shared';

const FLOW = ['placed', 'accepted', 'preparing', 'ready', 'rider_assigned', 'picked_up', 'on_the_way', 'delivered'];
const CLOSED = ['delivered', 'cancelled', 'returned', 'return_requested'];

export default function OrderDetail({ params }) {
  const { navigate } = useRouter();
  const { data: o, loading, error, reload, setData } = useApi(() => adminApi.getOrderById(params.id), [params.id]);
  const [dialog, setDialog] = useState(null);
  const [run, pending] = useAction();

  if (loading && !o) return <DetailSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const cancel = (reason) => run(() => adminApi.cancelOrder(o._id, reason), { success: 'Order cancelled and parties notified' }).then((u) => { setData(u); setDialog(null); }).catch(() => {});
  const confirmReturn = (note) => run(() => adminApi.confirmReturn(o._id, note), { success: 'Return confirmed, refund issued' }).then((u) => { setData(u); setDialog(null); }).catch(() => {});

  const reached = new Set(o.timeline.map((t) => t.status));
  const steps = o.status === 'cancelled'
    ? o.timeline
    : [...FLOW.map((s) => o.timeline.find((t) => t.status === s) || { status: s, pending: true }), ...o.timeline.filter((t) => !FLOW.includes(t.status))];

  return (
    <>
      <BackLink to="/orders">All orders</BackLink>
      <div className="page-header">
        <div className="page-header-copy">
          <div className="row row-wrap"><h1 style={{ fontFamily: 'var(--mono)', fontSize: 22, letterSpacing: 0 }}>{o.orderId}</h1><StatusBadge status={o.status} /></div>
          <div className="page-header-meta">
            <span><Clock size={14} /> Placed {dateTime(o.createdAt)}</span>
            <span><CreditCard size={14} /> {o.paymentMethod.toUpperCase()} · <StatusBadge status={o.paymentStatus} /></span>
          </div>
        </div>
        <div className="page-header-actions">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          {o.status === 'return_requested' && <Button icon={RotateCcw} onClick={() => setDialog('return')}>Confirm return</Button>}
          {!CLOSED.includes(o.status) && <Button variant="danger-soft" icon={Ban} onClick={() => setDialog('cancel')}>Cancel order</Button>}
        </div>
      </div>

      {o.status === 'return_requested' && (
        <div className="callout callout-warning mb">
          <RotateCcw size={16} />
          <div><strong>The customer asked to return this order.</strong> {o.timeline.find((t) => t.status === 'return_requested')?.note}. Confirming will mark it returned and refund {money(o.total)}.</div>
        </div>
      )}

      <div className="grid grid-side">
        <div className="stack">
          <Card title="Items" subtitle={`${o.items.length} product${o.items.length > 1 ? 's' : ''} from ${o.vendor.storeName}`}>
            <div className="line-items">
              {o.items.map((it, i) => (
                <div className="line-item" key={`${it.productId}-${i}`}>
                  <span className="line-item-icon">{it.icon || <Package size={18} />}</span>
                  <div><strong>{it.name}</strong><small>{it.qty} × {money(it.price)}</small></div>
                  <b>{money(it.qty * it.price)}</b>
                </div>
              ))}
            </div>
            <div className="totals">
              <div><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
              <div><span>Delivery fee</span><span>{o.deliveryFee ? money(o.deliveryFee) : <Badge tone="success">Free</Badge>}</span></div>
              {o.discount > 0 && <div><span>Discount</span><span className="pos">− {money(o.discount)}</span></div>}
              <div className="grand"><span>Total</span><span>{money(o.total)}</span></div>
              {o.commission > 0 && <div style={{ fontSize: 12.5 }}><span className="muted">Fauran commission</span><span className="muted">{money(o.commission)}</span></div>}
            </div>
          </Card>

          <Card title="Order timeline">
            <ul className="timeline">
              {steps.map((t, i) => {
                const cls = t.pending ? 'is-pending' : t.status === 'cancelled' ? 'is-danger' : t.status.startsWith('return') ? 'is-warning' : '';
                const Icon = t.pending ? Circle : t.status === 'cancelled' ? X : t.status === 'delivered' ? CheckCheck : Check;
                return (
                  <li key={`${t.status}-${i}`} className={cls}>
                    <span className="timeline-dot"><Icon size={11} strokeWidth={3} /></span>
                    <strong>{statusLabel(t.status)}</strong>
                    <small>{t.pending ? (reached.has('cancelled') ? 'Skipped' : 'Waiting') : time(t.at)}</small>
                    {t.note && <p>{t.note}</p>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <div className="stack">
          <Card title="Customer" action={<Button size="sm" variant="ghost" onClick={() => navigate(`/customers/${o.customer.customerId}`)}>Profile</Button>}>
            <Identity name={o.customer.name} sub={o.customer.customerId} />
            <div style={{ marginTop: 14 }}>
              <KeyValue columns={1} items={[['Phone', <span key="p" className="row" style={{ gap: 6 }}><Phone size={13} className="muted" />{o.customer.phone}</span>], ['Delivery address', <span key="a" className="row" style={{ gap: 6 }}><MapPin size={13} className="muted" />{o.address}</span>]]} />
            </div>
          </Card>
          <Card title="Store" action={<Button size="sm" variant="ghost" onClick={() => navigate(`/vendors/${o.vendor.vendorId}`)}>Profile</Button>}>
            <Identity name={o.vendor.storeName} sub={o.vendor.vendorId} square />
          </Card>
          <Card title="Rider" action={o.rider && <Button size="sm" variant="ghost" onClick={() => navigate(`/riders/${o.rider.riderId}`)}>Profile</Button>}>
            {o.rider ? <Identity name={o.rider.name} sub={`${o.rider.riderId} · ${o.rider.phone}`} /> : <div className="row muted"><Bike size={16} /> No rider assigned yet</div>}
          </Card>
          <Card title="Payment">
            <KeyValue columns={1} items={[['Method', o.paymentMethod === 'cod' ? 'Cash on delivery' : o.paymentMethod === 'card' ? 'Card' : 'Wallet'], ['Status', <StatusBadge key="s" status={o.paymentStatus} />], ['Amount', money(o.total)]]} />
          </Card>
          <div className="row muted" style={{ fontSize: 12, gap: 6 }}><Store size={13} /><User size={13} /> Status changes come from the vendor and rider apps. Admins can cancel or confirm returns.</div>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onConfirm={cancel}
        loading={pending}
        title="Cancel this order?"
        description={`The customer, store and rider will be notified. ${o.paymentMethod === 'cod' ? 'No payment was collected.' : `${money(o.total)} will be refunded.`}`}
        confirmLabel="Cancel order"
        reason
        reasonRequired
        reasonLabel="Cancellation reason"
        reasonPlaceholder="e.g. Store out of stock on key items"
      />
      <ConfirmDialog
        open={dialog === 'return'}
        onClose={() => setDialog(null)}
        onConfirm={confirmReturn}
        loading={pending}
        tone="brand"
        icon={RotateCcw}
        title="Confirm the return?"
        description={`The order will be marked returned and ${money(o.total)} refunded to the customer.`}
        confirmLabel="Confirm return"
        reason
        reasonLabel="Note (optional)"
        reasonPlaceholder="e.g. Rider collected the damaged item"
      />
    </>
  );
}
