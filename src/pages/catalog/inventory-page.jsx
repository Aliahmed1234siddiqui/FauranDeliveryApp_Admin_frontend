import { LineChart as TrendIcon } from 'lucide-react';

import { Button, Card, ErrorState, PageHeader } from '@/components/ui';
import { useAuth } from '@/context';
import { useApi } from '@/hooks';
import { paths, useQueryState, useRouter } from '@/router';
import { inventoryApi } from '@/services/api';

import { CategoryBreakdown } from './components/category-stock-breakdown';
import { Summary } from './components/inventory-summary';
import { StockTable } from './components/stock-table';
import { ThresholdInput } from './components/threshold-input';
import { VendorBreakdown } from './components/vendor-stock-breakdown';

export default function Inventory() {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const [threshold, setThreshold] = useQueryState('threshold');
  const { data, loading, error, reload } = useApi(() => inventoryApi.overview({ threshold }), [threshold], {
    key: 'inventory-overview',
  });
  const canProducts = can('products');

  const openProduct = (p) => navigate(paths.products({ search: p.productId || p.name }));

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock on hand across every store. Spot shortages before customers do."
        actions={
          <>
            <ThresholdInput
              key={threshold}
              value={threshold}
              fallback={data?.threshold}
              onChange={setThreshold}
            />
            {can('reports', 'inventory') && (
              <Button
                variant="secondary"
                icon={TrendIcon}
                onClick={() => navigate(paths.reports({ tab: 'forecast' }))}
              >
                Demand forecast
              </Button>
            )}
          </>
        }
      />
      {error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : (
        <>
          <Summary
            data={data}
            onPending={canProducts ? () => navigate(paths.products({ approval: 'pending' })) : undefined}
          />
          <div className="grid grid-side mb">
            <StockTable
              data={data}
              loading={loading}
              error={error}
              onRetry={reload}
              onOpen={canProducts ? openProduct : undefined}
            />
            <Card
              title="Stock by store"
              subtitle={
                canProducts
                  ? 'Bar shows the share of low-stock products. Click to see a store’s products.'
                  : 'Bar shows the share of low-stock products.'
              }
            >
              <VendorBreakdown
                rows={data?.byVendor}
                onOpen={canProducts ? (v) => navigate(paths.products({ vendorId: v.vendorId })) : undefined}
              />
            </Card>
          </div>
          <Card title="Stock by category" subtitle="Units on hand per category">
            <CategoryBreakdown rows={data?.byCategory} />
          </Card>
        </>
      )}
    </>
  );
}
