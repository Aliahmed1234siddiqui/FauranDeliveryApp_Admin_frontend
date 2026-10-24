import { useState } from 'react';
import { Boxes, CircleAlert, LineChart as TrendIcon, Package, PackageX, Tags, TriangleAlert, Wallet } from 'lucide-react';
import { useQueryState, useRouter } from '../lib/router';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { inventoryApi } from '../services/api';
import { compactMoney, money, num } from '../lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, Identity, Input, PageHeader, Progress, SearchInput, Segmented, Skeleton, StatCard } from '../ui/primitives';
import DataTable from '../ui/DataTable';

// Stock alert level. Empty means "use the server's default", which the response echoes back.
function ThresholdInput({ value, fallback, onChange }) {
  const [draft, setDraft] = useState(null);
  const shown = draft ?? (value || (fallback != null ? String(fallback) : ''));
  const commit = () => {
    if (draft === null) return;
    const n = Number(draft);
    onChange(draft === '' || !(n >= 0) ? '' : String(Math.floor(n)));
    setDraft(null);
  };
  return (
    <label className="row" style={{ gap: 8, fontSize: 13 }}>
      <span className="muted">Low stock at</span>
      <Input
        type="number"
        min="0"
        step="1"
        suffix="units"
        style={{ width: 80 }}
        value={shown}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        aria-label="Low-stock threshold"
      />
    </label>
  );
}

function Summary({ data, onPending }) {
  if (!data) return <div className="stat-grid">{Array.from({ length: 5 }).map((_, i) => <div className="stat-card" key={i}><Skeleton h={96} /></div>)}</div>;
  const s = data.summary || {};
  return (
    <div className="stat-grid">
      <StatCard icon={Boxes} label="Products" value={num(s.totalProducts)} footer={`${num(s.activeProducts)} visible · ${num(s.totalUnits)} units`} />
      <StatCard icon={CircleAlert} tone="blue" label="Waiting for approval" value={num(s.pendingApproval)} footer="Not visible to customers yet" onClick={onPending} />
      <StatCard icon={TriangleAlert} tone="amber" label="Low stock" value={num(s.lowStock)} footer={`At or below ${num(data.threshold)} units`} />
      <StatCard icon={PackageX} tone="rose" label="Out of stock" value={num(s.outOfStock)} footer="Customers can't order these" />
      <StatCard icon={Wallet} tone="violet" label="Stock value" value={compactMoney(s.stockValue)} footer="Units on hand at their price" />
    </div>
  );
}

// Out-of-stock and low-stock lists (not paged). Out-of-stock rows carry no productId.
function StockTable({ data, loading, error, onRetry, onOpen }) {
  const [tab, setTab] = useState('low');
  const [search, setSearch] = useState('');
  const threshold = data?.threshold || 1;
  const all = data?.[tab === 'low' ? 'lowStock' : 'outOfStock'];
  const term = search.trim().toLowerCase();
  const rows = all?.filter((p) => !term || p.name?.toLowerCase().includes(term) || p.vendor?.storeName?.toLowerCase().includes(term) || p.productId?.toLowerCase().includes(term));

  const columns = [
    { key: 'product', header: 'Product', render: (p) => <Identity name={p.name} sub={[p.unit, p.productId].filter(Boolean).join(' · ') || undefined} /> },
    { key: 'vendor', header: 'Store', hideOnMobile: true, render: (p) => <><span className="cell-strong">{p.vendor?.storeName || '—'}</span><span className="cell-sub">{p.vendor?.vendorId}</span></> },
    {
      key: 'level',
      header: 'Stock level',
      width: 220,
      render: (p) => (
        <div style={{ minWidth: 140 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
            <strong style={{ color: 'var(--text)' }}>{num(p.stock)} units</strong>
            <span className="muted">alert at {num(threshold)}</span>
          </div>
          <Progress value={p.stock} max={threshold} tone={p.stock === 0 ? 'danger' : 'warning'} />
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (p) => (p.stock === 0 ? <Badge tone="danger" dot>Out of stock</Badge> : <Badge tone="warning" dot>Low</Badge>) },
  ];

  return (
    <Card className="table-card" padded={false}>
      <div className="toolbar">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'low', label: 'Low stock', count: data?.lowStock?.length }, { value: 'out', label: 'Out of stock', count: data?.outOfStock?.length }]} />
        <div className="spacer" />
        <SearchInput value={search} onChange={setSearch} placeholder="Product or store" />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onRowClick={onOpen}
        empty={<EmptyState icon={Package} title={term ? 'Nothing matches' : tab === 'low' ? 'No low-stock products' : 'Nothing is out of stock'} description={term ? 'Try another search.' : 'Every listing is above the alert level.'} />}
      />
    </Card>
  );
}

