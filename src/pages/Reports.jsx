import { useState } from 'react';
import { BarChart3, Bike, Percent, Receipt, ShoppingBag, Star, Store, Table2, TrendingUp, Wallet } from 'lucide-react';
import { useQueryState, useRouter } from '../lib/router';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { reportsApi } from '../services/api';
import { compactMoney, compactNum, lastDays, money, num, periodLabel, profitOf, riderPayoutOf, titleCase } from '../lib/format';
import { PAYMENT_METHODS, REPORT_GROUP_BY } from '../lib/constants';
import { Badge, Card, EmptyState, ErrorState, Identity, Progress, Segmented, Select, Skeleton, StatCard, Tabs, PageHeader } from '../ui/primitives';
import { BarChart, ChartLegend, Donut, LineChart } from '../ui/charts';
import DataTable from '../ui/DataTable';
import { DateRange } from './shared';

const PRESETS = [{ value: '7', label: '7D' }, { value: '30', label: '30D' }, { value: '90', label: '90D' }];
const DEFAULT_DAYS = '30';

const Rating = ({ value }) => <span className="row" style={{ gap: 4 }}><Star size={13} fill="var(--accent)" color="var(--accent)" />{value ? Number(value).toFixed(1) : '—'}</span>;
const avg = (total, count) => (count ? total / count : 0);

const PROFIT_SERIES = [
  { key: 'profit', label: 'Total profit', color: 'var(--chart-brand)' },
  { key: 'platformCommission', label: 'Commission from vendors', color: 'var(--series-3)' },
  { key: 'riderCommission', label: 'Commission from riders', color: 'var(--chart-accent)' },
];

// Shared from/to range kept in the URL; empty params fall back to the last 30 days.
function useDateRange() {
  const fallback = lastDays(DEFAULT_DAYS);
  const [from, setFrom] = useQueryState('from', '');
  const [to, setTo] = useQueryState('to', '');
  const range = { from: from || fallback.from, to: to || fallback.to };
  const setRange = (next) => { setFrom(next.from); setTo(next.to); };
  const preset = PRESETS.find((p) => { const r = lastDays(p.value); return r.from === range.from && r.to === range.to; })?.value || '';
  return { range, setRange, preset, setPreset: (days) => setRange(days === DEFAULT_DAYS ? { from: '', to: '' } : lastDays(days)) };
}

// Loading / error / empty wrapper for report tabs that render charts rather than a table.
function ReportState({ query, isEmpty, children }) {
  if (query.error && !query.data) return <Card><ErrorState error={query.error} onRetry={query.reload} /></Card>;
  if (!query.data) return <Skeleton h={420} r={16} />;
  if (isEmpty?.(query.data)) return <Card><EmptyState title="No delivered orders" description="Nothing was delivered in this date range. Try a wider range." /></Card>;
  return children(query.data);
}

function ChartOrTable({ table, chart, label }) {
  const [mode, setMode] = useState('chart');
  return (
    <>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: -6, marginBottom: 8 }}>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'chart', label: 'Chart', icon: BarChart3 }, { value: 'table', label: 'Table', icon: Table2 }]} aria-label={label} />
      </div>
      {mode === 'chart' ? chart : <div className="card" style={{ overflow: 'hidden', maxHeight: 360, overflowY: 'auto' }}>{table}</div>}
    </>
  );
}

