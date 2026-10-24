import { useState } from 'react';

import { Card, ErrorState } from '@/components/ui';
import { useAuth } from '@/context';
import { useApi } from '@/hooks';
import { dashboardApi } from '@/services/api';

import { DashboardHero } from './components/dashboard-hero';
import { LatestOrdersCard } from './components/latest-orders-card';
import { LowStockCard } from './components/low-stock-card';
import { NeedsApprovalCard } from './components/needs-approval-card';
import { OrderPipelineCard } from './components/order-pipeline-card';
import { PlatformStats } from './components/platform-stats';
import { SalesCard } from './components/sales-card';
import { TodayStats } from './components/today-stats';
import { TopPerformers } from './components/top-performers';
import { TopStoresCard } from './components/top-stores-card';
import { nothing } from './dashboard-utils';

const DEFAULT_SALES_RANGE = '14';

export default function Dashboard() {
  const { can } = useAuth();
  const [range, setRange] = useState(DEFAULT_SALES_RANGE);
  const summary = useApi(() => (can('dashboard') ? dashboardApi.summary() : nothing()), [], {
    key: 'dashboard-summary',
  });
  const s = summary.data;
  const failed = Boolean(summary.error && !s);

  return (
    <>
      <DashboardHero summary={s} />

      {failed && (
        <Card className="mb">
          <ErrorState error={summary.error} onRetry={summary.reload} />
        </Card>
      )}

      <TodayStats summary={s} failed={failed} />

      <div className="grid grid-main mb">
        <SalesCard range={range} setRange={setRange} />
        <OrderPipelineCard summary={s} />
      </div>

      <div className="grid grid-3 mb">
        {can('dashboard', 'reports') && <TopStoresCard />}
        <NeedsApprovalCard summary={s} />
        {can('dashboard', 'inventory') && <LowStockCard />}
      </div>

      {s && <TopPerformers summary={s} />}
      <LatestOrdersCard summary={s} failed={failed} />
      {s && <PlatformStats summary={s} />}
    </>
  );
}
