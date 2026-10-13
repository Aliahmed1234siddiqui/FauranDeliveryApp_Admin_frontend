import { useState } from 'react';
import { BarChart3, Bike, BrainCircuit, Download, Receipt, ShoppingBag, Star, Store, Table2, TrendingUp } from 'lucide-react';
import { useQueryState, useRouter } from '../lib/router';
import { useApi } from '../lib/hooks';
import { adminApi } from '../services/adminApi';
import { compactMoney, compactNum, money, num, pct, shortDay } from '../lib/format';
import { Badge, Button, Card, Identity, Progress, Segmented, Skeleton, StatCard, Tabs, PageHeader } from '../ui/primitives';
import { BarChart, ChartLegend, Donut, LineChart } from '../ui/charts';
import DataTable from '../ui/DataTable';

const RANGES = [{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }];

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

function SalesTab({ days }) {
  const { data } = useApi(() => adminApi.getSalesReport({ days }), [days]);
  if (!data) return <Skeleton h={420} r={16} />;
  const { series, totals } = data;
  const half = Math.floor(series.length / 2);
  const growth = ((series.slice(half).reduce((s, d) => s + d.orders, 0) / (series.slice(0, half).reduce((s, d) => s + d.orders, 0) || 1)) - 1) * 100;
  return (
    <>
      <div className="stat-grid">
        <StatCard icon={ShoppingBag} label="Orders" value={num(totals.orders)} trend={+growth.toFixed(1)} trendLabel="2nd half vs 1st half of period" />
        <StatCard icon={Receipt} tone="amber" label="GMV" value={compactMoney(totals.gmv)} footer="Gross merchandise value" />
        <StatCard icon={TrendingUp} tone="violet" label="Avg. order value" value={money(totals.aov)} footer={`${num(Math.round(totals.orders / series.length))} orders / day`} />
      </div>
      <div className="grid grid-2">
        <Card title="Daily orders">
          <ChartOrTable
            label="Orders view"
            chart={<LineChart data={series} x="date" series={[{ key: 'orders', label: 'Orders', color: 'var(--chart-brand)' }]} formatX={shortDay} formatY={compactNum} formatTip={num} />}
            table={<DataTable rowKey="date" columns={[{ key: 'date', header: 'Date', render: (d) => shortDay(d.date) }, { key: 'orders', header: 'Orders', align: 'right', render: (d) => num(d.orders) }]} rows={series} />}
          />
        </Card>
        <Card title="Daily GMV">
          <ChartOrTable
            label="GMV view"
            chart={<BarChart data={series} x="date" y="gmv" formatX={shortDay} formatY={(v, tip) => (tip ? money(v) : compactMoney(v).replace('Rs. ', ''))} highlightLast />}
            table={<DataTable rowKey="date" columns={[{ key: 'date', header: 'Date', render: (d) => shortDay(d.date) }, { key: 'gmv', header: 'GMV', align: 'right', render: (d) => money(d.gmv) }]} rows={series} />}
          />
        </Card>
      </div>
    </>
  );
}

function RevenueTab({ days }) {
  const { data } = useApi(() => adminApi.getRevenueReport({ days }), [days]);
  if (!data) return <Skeleton h={420} r={16} />;
  const b = data.breakdown;
  const gross = b.commission + b.deliveryFees + b.darkStoreMargin;
  const rows = [
    ['Commission from partner stores', b.commission, 'pos'],
    ['Delivery fees', b.deliveryFees, 'pos'],
    ['Dark-store margin', b.darkStoreMargin, 'pos'],
    ['Discounts & promos', -b.discounts, 'neg'],
    ['Refunds', -b.refunds, 'neg'],
  ];
  return (
    <>
      <div className="stat-grid">
        <StatCard icon={Receipt} label="Net revenue" value={compactMoney(b.net)} footer={`${pct((b.net / gross) * 100, 0)} of gross kept after discounts & refunds`} />
        <StatCard icon={Store} tone="amber" label="Commission" value={compactMoney(b.commission)} footer="From partner kiryana stores" />
        <StatCard icon={Bike} tone="violet" label="Delivery fees" value={compactMoney(b.deliveryFees)} footer="Charged to customers" />
      </div>
      <div className="grid grid-main">
        <Card title="Commission over time">
          <LineChart data={data.series} x="date" series={[{ key: 'commission', label: 'Commission', color: 'var(--chart-brand)' }, { key: 'deliveryFees', label: 'Delivery fees', color: 'var(--series-1)', area: false }]} formatX={shortDay} formatY={(v) => compactMoney(v).replace('Rs. ', '')} formatTip={money} />
          <div style={{ marginTop: 12 }}><ChartLegend items={[{ label: 'Commission', color: 'var(--chart-brand)' }, { label: 'Delivery fees', color: 'var(--series-1)' }]} /></div>
        </Card>
        <Card title="Where revenue comes from">
          <Donut format={compactMoney} centerValue={compactMoney(gross)} centerLabel="Gross" data={[{ label: 'Commission', value: b.commission, color: 'var(--series-1)' }, { label: 'Delivery fees', value: b.deliveryFees, color: 'var(--series-2)' }, { label: 'Dark-store margin', value: b.darkStoreMargin, color: 'var(--series-3)' }]} />
          <div className="totals" style={{ marginTop: 18 }}>
            {rows.map(([label, v, cls]) => <div key={label}><span>{label}</span><span className={cls}>{v < 0 ? '− ' : ''}{money(Math.abs(v))}</span></div>)}
            <div className="grand"><span>Net revenue</span><span>{money(b.net)}</span></div>
          </div>
        </Card>
      </div>
    </>
  );
}