function SalesTab({ range }) {
  const [groupBy, setGroupBy] = useQueryState('groupBy', 'day');
  const query = useApi(() => reportsApi.sales({ groupBy, ...range }), [groupBy, range.from, range.to], { key: 'report-sales' });
  const unit = REPORT_GROUP_BY.find((g) => g.value === groupBy)?.label || '';
  const periodCol = { key: 'period', header: 'Period', render: (r) => periodLabel(r.period) };
  return (
    <>
      <div className="row" style={{ justifyContent: 'flex-end', marginBottom: 12 }}>
        <Select label="Group by" value={groupBy} onChange={setGroupBy} options={REPORT_GROUP_BY} />
      </div>
      <ReportState query={query} isEmpty={(rows) => !rows.length}>
        {(raw) => {
          // Fill profit / riderPayout on rows from older backends so charts and tables can read them directly.
          const rows = raw.map((r) => ({ ...r, riderCommission: r.riderCommission || 0, profit: profitOf(r), riderPayout: riderPayoutOf(r) }));
          const t = rows.reduce((s, r) => ({
            orders: s.orders + r.orderCount,
            sales: s.sales + r.totalSales,
            vendorCommission: s.vendorCommission + r.platformCommission,
            riderCommission: s.riderCommission + r.riderCommission,
            profit: s.profit + r.profit,
          }), { orders: 0, sales: 0, vendorCommission: 0, riderCommission: 0, profit: 0 });
          return (
            <>
              <div className="stat-grid">
                <StatCard icon={ShoppingBag} label="Delivered orders" value={num(t.orders)} footer={`Across ${num(rows.length)} periods with sales`} />
                <StatCard icon={Receipt} tone="amber" label="Total sales" value={compactMoney(t.sales)} footer="Products + delivery fees" />
                <StatCard icon={Percent} tone="violet" label="Total profit" value={compactMoney(t.profit)} footer={`${compactMoney(t.vendorCommission)} from vendors · ${compactMoney(t.riderCommission)} from riders`} />
                <StatCard icon={TrendingUp} tone="blue" label="Avg. order value" value={money(avg(t.sales, t.orders))} footer="Total sales / delivered orders" />
              </div>
              <div className="grid grid-2">
                <Card title={`${unit} orders`}>
                  <ChartOrTable
                    label="Orders view"
                    chart={<LineChart data={rows} x="period" series={[{ key: 'orderCount', label: 'Orders', color: 'var(--chart-brand)' }]} formatX={periodLabel} formatY={compactNum} formatTip={num} />}
                    table={<DataTable rowKey="period" columns={[periodCol, { key: 'orderCount', header: 'Orders', align: 'right', render: (r) => num(r.orderCount) }]} rows={rows} />}
                  />
                </Card>
                <Card title={`${unit} sales`}>
                  <ChartOrTable
                    label="Sales view"
                    chart={<BarChart data={rows} x="period" y="totalSales" formatX={periodLabel} formatY={(v, tip) => (tip ? money(v) : compactMoney(v).replace('Rs. ', ''))} highlightLast />}
                    table={(
                      <DataTable
                        rowKey="period"
                        rows={rows}
                        columns={[
                          periodCol,
                          { key: 'totalSales', header: 'Total sales', align: 'right', render: (r) => money(r.totalSales) },
                          { key: 'deliveryFees', header: 'Delivery fees', align: 'right', hideOnMobile: true, render: (r) => money(r.deliveryFees) },
                          { key: 'vendorPayout', header: 'Paid to vendors', align: 'right', hideOnMobile: true, render: (r) => money(r.vendorPayout) },
                          { key: 'riderPayout', header: 'Paid to riders', align: 'right', hideOnMobile: true, render: (r) => money(r.riderPayout) },
                        ]}
                      />
                    )}
                  />
                </Card>
              </div>
              <Card title={`${unit} profit`} subtitle="Commission from vendors + commission from riders = total profit" style={{ marginTop: 18 }}>
                <ChartOrTable
                  label="Profit view"
                  chart={(
                    <>
                      <LineChart data={rows} x="period" series={PROFIT_SERIES} formatX={periodLabel} formatY={(v) => compactMoney(v).replace('Rs. ', '')} formatTip={money} />
                      <ChartLegend items={PROFIT_SERIES} />
                    </>
                  )}
                  table={(
                    <DataTable
                      rowKey="period"
                      rows={rows}
                      columns={[
                        periodCol,
                        { key: 'platformCommission', header: 'Commission from vendors', align: 'right', render: (r) => money(r.platformCommission) },
                        { key: 'riderCommission', header: 'Commission from riders', align: 'right', render: (r) => money(r.riderCommission) },
                        { key: 'profit', header: 'Total profit', align: 'right', render: (r) => <span className="cell-strong">{money(r.profit)}</span> },
                      ]}
                    />
                  )}
                />
              </Card>
            </>
          );
        }}
      </ReportState>
    </>
  );
}

