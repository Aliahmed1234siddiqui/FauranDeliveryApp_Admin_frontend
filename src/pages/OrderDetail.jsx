import { useState } from 'react';
import toast from 'react-hot-toast';
import { Ban, Bike, Check, CheckCheck, Circle, Clock, CreditCard, MapPin, Package, PackageX, Phone, Printer, RotateCcw, Store, Undo2, User, X } from 'lucide-react';
import { useAction, useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { needsRefund, ordersApi } from '../services/api';
import { dateTime, money, timeAgo, titleCase } from '../lib/format';
import { CANCELLABLE_STATUSES, FAILURE_REASONS, PAYMENT_METHODS } from '../lib/constants';
import { Badge, Button, Card, Code, ErrorState, Field, Identity, KeyValue, Segmented, StatusBadge } from '../ui/primitives';
import { statusLabel } from '../ui/status';
import { ConfirmDialog, Modal } from '../ui/overlays';
import { BackLink, DetailSkeleton, RefundButton } from './shared';

const FLOW = ['placed', 'accepted', 'preparing', 'ready', 'rider_assigned', 'picked_up', 'on_the_way', 'delivered'];
// Orders that left the happy path: show only what actually happened.
const OFF_FLOW = ['cancelled', 'delivery_failed', 'returned'];

const failureLabel = (reason) => (reason ? FAILURE_REASONS[reason] || titleCase(reason) : null);
const methodLabel = (m) => PAYMENT_METHODS[m] || m;

export default function OrderDetail({ params }) {
  const { data, loading, error, reload } = useApi(() => ordersApi.get(params.id), [params.id], { key: 'order' });
  const [dialog, setDialog] = useState(null);
  const [run, pending] = useAction();

  if (loading && !data) return <DetailSkeleton />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { order: o, payments = [], deliveryMinutes } = data;
  const close = () => { setDialog(null); reload(); };

  // The server message may carry a "refund the card payment" hint, so show it as-is.
  const cancel = (reason) => run(() => ordersApi.cancel(o._id, reason || undefined))
    .then(({ message }) => { toast.success(message || 'Order cancelled'); close(); }).catch(() => {});
  const confirmReturn = (restock, note) => run(() => ordersApi.confirmReturn(o._id, { restock, note: note || undefined }), { success: restock ? 'Return confirmed, items back in stock' : 'Return confirmed, items marked damaged' })
    .then(close).catch(() => {});

  const canCancel = CANCELLABLE_STATUSES.includes(o.status);
  const refundable = needsRefund(o);
  const paidByCard = o.paymentMethod === 'stripe' && o.paymentStatus === 'paid';

  return (
    <>
      <BackLink to="/orders">All orders</BackLink>
      <div className="page-header">
        <div className="page-header-copy">
          <div className="row row-wrap"><h1 style={{ fontFamily: 'var(--mono)', fontSize: 22, letterSpacing: 0 }}>{o.orderId}</h1><StatusBadge status={o.status} /></div>
          <div className="page-header-meta">
            <span><Clock size={14} /> Placed {dateTime(o.createdAt)}</span>
            <span><CreditCard size={14} /> {methodLabel(o.paymentMethod)} · <StatusBadge status={o.paymentStatus} /></span>
            {o.trackingId && <span><Code>{o.trackingId}</Code></span>}
          </div>
        </div>
        <div className="page-header-actions">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>Print</Button>
          {refundable && <RefundButton order={o} onDone={reload} />}
          {o.status === 'delivery_failed' && <Button icon={RotateCcw} onClick={() => setDialog('return')}>Confirm return</Button>}
          {canCancel && <Button variant="danger-soft" icon={Ban} onClick={() => setDialog('cancel')}>Cancel order</Button>}
        </div>
      </div>

      {o.status === 'delivery_failed' && (
        <div className="callout callout-warning mb">
          <PackageX size={16} />
          <div>
            <strong>Delivery failed {timeAgo(o.failedAt)}{o.failureReason ? `: ${failureLabel(o.failureReason)}` : ''}.</strong>
            {o.failureNote && ` "${o.failureNote}".`} Confirm the return once the rider has brought the items back to the store.
          </div>
        </div>
      )}
      {refundable && (
        <div className="callout callout-info mb">
          <Undo2 size={16} />
          <div><strong>The card payment has not been refunded yet.</strong> Card refunds are manual. {o.refundDue > 0 ? `${money(o.refundDue)} is due (products only, delivery fee kept).` : `The customer paid ${money(o.totalAmount)}.`}</div>
        </div>
      )}

      <div className="grid grid-side">
        <div className="stack">
          <ItemsCard order={o} />
          <TimelineCard order={o} />
        </div>
        <div className="stack">
          <PartiesCards order={o} />
          <Card title="Delivery">
            <KeyValue
              columns={1}
              items={[
                ['Address', <span key="a" className="row" style={{ gap: 6 }}><MapPin size={13} className="muted" />{o.deliveryAddress?.addressLine || '—'}</span>],
                o.deliveredAt && ['Delivered', dateTime(o.deliveredAt)],
                deliveryMinutes != null && ['Delivery time', `${Math.round(deliveryMinutes)} min`],
              ]}
            />
          </Card>
          {(o.failedAt || o.returnedAt) && <FailureCard order={o} />}
          {o.status === 'cancelled' && (
            <Card title="Cancellation">
              <KeyValue columns={1} items={[['Cancelled by', o.cancelledBy ? titleCase(o.cancelledBy) : null], ['Reason', o.cancelReason || null]]} />
            </Card>
          )}
          <PaymentsCard payments={payments} />
          <div className="row muted" style={{ fontSize: 12, gap: 6 }}><Store size={13} /><User size={13} /> Status changes come from the vendor and rider apps. Admins can cancel before pickup or confirm a failed delivery's return.</div>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'cancel'}
        onClose={() => setDialog(null)}
        onConfirm={cancel}
        loading={pending}
        title="Cancel this order?"
        description={`The customer, store and rider will be notified. ${paidByCard ? `The ${money(o.totalAmount)} card payment is not refunded automatically - you can refund it right after.` : 'No card payment was taken.'}`}
        confirmLabel="Cancel order"
        reason
        reasonLabel="Reason (optional)"
        reasonPlaceholder="e.g. Store out of stock on key items"
      />
      {dialog === 'return' && <ReturnDialog order={o} loading={pending} onClose={() => setDialog(null)} onConfirm={confirmReturn} />}
    </>
  );
}

function ItemsCard({ order: o }) {
  const count = o.items.length;
  return (
    <Card title="Items" subtitle={`${count} product${count === 1 ? '' : 's'} from ${o.vendor?.storeName || 'the store'}`}>
      <div className="line-items">
        {o.items.map((it, i) => {
          const image = it.product?.images?.[0];
          return (
            <div className="line-item" key={`${it.product?.productId || it.product}-${i}`}>
              <span className="line-item-icon" style={image ? { overflow: 'hidden' } : undefined}>
                {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={18} />}
              </span>
              <div>
                <strong>{it.name || it.product?.name}</strong>
                <small>{it.quantity} × {money(it.price)}{it.product?.productId && <> · {it.product.productId}</>}</small>
              </div>
              <b>{money(it.quantity * it.price)}</b>
            </div>
          );
        })}
      </div>
      <div className="totals">
        <div><span>Subtotal</span><span>{money(o.subtotal)}</span></div>
        <div><span>Delivery fee</span><span>{o.deliveryFee ? money(o.deliveryFee) : <Badge tone="success">Free</Badge>}</span></div>
        <div className="grand"><span>Total</span><span>{money(o.totalAmount)}</span></div>
        <div style={{ fontSize: 12.5 }}><span className="muted">Fauran commission</span><span className="muted">{money(o.platformCommission)}</span></div>
        <div style={{ fontSize: 12.5 }}><span className="muted">Vendor payout</span><span className="muted">{money(o.vendorPayout)}</span></div>
      </div>
    </Card>
  );
}

// Extra context for the off-flow steps.
function stepNote(o, status) {
  if (status === 'cancelled') return [o.cancelledBy && `By ${o.cancelledBy}`, o.cancelReason].filter(Boolean).join(' · ');
  if (status === 'delivery_failed') return [failureLabel(o.failureReason), o.failureNote].filter(Boolean).join(' · ');
  if (status === 'returned') return o.returnCondition ? titleCase(o.returnCondition) : '';
  return '';
}

function TimelineCard({ order: o }) {
  const history = o.statusHistory || [];
  const steps = OFF_FLOW.includes(o.status)
    ? history
    : [...FLOW.map((s) => history.find((t) => t.status === s) || { status: s, pending: true }), ...history.filter((t) => !FLOW.includes(t.status))];
  return (
    <Card title="Order timeline">
      <ul className="timeline">
        {steps.map((t, i) => {
          const bad = t.status === 'cancelled' || t.status === 'delivery_failed';
          const cls = t.pending ? 'is-pending' : bad ? 'is-danger' : t.status === 'returned' ? 'is-warning' : '';
          const Icon = t.pending ? Circle : bad ? X : t.status === 'delivered' ? CheckCheck : Check;
          const note = !t.pending && stepNote(o, t.status);
          return (
            <li key={`${t.status}-${i}`} className={cls}>
              <span className="timeline-dot"><Icon size={11} strokeWidth={3} /></span>
              <strong>{statusLabel(t.status)}</strong>
              <small>{t.pending ? 'Waiting' : dateTime(t.timestamp)}</small>
              {note && <p>{note}</p>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function PartiesCards({ order: o }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const profile = (perm, to) => can(perm) && <Button size="sm" variant="ghost" onClick={() => navigate(to)}>Profile</Button>;
  const { customer, vendor, rider } = o;
  return (
    <>
      <Card title="Customer" action={customer && profile('customers', `/customers/${customer.customerId}`)}>
        <Identity name={customer?.name} sub={customer?.customerId} />
        <div style={{ marginTop: 14 }}>
          <KeyValue columns={1} items={[['Phone', <span key="p" className="row" style={{ gap: 6 }}><Phone size={13} className="muted" />{customer?.phone}</span>], customer?.email && ['Email', customer.email]]} />
        </div>
      </Card>
      <Card title="Store" action={vendor && profile('vendors', `/vendors/${vendor.vendorId}`)}>
        <Identity name={vendor?.storeName} sub={[vendor?.vendorId, vendor?.name].filter(Boolean).join(' · ')} square />
        {(vendor?.phone || vendor?.storeAddress?.address) && (
          <div style={{ marginTop: 14 }}>
            <KeyValue columns={1} items={[vendor.phone && ['Phone', vendor.phone], vendor.storeAddress?.address && ['Address', vendor.storeAddress.address]]} />
          </div>
        )}
      </Card>
      <Card title="Rider" action={rider && profile('riders', `/riders/${rider.riderId}`)}>
        {rider
          ? <Identity name={rider.name} sub={[rider.riderId, rider.phone, rider.vehicleNumber].filter(Boolean).join(' · ')} />
          : <div className="row muted"><Bike size={16} /> No rider assigned yet</div>}
      </Card>
    </>
  );
}

function FailureCard({ order: o }) {
  return (
    <Card title="Failed delivery">
      <KeyValue
        columns={1}
        items={[
          ['Failed at', dateTime(o.failedAt)],
          ['Reason', failureLabel(o.failureReason)],
          o.failureNote && ['Rider note', o.failureNote],
          o.returnedAt && ['Returned', dateTime(o.returnedAt)],
          o.returnCondition && ['Condition', titleCase(o.returnCondition)],
          o.refundDue > 0 && ['Refund due', money(o.refundDue)],
        ]}
      />
    </Card>
  );
}

function PaymentsCard({ payments }) {
  return (
    <Card title="Payment records">
      {payments.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>No payment recorded yet. Cash orders are recorded when the rider collects the money.</p>
      ) : (
        <div className="stack" style={{ gap: 14 }}>
          {payments.map((p) => (
            <KeyValue
              key={p._id}
              columns={1}
              items={[
                ['Payment', <Code key="id">{p.paymentId}</Code>],
                ['Method', methodLabel(p.method)],
                ['Status', <StatusBadge key="s" status={p.status} />],
                ['Amount', money(p.amount)],
                p.refundedAmount > 0 && ['Refunded', money(p.refundedAmount)],
                p.stripePaymentIntentId && ['Stripe ref', <Code key="ref">{p.stripePaymentIntentId}</Code>],
                ['Date', dateTime(p.createdAt)],
              ]}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// delivery_failed -> returned. restock = true puts the items back in stock.
function ReturnDialog({ order, loading, onClose, onConfirm }) {
  const [restock, setRestock] = useState('true');
  const [note, setNote] = useState('');
  const paidByCard = order.paymentMethod === 'stripe' && order.paymentStatus === 'paid';
  return (
    <Modal
      open
      onClose={onClose}
      icon={RotateCcw}
      size="sm"
      title="Confirm the return?"
      description={`The order will be marked returned.${paidByCard ? ' The card payment then needs a manual refund (products only, delivery fee kept).' : ''}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={loading} onClick={() => onConfirm(restock === 'true', note.trim())}>Confirm return</Button></>}
    >
      <div className="stack" style={{ gap: 14 }}>
        <Field label="Condition of the items">
          <Segmented value={restock} onChange={setRestock} options={[{ value: 'true', label: 'Back in stock' }, { value: 'false', label: 'Damaged' }]} />
        </Field>
        <div className="field">
          <label className="field-label" htmlFor="return-note">Note (optional)</label>
          <textarea id="return-note" className="input textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rider returned the bag sealed" />
        </div>
      </div>
    </Modal>
  );
}
