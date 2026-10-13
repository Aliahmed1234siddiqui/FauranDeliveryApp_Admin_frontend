import { useState } from 'react';
import { ArrowRight, Banknote, Bike, PackageX, Percent, Receipt, ShoppingBag, Store, Users, Wallet } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { adminApi } from '../services/adminApi';
import { compactMoney, compactNum, money, num, shortDay, timeAgo } from '../lib/format';
import { Badge, Button, Card, EmptyState, Identity, Segmented, Skeleton, StatCard, StatusBadge } from '../ui/primitives';
import { BarList, LineChart, Sparkline } from '../ui/charts';

const PIPELINE = [
  ['placed', 'Placed', 'var(--info)'],
  ['preparing', 'Preparing', 'var(--warning)'],
  ['rider_assigned', 'Rider assigned', 'var(--violet)'],
  ['on_the_way', 'On the way', 'var(--brand)'],
  ['delivered', 'Delivered', 'var(--success)'],
  ['cancelled', 'Cancelled', 'var(--danger)'],
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const { admin, can } = useAuth();
  const { navigate } = useRouter();
  const [range, setRange] = useState('14');
  const summary = useApi(() => adminApi.getDashboardSummary(), []);
  const sales = useApi(() => (can('reports', 'dashboard') ? adminApi.getSalesReport({ days: range }) : Promise.resolve(null)), [range]);
  const commission = useApi(() => adminApi.getCommissionByVendor(), []);
  const lowStock = useApi(() => (can('inventory', 'dashboard') ? adminApi.getLowStock() : Promise.resolve([])), []);
  const s = summary.data;
  const [metric, setMetric] = useState('orders');

  return (
    <>
      <div className="hero">
        <div>
          <h1>{greeting()}, {admin?.name?.split(' ')[0]} 👋</h1>
          <p>Here&apos;s what&apos;s happening across Fauran today, {new Date('2026-10-13').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
        </div>
        <div className="hero-chips">
          <button type="button" className="hero-chip" onClick={() => navigate('/orders')}>
            <span className="live-dot" />
            <div><strong>{s ? s.liveOrders : '–'}</strong><small>Live orders</small></div>
          </button>
          <button type="button" className="hero-chip" onClick={() => navigate('/vendors?status=pending')}>
            <div><strong>{s ? s.pendingApprovals.vendors + s.pendingApprovals.riders : '–'}</strong><small>Awaiting approval</small></div>
          </button>
          <button type="button" className="hero-chip" onClick={() => navigate('/orders?status=return_requested')}>
            <div><strong>{s ? s.returnsOpen : '–'}</strong><small>Open returns</small></div>
          </button>
        </div>
      </div>

      <div className="stat-grid">
        {s ? (
          <>
            <StatCard icon={ShoppingBag} label="Orders today" value={num(s.ordersToday)} trend={s.ordersTrend} trendLabel="vs. yesterday" spark={<Sparkline values={s.sparkOrders} />} onClick={() => navigate('/orders')} />
            <StatCard icon={Receipt} tone="amber" label="GMV today" value={compactMoney(s.gmvToday)} trend={s.gmvTrend} trendLabel="Gross merchandise value" spark={<Sparkline values={s.sparkGmv} color="var(--chart-accent)" />} />
            <StatCard icon={Percent} tone="violet" label="Commission earned" value={compactMoney(s.commissionToday)} trend={s.commissionTrend} trendLabel="From partner stores" />
            <StatCard icon={Wallet} tone="blue" label="Avg. order value" value={money(s.avgOrderValue)} trend={s.aovTrend} trendLabel="Last 24 hours" />
          </>
        ) : Array.from({ length: 4 }).map((_, i) => <div className="stat-card" key={i}><Skeleton w={38} h={38} r={11} /><div style={{ height: 14 }} /><Skeleton w="50%" /><div style={{ height: 8 }} /><Skeleton w="70%" h={26} /></div>)}
      </div>

      <div className="grid grid-main mb">
        <Card
          title="Marketplace performance"
          subtitle={`Last ${range} days`}
          action={(
            <>
              <Segmented value={metric} onChange={setMetric} options={[{ value: 'orders', label: 'Orders' }, { value: 'gmv', label: 'GMV' }]} />
              <Segmented value={range} onChange={setRange} options={[{ value: '7', label: '7D' }, { value: '14', label: '14D' }, { value: '30', label: '30D' }]} />
            </>
          )}
        >
          {sales.data ? (
            <>
              <div className="chart-headline">
                <div><span>Total orders</span><strong>{num(sales.data.totals.orders)}</strong></div>
                <div><span>Total GMV</span><strong>{compactMoney(sales.data.totals.gmv)}</strong></div>
                <div><span>Avg. order value</span><strong>{money(sales.data.totals.aov)}</strong></div>
              </div>
              <LineChart
                data={sales.data.series}
                x="date"
                series={[{ key: metric, label: metric === 'orders' ? 'Orders' : 'GMV', color: 'var(--chart-brand)' }]}
                formatX={(d) => shortDay(d)}
                formatY={(v) => (metric === 'gmv' ? compactMoney(v).replace('Rs. ', '') : compactNum(v))}
                formatTip={(v) => (metric === 'gmv' ? money(v) : num(v))}
                height={270}
              />
            </>
          ) : <Skeleton h={320} r={12} />}
        </Card>

        <Card title="Order pipeline" subtitle="Live status across all stores" action={<Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate('/orders')}>All orders</Button>}>
          {s ? (
            <>
              <div className="pipeline">
                {PIPELINE.map(([key, label, color]) => (
                  <button type="button" key={key} className="pipeline-step" onClick={() => navigate(`/orders?status=${key}`)}>
                    <strong>{s.statusBreakdown[key] || 0}</strong>
                    <span><i style={{ background: color }} />{label}</span>
                  </button>
                ))}
              </div>
              <div className="mini-stats" style={{ marginTop: 16 }}>
                <div className="mini-stat"><span>Riders online</span><strong>{s.onlineRiders}<small style={{ display: 'inline', marginLeft: 4 }}>/ {s.totalRiders}</small></strong></div>
                <div className="mini-stat"><span>COD held by riders</span><strong>{compactMoney(s.codHeldByRiders)}</strong></div>
              </div>
            </>
          ) : <Skeleton h={260} r={12} />}
        </Card>
      </div>

      <div className="grid grid-3 mb">
        <Card title="Top stores by sales" subtitle="Commission earned per vendor" action={<Button variant="ghost" size="sm" onClick={() => navigate('/reports?tab=vendors')}>Report</Button>}>
          {commission.data ? (
            <BarList
              items={commission.data.slice(0, 5).map((c) => ({ key: c.vendor._id, label: c.vendor.name, value: c.grossSales, meta: c.commission ? `${compactMoney(c.commission)} comm.` : 'Dark store' }))}
              format={compactMoney}
              onItemClick={(i) => navigate(`/vendors/${i.key}`)}
            />
          ) : <Skeleton h={220} />}
        </Card>

        <Card title="Needs approval" subtitle="Applications and listings waiting on you">
          {s ? (
            <div className="list">
              {[
                { icon: Store, tone: 'tone-amber', label: 'Vendor applications', count: s.pendingApprovals.vendors, to: '/vendors?status=pending' },
                { icon: Bike, tone: 'tone-violet', label: 'Rider applications', count: s.pendingApprovals.riders, to: '/riders?status=pending' },
                { icon: PackageX, tone: 'tone-blue', label: 'Product listings', count: s.pendingApprovals.products, to: '/products?status=pending' },
                { icon: Banknote, tone: 'tone-brand', label: 'Rider COD to collect', count: compactMoney(s.codHeldByRiders), to: '/payouts?tab=riders' },
              ].map((r) => (
                <div key={r.label} className="list-item is-clickable" onClick={() => navigate(r.to)}>
                  <span className={`stat-icon ${r.tone}`} style={{ width: 34, height: 34 }}><r.icon size={16} /></span>
                  <div className="identity-copy"><strong>{r.label}</strong></div>
                  <div className="list-item-end row"><Badge tone={r.count ? 'warning' : 'neutral'}>{r.count}</Badge><ArrowRight size={15} className="muted" /></div>
                </div>
              ))}
            </div>
          ) : <Skeleton h={220} />}
        </Card>

        <Card title="Low stock alerts" subtitle="Below reorder level" action={<Button variant="ghost" size="sm" onClick={() => navigate('/inventory?stock=low')}>Inventory</Button>}>
          {lowStock.data ? (lowStock.data.length ? (
            <div className="list">
              {lowStock.data.slice(0, 5).map((p) => (
                <div key={p._id} className="list-item">
                  <Identity icon={p.icon} name={p.name} sub={p.vendor.storeName} />
                  <div className="list-item-end">
                    {p.stock === 0 ? <Badge tone="danger">Out</Badge> : <Badge tone="warning">{p.stock} left</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="All stocked up" description="No SKUs are below their reorder level." />) : <Skeleton h={220} />}
        </Card>
      </div>

      <Card title="Latest orders" subtitle="Most recent activity across the marketplace" action={<Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => navigate('/orders')}>View all</Button>} className="table-card card-flush">
        <div className="table-scroll" style={{ marginTop: 14 }}>
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Store</th><th>Total</th><th>Status</th><th className="hide-sm">Placed</th></tr></thead>
            <tbody>
              {(s?.recentOrders || []).map((o) => (
                <tr key={o._id} className="is-clickable" onClick={() => navigate(`/orders/${o.orderId}`)}>
                  <td><span className="mono-chip">{o.orderId}</span></td>
                  <td><Identity name={o.customer.name} sub={o.paymentMethod.toUpperCase()} /></td>
                  <td className="hide-sm">{o.vendor.storeName}</td>
                  <td className="cell-strong">{money(o.total)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="hide-sm">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
              {!s && Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6}><Skeleton /></td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      {s && (
        <div className="stat-grid" style={{ marginTop: 18 }}>
          <StatCard icon={Store} tone="brand" label="Active vendors" value={s.activeVendors} footer="Dark stores + partner kiryana" onClick={() => navigate('/vendors')} />
          <StatCard icon={Bike} tone="violet" label="Riders online now" value={`${s.onlineRiders} / ${s.totalRiders}`} footer={<><span className="live-dot" /> Live on the map</>} onClick={() => navigate('/riders/live')} />
          <StatCard icon={Users} tone="blue" label="Customers" value={num(s.totalCustomers)} footer={`+${s.newCustomersToday} signed up today`} onClick={() => navigate('/customers')} />
        </div>
      )}
    </>
  );
}