function RevenueTab({ range }) {
  const query = useApi(() => reportsApi.revenue(range), [range.from, range.to], { key: 'report-revenue' });
  return (
    <ReportState query={query}>
      {(d) => {
        const riderCommission = d.riderCommission || 0;
        const riderPayout = riderPayoutOf(d);
        const profit = profitOf(d);
        const split = [
          { label: 'Paid to vendors', value: d.vendorPayout, color: 'var(--series-1)' },
          { label: 'Paid to riders', value: riderPayout, color: 'var(--violet)' },
          { label: 'Commission from vendors', value: d.platformCommission, color: 'var(--series-3)' },
          { label: 'Commission from riders', value: riderCommission, color: 'var(--chart-accent)' },
        ];
        const methods = Object.entries(d.byPaymentMethod || {});
        const fd = d.failedDeliveries || {};
        const rates = [d.commissionPercent != null && `Vendor ${d.commissionPercent}%`, d.riderCommissionPercent != null && `Rider ${d.riderCommissionPercent}%`].filter(Boolean).join(' · ');
        return (
          <>
            <div className="stat-grid">
              <StatCard icon={Receipt} label="Total sales" value={compactMoney(d.totalSales)} footer={`${num(d.deliveredOrders)} delivered orders · avg. ${money(d.avgOrderValue)}`} />
              <StatCard icon={TrendingUp} tone="blue" label="Total profit" value={compactMoney(profit)} footer={rates || 'Commission from vendors + riders'} />
              <StatCard icon={Percent} tone="violet" label="Commission from vendors" value={compactMoney(d.platformCommission)} footer={d.commissionPercent != null ? `${d.commissionPercent}% of product sales` : 'Share of product sales'} />
              <StatCard icon={Bike} tone="amber" label="Commission from riders" value={compactMoney(riderCommission)} footer={d.riderCommissionPercent != null ? `${d.riderCommissionPercent}% of delivery fees` : 'Share of delivery fees'} />
            </div>
            <div className="grid grid-main mb">
              <Card title="Where the money goes" subtitle="Split of total sales on delivered orders">
                {d.totalSales > 0 ? <Donut format={compactMoney} centerValue={compactMoney(d.totalSales)} centerLabel="Total sales" data={split} /> : <EmptyState title="No delivered orders" description="Nothing was delivered in this date range." />}
                <div className="totals" style={{ marginTop: 18 }}>
                  <div><span>Product sales</span><span>{money(d.productSales)}</span></div>
                  <div><span>Delivery fees</span><span>{money(d.deliveryFees)}</span></div>
                  <div><span>Paid to vendors</span><span className="neg">− {money(d.vendorPayout)}</span></div>
                  <div><span>Paid to riders (after commission)</span><span className="neg">− {money(riderPayout)}</span></div>
                  <div style={{ fontSize: 12.5 }}><span className="muted">Commission from vendors</span><span className="muted">{money(d.platformCommission)}</span></div>
                  <div style={{ fontSize: 12.5 }}><span className="muted">Commission from riders</span><span className="muted">{money(riderCommission)}</span></div>
                  <div className="grand"><span>Total profit</span><span>{money(profit)}</span></div>
                </div>
              </Card>
              <Card title="By payment method" subtitle="Delivered orders">
                {methods.length ? (
                  <>
                    <Donut
                      format={compactMoney}
                      centerValue={num(methods.reduce((s, [, m]) => s + m.orders, 0))}
                      centerLabel="Orders"
                      data={methods.map(([key, m], i) => ({ label: PAYMENT_METHODS[key] || titleCase(key), value: m.amount, color: i ? 'var(--chart-accent)' : 'var(--chart-brand)' }))}
                    />
                    <div className="totals" style={{ marginTop: 18 }}>
                      {methods.map(([key, m]) => <div key={key}><span>{PAYMENT_METHODS[key] || titleCase(key)} · {num(m.orders)} orders</span><span>{money(m.amount)}</span></div>)}
                    </div>
                  </>
                ) : <EmptyState title="No payments" description="No delivered orders in this range." />}
              </Card>
            </div>
            <Card title="Lost revenue" subtitle="Refunds, cancellations and failed deliveries in this range">
              <div className="mini-stats">
                <div className="mini-stat"><span>Refunds · {num(d.refunds?.count)}</span><strong>{money(d.refunds?.amount)}</strong></div>
                <div className="mini-stat"><span>Cancelled orders · {num(d.cancelledOrders?.count)}</span><strong>{money(d.cancelledOrders?.amount)}</strong></div>
                <div className="mini-stat"><span>Failed deliveries · {num(fd.count)}</span><strong>{money(fd.furanCost)}<small style={{ display: 'inline', marginLeft: 4 }}>Fauran Mart cost</small></strong></div>
                <div className="mini-stat"><span>Rider fees on failed (after commission)</span><strong>{money(fd.riderFeesPaid)}</strong></div>
                <div className="mini-stat"><span>Card refunds due</span><strong>{money(fd.cardRefundsDue)}</strong></div>
              </div>
            </Card>
          </>
        );
      }}
    </ReportState>
  );
}

