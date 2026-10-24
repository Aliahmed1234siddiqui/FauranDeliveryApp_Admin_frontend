import { Bike } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { Badge, Card, EmptyState, Identity } from '@/components/ui';
import { useApi } from '@/hooks';
import { paths, useRouter } from '@/router';
import { reportsApi } from '@/services/api';
import { compactMoney, money, num, titleCase } from '@/utils/format';

import { Rating } from './rating';

export function RidersTab({ range }) {
  const { navigate } = useRouter();
  const { data, loading, error, reload } = useApi(() => reportsApi.riders(range), [range.from, range.to], {
    key: 'report-riders',
  });
  return (
    <Card className="table-card" padded={false}>
      <DataTable
        loading={loading}
        error={error}
        onRetry={reload}
        rows={data}
        rowKey="_id"
        onRowClick={(r) => navigate(paths.rider(r.riderId))}
        empty={
          <EmptyState
            icon={Bike}
            title="No rider activity"
            description="No rider completed a delivery in this date range."
          />
        }
        columns={[
          {
            key: 'rider',
            header: 'Rider',
            render: (r) => (
              <Identity
                name={r.name}
                sub={[r.riderId, titleCase(r.vehicleType || ''), r.vehicleNumber].filter(Boolean).join(' · ')}
              />
            ),
          },
          {
            key: 'online',
            header: 'Status',
            hideOnMobile: true,
            render: (r) => (
              <Badge tone={r.isOnline ? 'success' : 'neutral'} dot>
                {r.isOnline ? 'Online' : 'Offline'}
              </Badge>
            ),
          },
          { key: 'deliveries', header: 'Deliveries', align: 'right', render: (r) => num(r.deliveries) },
          {
            key: 'failedAttempts',
            header: 'Failed',
            align: 'right',
            render: (r) => (
              <span className={r.failedAttempts ? 'neg' : 'muted'}>{num(r.failedAttempts ?? 0)}</span>
            ),
          },
          {
            key: 'avg',
            header: 'Avg. delivery',
            align: 'right',
            hideOnMobile: true,
            render: (r) =>
              r.avgDeliveryMinutes == null ? (
                <span className="muted">—</span>
              ) : (
                `${Math.round(r.avgDeliveryMinutes)} min`
              ),
          },
          {
            key: 'cashCollected',
            header: 'Cash collected',
            align: 'right',
            hideOnMobile: true,
            render: (r) => compactMoney(r.cashCollected),
          },
          {
            key: 'deliveryEarnings',
            header: 'Earnings',
            align: 'right',
            hideOnMobile: true,
            render: (r) => money(r.deliveryEarnings),
          },
          {
            key: 'rating',
            header: 'Rating',
            render: (r) => (
              <span title={`${num(r.totalRatings)} ratings`}>
                <Rating value={r.rating} />
              </span>
            ),
          },
        ]}
      />
    </Card>
  );
}
