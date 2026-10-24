import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Ban,
  Clock,
  CreditCard,
  MapPin,
  PackageX,
  Printer,
  RotateCcw,
  Store,
  Undo2,
  User,
} from 'lucide-react';

import { BackLink, DetailSkeleton, RefundButton } from '@/components/common';
import { ConfirmDialog } from '@/components/overlays';
import { Button, Card, Code, ErrorState, KeyValue, StatusBadge } from '@/components/ui';
import { CANCELLABLE_STATUSES } from '@/constants';
import { useAction, useApi } from '@/hooks';
import { paths } from '@/router';
import { needsRefund, ordersApi } from '@/services/api';
import { dateTime, money, timeAgo, titleCase } from '@/utils/format';

import { FailureCard } from './components/delivery-failure-card';
import { ItemsCard } from './components/order-items-card';
import { PartiesCards } from './components/order-parties-cards';
import { PaymentsCard } from './components/order-payments-card';
import { TimelineCard } from './components/order-timeline-card';
import { ReturnDialog } from './components/return-order-dialog';
import { failureLabel, methodLabel } from './order-utils';

export default function OrderDetail({ params }) {
  const { data, loading, error, reload } = useApi(() => ordersApi.get(params.id), [params.id], {
    key: 'order',
  });
  const [dialog, setDialog] = useState(null);
  const [run, pending] = useAction();

  if (loading && !data) return <DetailSkeleton />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { order: o, payments = [], deliveryMinutes } = data;
  const close = () => {
    setDialog(null);
    reload();
  };

  // The server message may carry a "refund the card payment" hint, so show it as-is.
  const cancel = (reason) =>
    run(() => ordersApi.cancel(o._id, reason || undefined))
      .then(({ message }) => {
        toast.success(message || 'Order cancelled');
        close();
      })
      .catch(() => {});
  const confirmReturn = (restock, note) =>
    run(() => ordersApi.confirmReturn(o._id, { restock, note: note || undefined }), {
      success: restock ? 'Return confirmed, items back in stock' : 'Return confirmed, items marked damaged',
    })
      .then(close)
      .catch(() => {});

  const canCancel = CANCELLABLE_STATUSES.includes(o.status);
  const refundable = needsRefund(o);
  const paidByCard = o.paymentMethod === 'stripe' && o.paymentStatus === 'paid';

  return (
    <>
      <BackLink to={paths.orders()}>All orders</BackLink>
      <div className="page-header">
        <div className="page-header-copy">
          <div className="row row-wrap">
            <h1 style={{ fontFamily: 'var(--mono)', fontSize: 22, letterSpacing: 0 }}>{o.orderId}</h1>
            <StatusBadge status={o.status} />
          </div>
          <div className="page-header-meta">
            <span>
              <Clock size={14} /> Placed {dateTime(o.createdAt)}
            </span>
            <span>
              <CreditCard size={14} /> {methodLabel(o.paymentMethod)} ·{' '}
              <StatusBadge status={o.paymentStatus} />
            </span>
            {o.trackingId && (
              <span>
                <Code>{o.trackingId}</Code>
              </span>
            )}
          </div>
        </div>
        <div className="page-header-actions">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          {refundable && <RefundButton order={o} onDone={reload} />}
          {o.status === 'delivery_failed' && (
            <Button icon={RotateCcw} onClick={() => setDialog('return')}>
              Confirm return
            </Button>
          )}
          {canCancel && (
            <Button variant="danger-soft" icon={Ban} onClick={() => setDialog('cancel')}>
              Cancel order
            </Button>
          )}
        </div>
      </div>

      {o.status === 'delivery_failed' && (
        <div className="callout callout-warning mb">
          <PackageX size={16} />
          <div>
            <strong>
              Delivery failed {timeAgo(o.failedAt)}
              {o.failureReason ? `: ${failureLabel(o.failureReason)}` : ''}.
            </strong>
            {o.failureNote && ` "${o.failureNote}".`} Confirm the return once the rider has brought the items
            back to the store.
          </div>
        </div>
      )}
      {refundable && (
        <div className="callout callout-info mb">
          <Undo2 size={16} />
          <div>
            <strong>The card payment has not been refunded yet.</strong> Card refunds are manual.{' '}
            {o.refundDue > 0
              ? `${money(o.refundDue)} is due (products only, delivery fee kept).`
              : `The customer paid ${money(o.totalAmount)}.`}
          </div>
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
                [
                  'Address',
                  <span key="a" className="row" style={{ gap: 6 }}>
                    <MapPin size={13} className="muted" />
                    {o.deliveryAddress?.addressLine || '—'}
                  </span>,
                ],
                o.deliveredAt && ['Delivered', dateTime(o.deliveredAt)],
                deliveryMinutes != null && ['Delivery time', `${Math.round(deliveryMinutes)} min`],
              ]}
            />
          </Card>
          {(o.failedAt || o.returnedAt) && <FailureCard order={o} />}
          {o.status === 'cancelled' && (
            <Card title="Cancellation">
              <KeyValue
                columns={1}
                items={[
                  ['Cancelled by', o.cancelledBy ? titleCase(o.cancelledBy) : null],
                  ['Reason', o.cancelReason || null],
                ]}
              />
            </Card>
          )}
          <PaymentsCard payments={payments} />
          <div className="row muted" style={{ fontSize: 12, gap: 6 }}>
            <Store size={13} />
            <User size={13} /> Status changes come from the vendor and rider apps. Admins can cancel before
            pickup or confirm a failed delivery's return.
          </div>
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
      {dialog === 'return' && (
        <ReturnDialog order={o} loading={pending} onClose={() => setDialog(null)} onConfirm={confirmReturn} />
      )}
    </>
  );
}