// byVendor rows carry the store's Mongo _id as `vendorId`; it's only used for the link.
function VendorBreakdown({ rows, onOpen }) {
  if (!rows) return <Skeleton h={300} />;
  if (!rows.length) return <EmptyState icon={Boxes} title="No stock yet" description="Stores appear here once they list products." />;
  return (
    <div className="list">
      {rows.map((v) => (
        <div key={v.vendorId} className={`list-item ${onOpen ? 'is-clickable' : ''}`} style={{ display: 'block' }} onClick={onOpen ? () => onOpen(v) : undefined}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ fontSize: 13.5 }}>{v.storeName}</strong>
            <span className="muted" style={{ fontSize: 12 }}>{num(v.products)} products</span>
          </div>
          <Progress value={v.lowStock} max={v.products || 1} tone="warning" />
          <div className="row" style={{ gap: 12, marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <span>{num(v.units)} units</span>
            <span>{money(v.stockValue)}</span>
            {v.lowStock > 0 && <span style={{ color: 'var(--warning)' }}>{num(v.lowStock)} low</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryBreakdown({ rows }) {
  if (!rows) return <Skeleton h={200} />;
  if (!rows.length) return <EmptyState icon={Tags} title="No categories with stock" />;
  const most = Math.max(1, ...rows.map((c) => c.units));
  return (
    <div className="list">
      {rows.map((c) => (
        <div key={c.categoryId} className="list-item" style={{ display: 'block' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ fontSize: 13.5 }}>{c.name || 'Uncategorised'}</strong>
            <span className="muted" style={{ fontSize: 12 }}>{num(c.products)} products · {num(c.units)} units</span>
          </div>
          <Progress value={c.units} max={most} />
        </div>
      ))}
    </div>
  );
}

export default function Inventory() {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const [threshold, setThreshold] = useQueryState('threshold');
  const { data, loading, error, reload } = useApi(() => inventoryApi.overview({ threshold }), [threshold], { key: 'inventory-overview' });
  const canProducts = can('products');

  const openProduct = (p) => navigate(`/products?search=${encodeURIComponent(p.productId || p.name)}`);

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock on hand across every store. Spot shortages before customers do."
        actions={(
          <>
            <ThresholdInput key={threshold} value={threshold} fallback={data?.threshold} onChange={setThreshold} />
            {can('reports', 'inventory') && <Button variant="secondary" icon={TrendIcon} onClick={() => navigate('/reports?tab=forecast')}>Demand forecast</Button>}
          </>
        )}
      />
      {error && !data ? <Card><ErrorState error={error} onRetry={reload} /></Card> : (
        <>
          <Summary data={data} onPending={canProducts ? () => navigate('/products?approval=pending') : undefined} />
          <div className="grid grid-side mb">
            <StockTable data={data} loading={loading} error={error} onRetry={reload} onOpen={canProducts ? openProduct : undefined} />
            <Card title="Stock by store" subtitle={canProducts ? 'Bar shows the share of low-stock products. Click to see a store’s products.' : 'Bar shows the share of low-stock products.'}>
              <VendorBreakdown rows={data?.byVendor} onOpen={canProducts ? (v) => navigate(`/products?vendorId=${v.vendorId}`) : undefined} />
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
