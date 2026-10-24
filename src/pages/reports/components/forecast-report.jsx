import { AlertTriangle, BrainCircuit, Package } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { Badge, Card, EmptyState, Identity, Select, StatCard } from '@/components/ui';
import { useApi } from '@/hooks';
import { useQueryState } from '@/router';
import { reportsApi } from '@/services/api';
import { num } from '@/utils/format';

export function ForecastTab() {
  const [days, setDays] = useQueryState('days', '30');
  const [horizonDays, setHorizonDays] = useQueryState('horizon', '7');
  const { data, loading, error, reload } = useApi(
    () => reportsApi.forecast({ days, horizonDays }),
    [days, horizonDays],
    { key: 'report-forecast' },
  );
  const rows = data || [];
  const restock = rows.filter((r) => r.needsRestock);
  return (
    <>
      <div className="row" style={{ justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
        <Select
          label="Based on"
          value={days}
          onChange={setDays}
          options={[
            { value: '14', label: 'Last 14 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' },
          ]}
        />
        <Select
          label="Forecast"
          value={horizonDays}
          onChange={setHorizonDays}
          options={[
            { value: '7', label: 'Next 7 days' },
            { value: '14', label: 'Next 14 days' },
            { value: '30', label: 'Next 30 days' },
          ]}
        />
      </div>
      {data && (
        <div className="stat-grid">
          <StatCard
            icon={AlertTriangle}
            tone="rose"
            label="Need restocking"
            value={num(restock.length)}
            footer={`Of the top ${num(rows.length)} selling products`}
          />
          <StatCard
            icon={BrainCircuit}
            label="Units expected to sell"
            value={num(Math.round(rows.reduce((s, r) => s + r.forecastUnits, 0)))}
            footer={`Next ${horizonDays} days`}
          />
          <StatCard
            icon={Package}
            tone="violet"
            label="Units to reorder"
            value={num(Math.round(restock.reduce((s, r) => s + r.suggestedRestock, 0)))}
            footer="Suggested restock total"
          />
        </div>
      )}
      <Card
        title="Restock suggestions"
        subtitle={`Demand from the last ${days} days, projected over the next ${horizonDays}`}
        className="table-card"
        padded={false}
      >
        <DataTable
          loading={loading}
          error={error}
          onRetry={reload}
          rows={data}
          rowKey="productId"
          empty={
            <EmptyState
              icon={Package}
              title="No sales to forecast from"
              description="Products appear here once they have sold in the selected window."
            />
          }
          columns={[
            {
              key: 'product',
              header: 'Product',
              render: (r) => <Identity name={r.name} sub={r.storeName} square />,
            },
            {
              key: 'avgDailyDemand',
              header: 'Daily demand',
              align: 'right',
              hideOnMobile: true,
              render: (r) => Number(r.avgDailyDemand || 0).toFixed(1),
            },
            {
              key: 'forecastUnits',
              header: 'Forecast',
              align: 'right',
              render: (r) => num(Math.round(r.forecastUnits)),
            },
            { key: 'currentStock', header: 'In stock', align: 'right', render: (r) => num(r.currentStock) },
            {
              key: 'daysOfStockLeft',
              header: 'Cover',
              align: 'right',
              hideOnMobile: true,
              render: (r) =>
                r.daysOfStockLeft == null ? (
                  <span className="muted">—</span>
                ) : (
                  `${Number(r.daysOfStockLeft).toFixed(1)}d`
                ),
            },
            {
              key: 'suggestedRestock',
              header: 'Reorder',
              align: 'right',
              render: (r) =>
                r.needsRestock ? (
                  <Badge tone={r.currentStock === 0 ? 'danger' : 'warning'}>
                    +{num(Math.ceil(r.suggestedRestock))}
                  </Badge>
                ) : (
                  <span className="muted">—</span>
                ),
            },
          ]}
        />
      </Card>
    </>
  );
}
