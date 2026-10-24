import { useState } from 'react';

import { LineChart } from '@/components/charts';
import { Card, EmptyState, ErrorState, Segmented, Skeleton } from '@/components/ui';
import { useAuth } from '@/context';
import { useApi } from '@/hooks';
import { dashboardApi } from '@/services/api';
import { compactMoney, compactNum, lastDays, money, num, periodLabel } from '@/utils/format';

import { nothing } from '../dashboard-utils';

export function SalesCard({ range, setRange }) {
  const { can } = useAuth();
  const [metric, setMetric] = useState('orderCount');
  const sales = useApi(
    () =>
      can('reports', 'dashboard') ? dashboardApi.sales({ groupBy: 'day', ...lastDays(range) }) : nothing(),
    [range],
    { key: 'dashboard-sales' },
  );
  const rows = sales.data || [];
  const totals = rows.reduce(
    (t, r) => ({
      orders: t.orders + r.orderCount,
      sales: t.sales + r.totalSales,
      commission: t.commission + r.platformCommission,
    }),
    { orders: 0, sales: 0, commission: 0 },
  );
  const isMoney = metric !== 'orderCount';

  let body;
  if (sales.error && !sales.data) body = <ErrorState error={sales.error} onRetry={sales.reload} />;
  else if (!sales.data) body = <Skeleton h={320} r={12} />;
  else if (!rows.length)
    body = (
      <EmptyState
        title="No delivered orders"
        description={`Nothing was delivered in the last ${range} days.`}
      />
    );
  else {
    body = (
      <>
        <div className="chart-headline">
          <div>
            <span>Delivered orders</span>
            <strong>{num(totals.orders)}</strong>
          </div>
          <div>
            <span>Total sales</span>
            <strong>{compactMoney(totals.sales)}</strong>
          </div>
          <div>
            <span>Commission</span>
            <strong>{compactMoney(totals.commission)}</strong>
          </div>
        </div>
        <LineChart
          data={rows}
          x="period"
          series={[{ key: metric, label: isMoney ? 'Sales' : 'Orders', color: 'var(--chart-brand)' }]}
          formatX={periodLabel}
          formatY={(v) => (isMoney ? compactMoney(v).replace('Rs. ', '') : compactNum(v))}
          formatTip={(v) => (isMoney ? money(v) : num(v))}
          height={270}
        />
      </>
    );
  }

  return (
    <Card
      title="Marketplace performance"
      subtitle={`Delivered orders, last ${range} days`}
      action={
        <>
          <Segmented
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'orderCount', label: 'Orders' },
              { value: 'totalSales', label: 'Sales' },
            ]}
          />
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: '7', label: '7D' },
              { value: '14', label: '14D' },
              { value: '30', label: '30D' },
            ]}
          />
        </>
      }
    >
      {body}
    </Card>
  );
}
