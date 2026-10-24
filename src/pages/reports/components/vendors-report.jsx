import { Store } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { Card, EmptyState, Identity, Progress } from '@/components/ui';
import { useApi } from '@/hooks';
import { paths, useRouter } from '@/router';
import { reportsApi } from '@/services/api';
import { compactMoney, money, num } from '@/utils/format';

export function VendorsTab({ range }) {
  const { navigate } = useRouter();
  const { data, loading, error, reload } = useApi(() => reportsApi.vendors(range), [range.from, range.to], {
    key: 'report-vendors',
  });
  const max = Math.max(...(data || []).map((r) => r.totalSales), 1);
  return (
    <Card className="table-card" padded={false}>
      <DataTable
        loading={loading}
        error={error}
        onRetry={reload}
        rows={data}
        rowKey="_id"
        onRowClick={(r) => navigate(paths.vendor(r.vendorId))}
        empty={
          <EmptyState
            icon={Store}
            title="No vendor sales"
            description="No store delivered an order in this date range."
          />
        }
        columns={[
          {
            key: 'vendor',
            header: 'Store',
            render: (r) => (
              <Identity
                name={r.storeName || r.vendorName}
                sub={`${r.vendorId} · ${r.ownerName || '—'}`}
                square
              />
            ),
          },
          {
            key: 'totalSales',
            header: 'Total sales',
            width: 220,
            render: (r) => (
              <div>
                <strong style={{ color: 'var(--text)' }}>{compactMoney(r.totalSales)}</strong>
                <div style={{ marginTop: 6 }}>
                  <Progress value={r.totalSales} max={max} />
                </div>
              </div>
            ),
          },
          { key: 'totalOrders', header: 'Orders', align: 'right', render: (r) => num(r.totalOrders) },
          {
            key: 'platformCommission',
            header: 'Commission',
            align: 'right',
            hideOnMobile: true,
            render: (r) => money(r.platformCommission),
          },
          {
            key: 'vendorPayout',
            header: 'Vendor payout',
            align: 'right',
            hideOnMobile: true,
            render: (r) => money(r.vendorPayout),
          },
          {
            key: 'avgOrderValue',
            header: 'Avg. order',
            align: 'right',
            hideOnMobile: true,
            render: (r) => money(r.avgOrderValue),
          },
          {
            key: 'cancelledOrders',
            header: 'Cancelled',
            align: 'right',
            render: (r) => (
              <span className={r.cancelledOrders ? 'neg' : 'muted'}>{num(r.cancelledOrders)}</span>
            ),
          },
        ]}
      />
    </Card>
  );
}
