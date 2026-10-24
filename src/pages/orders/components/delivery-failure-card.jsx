import { Card, KeyValue } from '@/components/ui';
import { dateTime, money, titleCase } from '@/utils/format';

import { failureLabel } from '../order-utils';

export function FailureCard({ order: o }) {
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
