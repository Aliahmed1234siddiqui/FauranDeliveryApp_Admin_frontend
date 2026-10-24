import { BarList } from '@/components/charts';
import { Button, Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useApi } from '@/hooks';
import { paths, useRouter } from '@/router';
import { dashboardApi } from '@/services/api';
import { compactMoney } from '@/utils/format';

export function TopStoresCard() {
  const { navigate } = useRouter();
  const commission = useApi(() => dashboardApi.commission(), [], { key: 'dashboard-commission' });
  // Older backends return { vendorName, totalRevenue, totalCommission }; reports use vendorRow names.
  const items = (commission.data || []).slice(0, 5).map((c) => ({
    key: c.vendorId || c._id,
    label: c.storeName || c.vendorName,
    value: c.totalRevenue ?? c.totalSales ?? 0,
    meta: `${compactMoney(c.totalCommission ?? c.platformCommission)} comm.`,
  }));
  return (
    <Card
      title="Top stores by sales"
      subtitle="Commission earned per vendor"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate(paths.reports({ tab: 'vendors' }))}>
          Report
        </Button>
      }
    >
      {commission.error && !commission.data ? (
        <ErrorState error={commission.error} onRetry={commission.reload} />
      ) : !commission.data ? (
        <Skeleton h={220} />
      ) : items.length ? (
        <BarList items={items} format={compactMoney} onItemClick={(i) => navigate(paths.vendor(i.key))} />
      ) : (
        <EmptyState title="No sales yet" description="Stores appear here once orders are delivered." />
      )}
    </Card>
  );
}