function VendorsTab({ range }) {
  const { navigate } = useRouter();
  const { data, loading, error, reload } = useApi(() => reportsApi.vendors(range), [range.from, range.to], { key: 'report-vendors' });
  const max = Math.max(...(data || []).map((r) => r.totalSales), 1);
  return (
    <Card className="table-card" padded={false}>
      <DataTable
        loading={loading}
        error={error}
        onRetry={reload}
        rows={data}
        rowKey="_id"
        onRowClick={(r) => navigate(`/vendors/${r.vendorId}`)}
        empty={<EmptyState icon={Store} title="No vendor sales" description="No store delivered an order in this date range." />}
        columns={[
          { key: 'vendor', header: 'Store', render: (r) => <Identity name={r.storeName || r.vendorName} sub={`${r.vendorId} · ${r.ownerName || '—'}`} square /> },
          { key: 'totalSales', header: 'Total sales', width: 220, render: (r) => <div><strong style={{ color: 'var(--text)' }}>{compactMoney(r.totalSales)}</strong><div style={{ marginTop: 6 }}><Progress value={r.totalSales} max={max} /></div></div> },
          { key: 'totalOrders', header: 'Orders', align: 'right', render: (r) => num(r.totalOrders) },
          { key: 'platformCommission', header: 'Commission from vendor', align: 'right', hideOnMobile: true, render: (r) => money(r.platformCommission) },
          { key: 'vendorPayout', header: 'Paid to vendor', align: 'right', hideOnMobile: true, render: (r) => money(r.vendorPayout) },
          { key: 'avgOrderValue', header: 'Avg. order', align: 'right', hideOnMobile: true, render: (r) => money(r.avgOrderValue) },
          { key: 'cancelledOrders', header: 'Cancelled', align: 'right', render: (r) => <span className={r.cancelledOrders ? 'neg' : 'muted'}>{num(r.cancelledOrders)}</span> },
        ]}
      />
    </Card>
  );
}

function RidersTab({ range }) {
  const { navigate } = useRouter();
  const { data, loading, error, reload } = useApi(() => reportsApi.riders(range), [range.from, range.to], { key: 'report-riders' });
  return (
    <Card className="table-card" padded={false}>
      <DataTable
        loading={loading}
        error={error}
        onRetry={reload}
        rows={data}
        rowKey="_id"
        onRowClick={(r) => navigate(`/riders/${r.riderId}`)}
        empty={<EmptyState icon={Bike} title="No rider activity" description="No rider completed a delivery in this date range." />}
        columns={[
          { key: 'rider', header: 'Rider', render: (r) => <Identity name={r.name} sub={[r.riderId, titleCase(r.vehicleType || ''), r.vehicleNumber].filter(Boolean).join(' · ')} /> },
          { key: 'online', header: 'Status', hideOnMobile: true, render: (r) => <Badge tone={r.isOnline ? 'success' : 'neutral'} dot>{r.isOnline ? 'Online' : 'Offline'}</Badge> },
          { key: 'deliveries', header: 'Deliveries', align: 'right', render: (r) => num(r.deliveries) },
          { key: 'failedAttempts', header: 'Failed', align: 'right', render: (r) => <span className={r.failedAttempts ? 'neg' : 'muted'}>{num(r.failedAttempts ?? 0)}</span> },
          { key: 'avg', header: 'Avg. delivery', align: 'right', hideOnMobile: true, render: (r) => (r.avgDeliveryMinutes == null ? <span className="muted">—</span> : `${Math.round(r.avgDeliveryMinutes)} min`) },
          { key: 'cashCollected', header: 'Cash collected', align: 'right', hideOnMobile: true, render: (r) => compactMoney(r.cashCollected) },
          { key: 'deliveryEarnings', header: 'Earnings (after commission)', align: 'right', hideOnMobile: true, render: (r) => money(r.deliveryEarnings) },
          { key: 'rating', header: 'Rating', render: (r) => <span title={`${num(r.totalRatings)} ratings`}><Rating value={r.rating} /></span> },
        ]}
      />
    </Card>
  );
}

export default function Reports() {
  const { can } = useAuth();
  const tabs = can('reports') ? [
    { value: 'sales', label: 'Sales', icon: ShoppingBag },
    { value: 'revenue', label: 'Revenue', icon: Wallet },
    { value: 'vendors', label: 'Vendors', icon: Store },
    { value: 'riders', label: 'Riders', icon: Bike },
  ] : [];
  const [tabParam, setTab] = useQueryState('tab', 'sales');
  const tab = tabs.some((t) => t.value === tabParam) ? tabParam : tabs[0]?.value;
  const { range, setRange, preset, setPreset } = useDateRange();
  return (
    <>
      <PageHeader
        title="Reports"
        description="How the marketplace is doing - sales, revenue, store and rider performance. Figures count delivered orders only."
        actions={tab && (
          <>
            <Segmented value={preset} onChange={setPreset} options={PRESETS} />
            <DateRange from={range.from} to={range.to} onChange={setRange} />
          </>
        )}
      />
      {tabs.length ? <Tabs value={tab} onChange={setTab} tabs={tabs} /> : <Card><EmptyState title="No access" description="Your role can't view reports." /></Card>}
      {tab === 'sales' && <SalesTab range={range} />}
      {tab === 'revenue' && <RevenueTab range={range} />}
      {tab === 'vendors' && <VendorsTab range={range} />}
      {tab === 'riders' && <RidersTab range={range} />}
    </>
  );
}
