import { useState } from 'react';
import { ArrowRight, Bike, CalendarDays, PackageX, Percent, Receipt, ShoppingBag, Store, Users } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { useRouter } from '../lib/router';
import { dashboardApi, inventoryApi } from '../services/api';
import { compactMoney, compactNum, lastDays, money, num, periodLabel, timeAgo, titleCase } from '../lib/format';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../lib/constants';
import { Badge, Button, Card, EmptyState, ErrorState, Identity, Segmented, Skeleton, StatCard, StatusBadge } from '../ui/primitives';
import { BarList, LineChart } from '../ui/charts';

const STATUS_COLORS = {
  placed: 'var(--info)',
  accepted: 'var(--info)',
  preparing: 'var(--warning)',
  ready: 'var(--warning)',
  rider_assigned: 'var(--violet)',
  picked_up: 'var(--violet)',
  on_the_way: 'var(--brand)',
  delivered: 'var(--success)',
  cancelled: 'var(--danger)',
  delivery_failed: 'var(--danger)',
  returned: 'var(--text-3)',
};

const nothing = () => Promise.resolve(null);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

const StatSkeletons = ({ count }) => Array.from({ length: count }).map((_, i) => (
  <div className="stat-card" key={i}><Skeleton w={38} h={38} r={11} /><div style={{ height: 14 }} /><Skeleton w="50%" /><div style={{ height: 8 }} /><Skeleton w="70%" h={26} /></div>
));

function SalesCard({ range, setRange }) {
  const { can } = useAuth();
  const [metric, setMetric] = useState('orderCount');
  const sales = useApi(() => (can('reports', 'dashboard') ? dashboardApi.sales({ groupBy: 'day', ...lastDays(range) }) : nothing()), [range]);
  const rows = sales.data || [];
  const totals = rows.reduce((t, r) => ({ orders: t.orders + r.orderCount, sales: t.sales + r.totalSales, commission: t.commission + r.platformCommission }), { orders: 0, sales: 0, commission: 0 });
  const isMoney = metric !== 'orderCount';

  let body;
  if (sales.error && !sales.data) body = <ErrorState error={sales.error} onRetry={sales.reload} />;
  else if (!sales.data) body = <Skeleton h={320} r={12} />;
  else if (!rows.length) body = <EmptyState title="No delivered orders" description={`Nothing was delivered in the last ${range} days.`} />;
  else {
    body = (
      <>
        <div className="chart-headline">
          <div><span>Delivered orders</span><strong>{num(totals.orders)}</strong></div>
          <div><span>Total sales</span><strong>{compactMoney(totals.sales)}</strong></div>
          <div><span>Commission</span><strong>{compactMoney(totals.commission)}</strong></div>
        </div>
        <LineChart
          data={rows}
          x="period"
          series={[{ key: metric, label: isMoney ? 'Sales' : 'Orders', color: 'var(--chart-brand)' }]}
          formatX={periodLabel}
          formatY={(v) => (isMoney ? compactMoney(v).replace('Rs. ', '') : compactNum(v))}
          formatTip={(v) => (isMoney ? money(v) : num(v))}
          height={270}
        />
      </>
    );
  }

  return (
    <Card
      title="Marketplace performance"
      subtitle={`Delivered orders, last ${range} days`}
      action={(
        <>
          <Segmented value={metric} onChange={setMetric} options={[{ value: 'orderCount', label: 'Orders' }, { value: 'totalSales', label: 'Sales' }]} />
          <Segmented value={range} onChange={setRange} options={[{ value: '7', label: '7D' }, { value: '14', label: '14D' }, { value: '30', label: '30D' }]} />
        </>
      )}
    >
      {body}
    </Card>
  );
}

function TopStoresCard() {
  const { navigate } = useRouter();
  const commission = useApi(() => dashboardApi.commission(), []);
  // Older backends return { vendorName, totalRevenue, totalCommission }; reports use vendorRow names.
  const items = (commission.data || []).slice(0, 5).map((c) => ({
    key: c.vendorId || c._id,
    label: c.storeName || c.vendorName,
    value: c.totalRevenue ?? c.totalSales ?? 0,
    meta: `${compactMoney(c.totalCommission ?? c.platformCommission)} comm.`,
  }));
  return (
    <Card title="Top stores by sales" subtitle="Commission earned per vendor" action={<Button variant="ghost" size="sm" onClick={() => navigate('/reports?tab=vendors')}>Report</Button>}>
      {commission.error && !commission.data ? <ErrorState error={commission.error} onRetry={commission.reload} />
        : !commission.data ? <Skeleton h={220} />
          : items.length ? <BarList items={items} format={compactMoney} onItemClick={(i) => navigate(`/vendors/${i.key}`)} />
            : <EmptyState title="No sales yet" description="Stores appear here once orders are delivered." />}
    </Card>
  );
}

