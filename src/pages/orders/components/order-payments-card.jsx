import { Card, Code, KeyValue, StatusBadge } from '@/components/ui';
import { dateTime, money } from '@/utils/format';

import { methodLabel } from '../order-utils';

export function PaymentsCard({ payments }) {
  return (
    <Card title="Payment records">
      {payments.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>
          No payment recorded yet. Cash orders are recorded when the rider collects the money.
        </p>
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
