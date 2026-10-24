import { ArrowRight, Bike, PackageX, Store } from 'lucide-react';

import { Badge, Card, Skeleton } from '@/components/ui';
import { paths, useRouter } from '@/router';

const approvalQueues = (s) => [
  {
    icon: Store,
    tone: 'tone-amber',
    label: 'Vendor applications',
    count: s.users.vendors.pending,
    to: paths.vendors({ status: 'pending' }),
  },
  {
    icon: Bike,
    tone: 'tone-violet',
    label: 'Rider applications',
    count: s.users.riders.pending,
    to: paths.riders({ status: 'pending' }),
  },
  {
    icon: PackageX,
    tone: 'tone-blue',
    label: 'Product listings',
    count: s.inventory.pendingApproval,
    to: paths.products({ approval: 'pending' }),
  },
];

// Shortcuts to everything waiting on an admin decision.
export function NeedsApprovalCard({ summary: s }) {
  const { navigate } = useRouter();
  return (
    <Card title="Needs approval" subtitle="Applications and listings waiting on you">
      {s ? (
        <div className="list">
          {approvalQueues(s).map((queue) => (
            <div key={queue.label} className="list-item is-clickable" onClick={() => navigate(queue.to)}>
              <span className={`stat-icon ${queue.tone}`} style={{ width: 34, height: 34 }}>
                <queue.icon size={16} />
              </span>
              <div className="identity-copy">
                <strong>{queue.label}</strong>
              </div>
              <div className="list-item-end row">
                <Badge tone={queue.count ? 'warning' : 'neutral'}>{queue.count}</Badge>
                <ArrowRight size={15} className="muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Skeleton h={220} />
      )}
    </Card>
  );
}
