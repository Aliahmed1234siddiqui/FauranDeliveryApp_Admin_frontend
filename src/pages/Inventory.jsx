import { Boxes, LineChart as TrendIcon, PackageCheck, PackageX, TriangleAlert, Wallet } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { adminApi } from '../services/adminApi';
import { compactMoney, money, num } from '../lib/format';
import { Badge, Button, Card, Identity, PageHeader, Progress, SearchInput, Segmented, Select, Skeleton, StatCard } from '../ui/primitives';
import DataTable, { Pagination } from '../ui/DataTable';

export default function Inventory() {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const list = useList(adminApi.getInventoryOverview, ['vendorId', 'stock'], { limit: 10, defaultSort: 'stock' });
  const vendors = useApi(() => adminApi.getVendors({ status: 'approved', limit: 999 }), []);
  const s = list.data?.summary;
  const byVendor = list.data?.byVendor || [];

  const columns = [
    { key: 'product', header: 'Product', sortable: true, sortKey: 'name', render: (p) => <Identity icon={p.icon} name={p.name} sub={p.sku} /> },
    { key: 'vendor', header: 'Store', hideOnMobile: true, render: (p) => <span className="cell-strong">{p.vendor.storeName}</span> },
    {
      key: 'level',
      header: 'Stock level',
      sortable: true,
      sortKey: 'stock',
      width: 220,
      render: (p) => (
        <div style={{ minWidth: 140 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
            <strong style={{ color: 'var(--text)' }}>{p.stock} units</strong>
            <span className="muted">reorder at {p.reorderLevel}</span>
          </div>
          <Progress value={p.stock} max={Math.max(100, p.reorderLevel * 4)} tone={p.stock === 0 ? 'danger' : p.stock <= p.reorderLevel ? 'warning' : 'success'} />
        </div>
      ),
    },
    { key: 'sold', header: 'Sold (30d)', align: 'right', hideOnMobile: true, sortable: true, sortKey: 'soldLast30d', render: (p) => num(p.soldLast30d) },
    { key: 'cover', header: 'Days of cover', align: 'right', hideOnMobile: true, render: (p) => { const d = p.soldLast30d ? p.stock / (p.soldLast30d / 30) : Infinity; return d === Infinity ? <span className="muted">—</span> : <span className={d < 3 ? 'neg strong' : ''}>{d.toFixed(1)} d</span>; } },
    { key: 'value', header: 'Stock value', align: 'right', hideOnMobile: true, render: (p) => money(p.stock * p.price) },
    { key: 'status', header: 'Status', render: (p) => (p.stock === 0 ? <Badge tone="danger" dot>Out of stock</Badge> : p.stock <= p.reorderLevel ? <Badge tone="warning" dot>Reorder</Badge> : <Badge tone="success" dot>Healthy</Badge>) },
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock on hand across every store. Spot shortages before customers do."
        actions={can('reports', 'inventory') && <Button variant="secondary" icon={TrendIcon} onClick={() => navigate('/reports?tab=forecast')}>Demand forecast</Button>}
      />
      <div className="stat-grid">
        {s ? (
          <>
            <StatCard icon={Boxes} label="Total SKUs" value={num(s.totalSkus)} footer={`${byVendor.length} stores`} onClick={() => list.setFilter('stock', 'all')} />
            <StatCard icon={PackageCheck} tone="teal" label="Healthy" value={num(s.inStock)} footer="Above reorder level" onClick={() => list.setFilter('stock', 'in')} />
            <StatCard icon={TriangleAlert} tone="amber" label="Needs reorder" value={num(s.lowStock)} footer="At or below reorder level" onClick={() => list.setFilter('stock', 'low')} />
            <StatCard icon={PackageX} tone="rose" label="Out of stock" value={num(s.outOfStock)} footer="Hidden from customers" onClick={() => list.setFilter('stock', 'out')} />
            <StatCard icon={Wallet} tone="violet" label="Stock value" value={compactMoney(s.stockValue)} footer="At selling price" />
          </>
        ) : Array.from({ length: 5 }).map((_, i) => <div className="stat-card" key={i}><Skeleton h={96} /></div>)}
      </div>

      <div className="grid grid-side">
        <Card className="table-card" padded={false}>
          <div className="toolbar">
            <Segmented value={list.filters.stock} onChange={(v) => list.setFilter('stock', v)} options={[{ value: 'all', label: 'All' }, { value: 'low', label: 'Reorder' }, { value: 'out', label: 'Out' }, { value: 'in', label: 'Healthy' }]} />
            <div className="spacer" />
            <Select value={list.filters.vendorId} onChange={(v) => list.setFilter('vendorId', v)} options={[{ value: 'all', label: 'All stores' }, ...(vendors.data?.items || []).map((v) => ({ value: v._id, label: v.storeName }))]} />
            <SearchInput value={list.search} onChange={list.setSearch} placeholder="Product, SKU or store" />
          </div>
          <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} sort={list.sort} onSort={list.setSort} />
          <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
        </Card>

        <Card title="Stock health by store" subtitle="Click a store to filter">
          {!byVendor.length ? <Skeleton h={300} /> : (
            <div className="list">
              {byVendor.map((v) => {
                const healthy = v.skus - v.low - v.out;
                return (
                  <div key={v.vendor._id} className="list-item is-clickable" style={{ display: 'block' }} onClick={() => list.setFilter('vendorId', v.vendor._id)}>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ fontSize: 13.5 }}>{v.vendor.storeName}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>{v.skus} SKUs</span>
                    </div>
                    <div style={{ display: 'flex', gap: 2, height: 8, borderRadius: 999, overflow: 'hidden', background: 'var(--surface-3)' }}>
                      <span style={{ flex: healthy, background: 'var(--success)' }} />
                      <span style={{ flex: v.low, background: 'var(--warning)' }} />
                      <span style={{ flex: v.out, background: 'var(--danger)' }} />
                    </div>
                    <div className="row" style={{ gap: 12, marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
                      <span>{healthy} healthy</span>
                      {v.low > 0 && <span style={{ color: 'var(--warning)' }}>{v.low} reorder</span>}
                      {v.out > 0 && <span style={{ color: 'var(--danger)' }}>{v.out} out</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