function LowStockCard() {
  const { navigate } = useRouter();
  const lowStock = useApi(() => inventoryApi.lowStock(), []);
  const rows = lowStock.data || [];
  return (
    <Card title="Low stock alerts" subtitle="Below the low-stock threshold" action={<Button variant="ghost" size="sm" onClick={() => navigate('/inventory')}>Inventory</Button>}>
      {lowStock.error && !lowStock.data ? <ErrorState error={lowStock.error} onRetry={lowStock.reload} />
        : !lowStock.data ? <Skeleton h={220} />
          : rows.length ? (
            <div className="list">
              {rows.slice(0, 5).map((p) => (
                <div key={p._id} className="list-item">
                  <Identity name={p.name} sub={p.vendor?.storeName} square />
                  <div className="list-item-end">
                    {p.stock === 0 ? <Badge tone="danger">Out</Badge> : <Badge tone="warning">{p.stock} {p.unit || ''} left</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState title="All stocked up" description="No products are below the low-stock threshold." />}
    </Card>
  );
}

function RankCard({ title, subtitle, rows, onItemClick, toItem }) {
  return (
    <Card title={title} subtitle={subtitle}>
      {rows.length ? <BarList items={rows.slice(0, 5).map(toItem)} format={num} onItemClick={onItemClick} />
        : <EmptyState title="No activity yet" description="Rankings appear once orders are delivered." />}
    </Card>
  );
}

export default function Dashboard() {
  const { admin, can } = useAuth();
  const { navigate } = useRouter();
  const [range, setRange] = useState('14');
  const summary = useApi(() => (can('dashboard') ? dashboardApi.summary() : nothing()), []);
  const s = summary.data;
  const pendingApprovals = s ? s.users.vendors.pending + s.users.riders.pending : 0;
  const statuses = s ? ORDER_STATUSES.filter((k) => s.orders.byStatus?.[k]) : [];

  return (
    <>
      <div className="hero">
        <div>
          <h1>{greeting()}, {admin?.name?.split(' ')[0]} 👋</h1>
          <p>Here&apos;s what&apos;s happening across Fauran today, {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
        </div>
        {s && (
          <div className="hero-chips">
            <button type="button" className="hero-chip" onClick={() => navigate('/orders')}>
              <span className="live-dot" />
              <div><strong>{num(s.orders.active)}</strong><small>Active orders</small></div>
            </button>
            <button type="button" className="hero-chip" onClick={() => navigate('/vendors?status=pending')}>
              <div><strong>{num(pendingApprovals)}</strong><small>Awaiting approval</small></div>
            </button>
            <button type="button" className="hero-chip" onClick={() => navigate('/orders?status=delivery_failed')}>
              <div><strong>{num(s.orders.failedDeliveries)}</strong><small>Failed deliveries</small></div>
            </button>
          </div>
        )}
      </div>

      {summary.error && !s && <Card className="mb"><ErrorState error={summary.error} onRetry={summary.reload} /></Card>}

      <div className="stat-grid">
        {s ? (
          <>
            <StatCard icon={ShoppingBag} label="Orders today" value={num(s.orders.today)} footer={`${num(s.revenue.today.orders)} delivered so far`} onClick={() => navigate('/orders')} />
            <StatCard icon={Receipt} tone="amber" label="Sales today" value={compactMoney(s.revenue.today.totalSales)} footer="Products + delivery, delivered orders" />
            <StatCard icon={Percent} tone="violet" label="Commission today" value={compactMoney(s.revenue.today.platformCommission)} footer={`${s.commissionPercent}% of product sales`} />
            <StatCard icon={CalendarDays} tone="blue" label="Sales this month" value={compactMoney(s.revenue.thisMonth.totalSales)} footer={`${num(s.revenue.thisMonth.orders)} orders · ${compactMoney(s.revenue.thisMonth.platformCommission)} commission`} />
          </>
        ) : !summary.error && <StatSkeletons count={4} />}
      </div>

      <div className="grid grid-main mb">
        <SalesCard range={range} setRange={setRange} />

        <Card title="Order pipeline" subtitle="Orders by current status" action={<Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate('/orders')}>All orders</Button>}>
          {s ? (
            <>
              {statuses.length ? (
                <div className="pipeline">
                  {statuses.map((key) => (
                    <button type="button" key={key} className="pipeline-step" onClick={() => navigate(`/orders?status=${key}`)}>
                      <strong>{num(s.orders.byStatus[key])}</strong>
                      <span><i style={{ background: STATUS_COLORS[key] }} />{titleCase(key)}</span>
                    </button>
                  ))}
                </div>
              ) : <EmptyState title="No orders yet" />}
              <div className="mini-stats" style={{ marginTop: 16 }}>
                <div className="mini-stat"><span>Riders online</span><strong>{num(s.users.riders.online)}<small style={{ display: 'inline', marginLeft: 4 }}>/ {num(s.users.riders.approved)}</small></strong></div>
                <div className="mini-stat"><span>Orders all-time</span><strong>{num(s.orders.total)}</strong></div>
              </div>
            </>
          ) : <Skeleton h={260} r={12} />}
        </Card>
      </div>

      <div className="grid grid-3 mb">
        {can('dashboard', 'reports') && <TopStoresCard />}

        <Card title="Needs approval" subtitle="Applications and listings waiting on you">
          {s ? (
            <div className="list">
              {[
                { icon: Store, tone: 'tone-amber', label: 'Vendor applications', count: s.users.vendors.pending, to: '/vendors?status=pending' },
                { icon: Bike, tone: 'tone-violet', label: 'Rider applications', count: s.users.riders.pending, to: '/riders?status=pending' },
                { icon: PackageX, tone: 'tone-blue', label: 'Product listings', count: s.inventory.pendingApproval, to: '/products?approval=pending' },
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

        {can('dashboard', 'inventory') && <LowStockCard />}
      </div>

      {s && (
        <div className="grid grid-2 mb">
          <RankCard
            title="Top vendors"
            subtitle="Most delivered orders"
            rows={s.topVendors || []}
            toItem={(v) => ({ key: v.vendorId, label: v.storeName || v.vendorName, value: v.totalOrders, meta: compactMoney(v.totalSales) })}
            onItemClick={(i) => navigate(`/vendors/${i.key}`)}
          />
          <RankCard
            title="Top riders"
            subtitle="Most deliveries"
            rows={s.topRiders || []}
            toItem={(r) => ({ key: r.riderId, label: r.name, value: r.deliveries, meta: r.rating ? `★ ${r.rating}` : undefined })}
            onItemClick={(i) => navigate(`/riders/${i.key}`)}
          />
        </div>
      )}

      <Card title="Latest orders" subtitle="Most recent activity across the marketplace" action={<Button variant="secondary" size="sm" iconRight={ArrowRight} onClick={() => navigate('/orders')}>View all</Button>} className="table-card card-flush">
        <div className="table-scroll" style={{ marginTop: 14 }}>
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Store</th><th>Total</th><th>Status</th><th className="hide-sm">Placed</th></tr></thead>
            <tbody>
              {(s?.recentOrders || []).map((o) => (
                <tr key={o._id} className="is-clickable" onClick={() => navigate(`/orders/${o.orderId}`)}>
                  <td><span className="mono-chip">{o.orderId}</span></td>
                  <td><Identity name={o.customer?.name || '—'} sub={PAYMENT_METHODS[o.paymentMethod] || o.paymentMethod} /></td>
                  <td className="hide-sm">{o.vendor?.storeName || '—'}</td>
                  <td className="cell-strong">{money(o.totalAmount)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="hide-sm">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
              {s && !s.recentOrders?.length && <tr><td colSpan={6}><EmptyState title="No orders yet" /></td></tr>}
              {!s && !summary.error && Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6}><Skeleton /></td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>

      {s && (
        <div className="stat-grid" style={{ marginTop: 18 }}>
          <StatCard icon={Store} tone="brand" label="Approved vendors" value={num(s.users.vendors.approved)} footer={`${num(s.users.vendors.total)} registered`} onClick={() => navigate('/vendors')} />
          <StatCard icon={Bike} tone="violet" label="Riders online now" value={`${num(s.users.riders.online)} / ${num(s.users.riders.approved)}`} footer={<><span className="live-dot" /> Live on the map</>} onClick={() => navigate('/riders/live')} />
          <StatCard icon={Users} tone="blue" label="Customers" value={num(s.users.customers)} footer={`+${num(s.users.newCustomersThisMonth)} this month`} onClick={() => navigate('/customers')} />
          <StatCard icon={PackageX} tone="rose" label="Low stock" value={num(s.inventory.lowStock)} footer={`${num(s.inventory.outOfStock)} out of stock · ${num(s.inventory.totalProducts)} products`} onClick={() => navigate('/inventory')} />
        </div>
      )}
    </>
  );
}