function VendorsTab() {
  const { navigate } = useRouter();
  const { data, loading } = useApi(() => adminApi.getVendorReport(), []);
  const max = Math.max(...(data || []).map((r) => r.gmv), 1);
  return (
    <Card className="table-card" padded={false}>
      <DataTable
        loading={loading}
        rows={data}
        rowKey={(r) => r.vendor._id}
        onRowClick={(r) => navigate(`/vendors/${r.vendor.vendorId}`)}
        columns={[
          { key: 'vendor', header: 'Store', render: (r) => <Identity name={r.vendor.storeName} sub={r.vendor.storeType === 'dark_store' ? 'Dark store' : 'Partner kiryana'} square /> },
          { key: 'gmv', header: 'GMV', width: 220, render: (r) => <div><strong style={{ color: 'var(--text)' }}>{compactMoney(r.gmv)}</strong><div style={{ marginTop: 6 }}><Progress value={r.gmv} max={max} /></div></div> },
          { key: 'orders', header: 'Orders', align: 'right', render: (r) => num(r.orders) },
          { key: 'commission', header: 'Commission', align: 'right', hideOnMobile: true, render: (r) => (r.commission ? money(r.commission) : <span className="muted">—</span>) },
          { key: 'fulfil', header: 'Fulfilment', align: 'right', hideOnMobile: true, render: (r) => <span className={r.fulfilmentRate < 95 ? 'neg' : 'pos'}>{pct(r.fulfilmentRate)}</span> },
          { key: 'prep', header: 'Avg. prep', align: 'right', hideOnMobile: true, render: (r) => `${r.avgPrepMinutes} min` },
          { key: 'rating', header: 'Rating', render: (r) => <span className="row" style={{ gap: 4 }}><Star size={13} fill="var(--accent)" color="var(--accent)" />{r.rating}</span> },
        ]}
      />
    </Card>
  );
}

function RidersTab() {
  const { navigate } = useRouter();
  const { data, loading } = useApi(() => adminApi.getRiderReport(), []);
  return (
    <Card className="table-card" padded={false}>
      <DataTable
        loading={loading}
        rows={data}
        rowKey={(r) => r.rider._id}
        onRowClick={(r) => navigate(`/riders/${r.rider.riderId}`)}
        columns={[
          { key: 'rider', header: 'Rider', render: (r) => <Identity name={r.rider.name} sub={`${r.rider.riderId} · ${r.rider.zone}`} /> },
          { key: 'deliveries', header: 'Deliveries', align: 'right', render: (r) => num(r.deliveries) },
          { key: 'ontime', header: 'On-time', width: 170, render: (r) => <div><span className={r.onTimeRate < 92 ? 'neg strong' : 'strong'}>{pct(r.onTimeRate)}</span><div style={{ marginTop: 6 }}><Progress value={r.onTimeRate} tone={r.onTimeRate < 92 ? 'warning' : 'success'} /></div></div> },
          { key: 'avg', header: 'Avg. delivery', align: 'right', hideOnMobile: true, render: (r) => `${r.avgDeliveryMin} min` },
          { key: 'cod', header: 'COD collected', align: 'right', hideOnMobile: true, render: (r) => compactMoney(r.codCollected) },
          { key: 'earnings', header: 'Earnings', align: 'right', hideOnMobile: true, render: (r) => money(r.earnings) },
          { key: 'rating', header: 'Rating', render: (r) => <span className="row" style={{ gap: 4 }}><Star size={13} fill="var(--accent)" color="var(--accent)" />{r.rating}</span> },
        ]}
      />
    </Card>
  );
}

