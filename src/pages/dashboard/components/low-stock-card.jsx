import { Badge, Button, Card, EmptyState, ErrorState, Identity, Skeleton } from '@/components/ui';
import { useApi } from '@/hooks';
import { paths, useRouter } from '@/router';
import { inventoryApi } from '@/services/api';

export function LowStockCard() {
  const { navigate } = useRouter();
  const lowStock = useApi(() => inventoryApi.lowStock(), [], { key: 'low-stock' });
  const rows = lowStock.data || [];
  return (
    <Card
      title="Low stock alerts"
      subtitle="Below the low-stock threshold"
      action={
        <Button variant="ghost" size="sm" onClick={() => navigate(paths.inventory())}>
          Inventory
        </Button>
      }
    >
      {lowStock.error && !lowStock.data ? (
        <ErrorState error={lowStock.error} onRetry={lowStock.reload} />
      ) : !lowStock.data ? (
        <Skeleton h={220} />
      ) : rows.length ? (
        <div className="list">
          {rows.slice(0, 5).map((p) => (
            <div key={p._id} className="list-item">
              <Identity name={p.name} sub={p.vendor?.storeName} square />
              <div className="list-item-end">
                {p.stock === 0 ? (
                  <Badge tone="danger">Out</Badge>
                ) : (
                  <Badge tone="warning">
                    {p.stock} {p.unit || ''} left
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="All stocked up" description="No products are below the low-stock threshold." />
      )}
    </Card>
  );
}
