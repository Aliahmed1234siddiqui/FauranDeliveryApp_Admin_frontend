import { Check, CheckCheck, Circle, X } from 'lucide-react';

import { Card } from '@/components/ui';
import { statusLabel } from '@/constants/status';
import { dateTime, titleCase } from '@/utils/format';

import { failureLabel } from '../order-utils';

const FLOW = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'rider_assigned',
  'picked_up',
  'on_the_way',
  'delivered',
];
// Orders that left the happy path: show only what actually happened.

const OFF_FLOW = ['cancelled', 'delivery_failed', 'returned'];

// Extra context for the off-flow steps.
function stepNote(o, status) {
  if (status === 'cancelled')
    return [o.cancelledBy && `By ${o.cancelledBy}`, o.cancelReason].filter(Boolean).join(' · ');
  if (status === 'delivery_failed')
    return [failureLabel(o.failureReason), o.failureNote].filter(Boolean).join(' · ');
  if (status === 'returned') return o.returnCondition ? titleCase(o.returnCondition) : '';
  return '';
}

export function TimelineCard({ order: o }) {
  const history = o.statusHistory || [];
  const steps = OFF_FLOW.includes(o.status)
    ? history
    : [
        ...FLOW.map((s) => history.find((t) => t.status === s) || { status: s, pending: true }),
        ...history.filter((t) => !FLOW.includes(t.status)),
      ];
  return (
    <Card title="Order timeline">
      <ul className="timeline">
        {steps.map((t, i) => {
          const bad = t.status === 'cancelled' || t.status === 'delivery_failed';
          const cls = t.pending
            ? 'is-pending'
            : bad
              ? 'is-danger'
              : t.status === 'returned'
                ? 'is-warning'
                : '';
          const Icon = t.pending ? Circle : bad ? X : t.status === 'delivered' ? CheckCheck : Check;
          const note = !t.pending && stepNote(o, t.status);
          return (
            <li key={`${t.status}-${i}`} className={cls}>
              <span className="timeline-dot">
                <Icon size={11} strokeWidth={3} />
              </span>
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
