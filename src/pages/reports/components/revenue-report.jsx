import { Bike, Percent, Receipt, TrendingUp } from 'lucide-react';

import { Donut } from '@/components/charts';
import { Card, EmptyState, StatCard } from '@/components/ui';
import { PAYMENT_METHODS } from '@/constants';
import { useApi } from '@/hooks';
import { reportsApi } from '@/services/api';
import { compactMoney, money, num, titleCase } from '@/utils/format';

import { ReportState } from './report-state';

export function RevenueTab({ range }) {
  const query = useApi(() => reportsApi.revenue(range), [range.from, range.to], { key: 'report-revenue' });
  return (
    <ReportState query={query}>
      {(d) => {
        const split = [
          { label: 'Vendor payouts', value: d.vendorPayout, color: 'var(--series-1)' },
          { label: 'Platform commission', value: d.platformCommission, color: 'var(--chart-brand)' },
          { label: 'Rider delivery fees', value: d.deliveryFees, color: 'var(--violet)' },
        ];
        const methods = Object.entries(d.byPaymentMethod || {});
        const fd = d.failedDeliveries || {};
        return (
          <>
            <div className="stat-grid">
              <StatCard
                icon={Receipt}
                label="Total sales"
                value={compactMoney(d.totalSales)}
                footer={`${num(d.deliveredOrders)} delivered orders`}
              />
              <StatCard
                icon={Percent}
                tone="violet"
                label="Platform commission"
                value={compactMoney(d.platformCommission)}
                footer={`${d.commissionPercent}% of product sales`}
              />
              <StatCard
                icon={Bike}
                tone="amber"
                label="Delivery fees"
                value={compactMoney(d.deliveryFees)}
                footer="Paid out as rider earnings"
              />
              <StatCard
                icon={TrendingUp}
                tone="blue"
                label="Avg. order value"
                value={money(d.avgOrderValue)}
                footer={`Product sales ${compactMoney(d.productSales)}`}
              />
            </div>
            <div className="grid grid-main mb">
              <Card title="Where the money goes" subtitle="Split of total sales on delivered orders">
                {d.totalSales > 0 ? (
                  <Donut
                    format={compactMoney}
                    centerValue={compactMoney(d.totalSales)}
                    centerLabel="Total sales"
                    data={split}
                  />
                ) : (
                  <EmptyState
                    title="No delivered orders"
                    description="Nothing was delivered in this date range."
                  />
                )}
                <div className="totals" style={{ marginTop: 18 }}>
                  <div>
                    <span>Product sales</span>
                    <span>{money(d.productSales)}</span>
                  </div>
                  <div>
                    <span>Delivery fees</span>
                    <span>{money(d.deliveryFees)}</span>
                  </div>
                  <div>
                    <span>Vendor payouts</span>
                    <span className="neg">− {money(d.vendorPayout)}</span>
                  </div>
                  <div>
                    <span>Rider delivery fees</span>
                    <span className="neg">− {money(d.deliveryFees)}</span>
                  </div>
                  <div className="grand">
                    <span>Platform commission</span>
                    <span>{money(d.platformCommission)}</span>
                  </div>
                </div>
              </Card>
              <Card title="By payment method" subtitle="Delivered orders">
                {methods.length ? (
                  <>
                    <Donut
                      format={compactMoney}
                      centerValue={num(methods.reduce((s, [, m]) => s + m.orders, 0))}
                      centerLabel="Orders"
                      data={methods.map(([key, m], i) => ({
                        label: PAYMENT_METHODS[key] || titleCase(key),
                        value: m.amount,
                        color: i ? 'var(--chart-accent)' : 'var(--chart-brand)',
                      }))}
                    />
                    <div className="totals" style={{ marginTop: 18 }}>
                      {methods.map(([key, m]) => (
                        <div key={key}>
                          <span>
                            {PAYMENT_METHODS[key] || titleCase(key)} · {num(m.orders)} orders
                          </span>
                          <span>{money(m.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState title="No payments" description="No delivered orders in this range." />
                )}
              </Card>
            </div>
            <Card title="Lost revenue" subtitle="Refunds, cancellations and failed deliveries in this range">
              <div className="mini-stats">
                <div className="mini-stat">
                  <span>Refunds · {num(d.refunds?.count)}</span>
                  <strong>{money(d.refunds?.amount)}</strong>
                </div>
                <div className="mini-stat">
                  <span>Cancelled orders · {num(d.cancelledOrders?.count)}</span>
                  <strong>{money(d.cancelledOrders?.amount)}</strong>
                </div>
                <div className="mini-stat">
                  <span>Failed deliveries · {num(fd.count)}</span>
                  <strong>
                    {money(fd.furanCost)}
                    <small style={{ display: 'inline', marginLeft: 4 }}>Furan cost</small>
                  </strong>
                </div>
                <div className="mini-stat">
                  <span>Rider fees on failed</span>
                  <strong>{money(fd.riderFeesPaid)}</strong>
                </div>
                <div className="mini-stat">
                  <span>Card refunds due</span>
                  <strong>{money(fd.cardRefundsDue)}</strong>
                </div>
              </div>
            </Card>
          </>
        );
      }}
    </ReportState>
  );
}
