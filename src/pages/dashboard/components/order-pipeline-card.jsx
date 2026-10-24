import { ArrowRight } from 'lucide-react';

import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { ORDER_STATUSES } from '@/constants';
import { paths, useRouter } from '@/router';
import { num, titleCase } from '@/utils/format';

const STATUS_COLORS = {
  placed: 'var(--info)',
  accepted: 'var(--info)',
  preparing: 'var(--warning)',
  ready: 'var(--warning)',
  rider_assigned: 'var(--violet)',
  picked_up: 'var(--violet)',
  on_the_way: 'var(--brand)',
  delivered: 'var(--success)',
  cancelled: 'var(--danger)',
  delivery_failed: 'var(--danger)',
  returned: 'var(--text-3)',
};

// Order counts per status; each step opens the filtered order list.
export function OrderPipelineCard({ summary: s }) {
  const { navigate } = useRouter();
  const statuses = s ? ORDER_STATUSES.filter((status) => s.orders.byStatus?.[status]) : [];

  return (
    <Card
      title="Order pipeline"
      subtitle="Orders by current status"
      action={
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate(paths.orders())}>
          All orders
        </Button>
      }
    >
      {s ? (
        <>
          {statuses.length ? (
            <div className="pipeline">
              {statuses.map((status) => (
                <button
                  type="button"
                  key={status}
                  className="pipeline-step"
                  onClick={() => navigate(paths.orders({ status }))}
                >
                  <strong>{num(s.orders.byStatus[status])}</strong>
                  <span>
                    <i style={{ background: STATUS_COLORS[status] }} />
                    {titleCase(status)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No orders yet" />
          )}
          <div className="mini-stats" style={{ marginTop: 16 }}>
            <div className="mini-stat">
              <span>Riders online</span>
              <strong>
                {num(s.users.riders.online)}
                <small style={{ display: 'inline', marginLeft: 4 }}>/ {num(s.users.riders.approved)}</small>
              </strong>
            </div>
            <div className="mini-stat">
              <span>Orders all-time</span>
              <strong>{num(s.orders.total)}</strong>
            </div>
          </div>
        </>
      ) : (
        <Skeleton h={260} r={12} />
      )}
    </Card>
  );
}