function ForecastTab() {
  const { navigate } = useRouter();
  const { data } = useApi(() => adminApi.getForecast(), []);
  if (!data) return <Skeleton h={420} r={16} />;
  const last = data.history[data.history.length - 1];
  const merged = [
    ...data.history.map((h) => ({ date: h.date, actual: h.actual })),
    ...data.forecast.map((f, i) => ({ date: f.date, predicted: f.predicted, low: f.low, high: f.high, ...(i === 0 ? {} : {}) })),
  ];
  // join the two lines so the forecast starts where actuals end
  merged[data.history.length - 1] = { ...merged[data.history.length - 1], predicted: last.actual, low: last.actual, high: last.actual };
  const nextWeek = data.forecast.slice(0, 7).reduce((s, f) => s + f.predicted, 0);
  return (
    <>
      <div className="stat-grid">
        <StatCard icon={BrainCircuit} label="Orders expected next 7 days" value={num(nextWeek)} footer={`${data.model.name} · ±10% band`} />
        <StatCard icon={TrendingUp} tone="violet" label="Model accuracy" value={pct(data.model.accuracy)} footer="Backtested on the last 30 days" />
        <StatCard icon={Store} tone="rose" label="SKUs at risk" value={data.atRisk.length} footer="Less than 7 days of stock" onClick={() => navigate('/inventory?stock=low')} />
      </div>
      <div className="grid grid-main">
        <Card title="Order demand forecast" subtitle={`Actuals for the last 3 weeks, forecast for the next ${data.model.horizonDays} days`}>
          <LineChart
            data={merged}
            x="date"
            series={[{ key: 'actual', label: 'Actual', color: 'var(--chart-brand)' }, { key: 'predicted', label: 'Forecast', color: 'var(--chart-brand)', dashed: true }]}
            band={{ low: 'low', high: 'high' }}
            formatX={shortDay}
            formatY={compactNum}
            formatTip={num}
            height={290}
          />
          <div style={{ marginTop: 12 }}><ChartLegend items={[{ label: 'Actual orders', color: 'var(--chart-brand)' }, { label: 'Forecast', color: 'var(--chart-brand)', dashed: true }, { label: 'Likely range', color: 'color-mix(in srgb, var(--chart-brand) 25%, transparent)' }]} /></div>
        </Card>
        <Card title="Restock suggestions" subtitle="Based on 14 days of forecast demand" padded className="card-flush">
          <div className="list" style={{ padding: '14px 20px 18px' }}>
            {data.atRisk.length === 0 && <p className="muted">Every SKU has at least a week of cover.</p>}
            {data.atRisk.slice(0, 7).map((r) => (
              <div className="list-item" key={r.product.productId + r.vendor._id}>
                <Identity icon={r.product.icon} name={r.product.name} sub={`${r.vendor.storeName} · ${r.dailyDemand}/day`} />
                <div className="list-item-end">
                  <Badge tone={r.daysOfCover < 2 ? 'danger' : 'warning'}>{r.daysOfCover}d left</Badge>
                  <small style={{ marginTop: 4 }}>order {r.suggestedReorder}</small>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export default function Reports() {
  const [tab, setTab] = useQueryState('tab', 'sales');
  const [days, setDays] = useQueryState('days', '30');
  const showRange = tab === 'sales' || tab === 'revenue';
  return (
    <>
      <PageHeader
        title="Reports"
        description="How the marketplace is doing - sales, revenue, store and rider performance, and what to expect next."
        actions={(
          <>
            {showRange && <Segmented value={days} onChange={setDays} options={RANGES} />}
            <Button variant="secondary" icon={Download}>Export</Button>
          </>
        )}
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'sales', label: 'Sales', icon: ShoppingBag },
          { value: 'revenue', label: 'Revenue', icon: Receipt },
          { value: 'vendors', label: 'Vendors', icon: Store },
          { value: 'riders', label: 'Riders', icon: Bike },
          { value: 'forecast', label: 'Forecast', icon: BrainCircuit },
        ]}
      />
      {tab === 'sales' && <SalesTab days={days} />}
      {tab === 'revenue' && <RevenueTab days={days} />}
      {tab === 'vendors' && <VendorsTab />}
      {tab === 'riders' && <RidersTab />}
      {tab === 'forecast' && <ForecastTab />}
    </>
  );
}
