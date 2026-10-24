import { Percent, Receipt, ShoppingBag, TrendingUp } from 'lucide-react';

import { BarChart, LineChart } from '@/components/charts';
import { DataTable } from '@/components/data-table';
import { Card, Select, StatCard } from '@/components/ui';
import { REPORT_GROUP_BY } from '@/constants';
import { useApi } from '@/hooks';
import { useQueryState } from '@/router';
import { reportsApi } from '@/services/api';
import { compactMoney, compactNum, money, num, periodLabel } from '@/utils/format';

import { ChartOrTable } from './chart-or-table';
import { ReportState } from './report-state';

const avg = (total, count) => (count ? total / count : 0);

export function SalesTab({ range }) {
  const [groupBy, setGroupBy] = useQueryState('groupBy', 'day');
  const query = useApi(() => reportsApi.sales({ groupBy, ...range }), [groupBy, range.from, range.to], {
    key: 'report-sales',
  });
  const unit = REPORT_GROUP_BY.find((g) => g.value === groupBy)?.label || '';
  const periodCol = { key: 'period', header: 'Period', render: (r) => periodLabel(r.period) };
  return (
    <>
      <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 12 }}>
        <Select label="Group by" value={groupBy} onChange={setGroupBy} options={REPORT_GROUP_BY} />
      </div>
      <ReportState query={query} isEmpty={(rows) => !rows.length}>
        {(rows) => {
          const t = rows.reduce(
            (s, r) => ({
              orders: s.orders + r.orderCount,
              sales: s.sales + r.totalSales,
              commission: s.commission + r.platformCommission,
            }),
            { orders: 0, sales: 0, commission: 0 },
          );
          return (
            <>
              <div className="stat-grid">
                <StatCard
                  icon={ShoppingBag}
                  label="Delivered orders"
                  value={num(t.orders)}
                  footer={`Across ${num(rows.length)} periods with sales`}
                />
                <StatCard
                  icon={Receipt}
                  tone="amber"
                  label="Total sales"
                  value={compactMoney(t.sales)}
                  footer="Products + delivery fees"
                />
                <StatCard
                  icon={Percent}
                  tone="violet"
                  label="Platform commission"
                  value={compactMoney(t.commission)}
                  footer="Furan's earnings"
                />
                <StatCard
                  icon={TrendingUp}
                  tone="blue"
                  label="Avg. order value"
                  value={money(avg(t.sales, t.orders))}
                  footer="Total sales / delivered orders"
                />
              </div>
              <div className="grid grid-2">
                <Card title={`${unit} orders`}>
                  <ChartOrTable
                    label="Orders view"
                    chart={
                      <LineChart
                        data={rows}
                        x="period"
                        series={[{ key: 'orderCount', label: 'Orders', color: 'var(--chart-brand)' }]}
                        formatX={periodLabel}
                        formatY={compactNum}
                        formatTip={num}
                      />
                    }
                    table={
                      <DataTable
                        rowKey="period"
                        columns={[
                          periodCol,
                          {
                            key: 'orderCount',
                            header: 'Orders',
                            align: 'right',
                            render: (r) => num(r.orderCount),
                          },
                        ]}
                        rows={rows}
                      />
                    }
                  />
                </Card>
                <Card title={`${unit} sales`}>
                  <ChartOrTable
                    label="Sales view"
                    chart={
                      <BarChart
                        data={rows}
                        x="period"
                        y="totalSales"
                        formatX={periodLabel}
                        formatY={(v, tip) => (tip ? money(v) : compactMoney(v).replace('Rs. ', ''))}
                        highlightLast
                      />
                    }
                    table={
                      <DataTable
                        rowKey="period"
                        rows={rows}
                        columns={[
                          periodCol,
                          {
                            key: 'totalSales',
                            header: 'Total sales',
                            align: 'right',
                            render: (r) => money(r.totalSales),
                          },
                          {
                            key: 'platformCommission',
                            header: 'Commission',
                            align: 'right',
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
                            key: 'deliveryFees',
                            header: 'Delivery fees',
                            align: 'right',
                            hideOnMobile: true,
                            render: (r) => money(r.deliveryFees),
                          },
                        ]}
                      />
                    }
                  />
                </Card>
              </div>
            </>
          );
        }}
      </ReportState>
    </>
  );
}
