import { Ban, Building2, Eye, MapPin, Star, Store } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { useApi } from '../lib/hooks';
import { vendorsApi } from '../services/api';
import { compactMoney, date, num } from '../lib/format';
import { Button, Card, Code, IconButton, Identity, PageHeader, SearchInput, Segmented, Select, StatCard, StatusBadge } from '../ui/primitives';
import DataTable, { Pagination } from '../ui/DataTable';

const FILTERS = ['status', 'isActive'];

// Header counts come from list totals (limit 1), not from loading every vendor.
const countOf = (params) => vendorsApi.list({ ...params, limit: 1 }).then((r) => r.total);
const loadCounts = () => Promise.all([
  countOf({}),
  countOf({ status: 'pending' }),
  countOf({ status: 'approved', isActive: true }),
  countOf({ isActive: false }),
]).then(([all, pending, live, blocked]) => ({ all, pending, live, blocked }));

export default function Vendors() {
  const { navigate } = useRouter();
  const list = useList(vendorsApi.list, FILTERS, { limit: 8 });
  const counts = useApi(loadCounts, [], { key: 'vendor-counts' }).data;
  const open = (v) => navigate(`/vendors/${v.vendorId}`);

  const columns = [
    { key: 'store', header: 'Store', render: (v) => <Identity name={v.storeName} sub={v.vendorId} square /> },
    { key: 'owner', header: 'Owner', hideOnMobile: true, render: (v) => <><span className="cell-strong">{v.name}</span><span className="cell-sub">{v.phone}</span></> },
    { key: 'address', header: 'Location', hideOnMobile: true, render: (v) => (v.storeAddress?.address ? <span className="row" style={{ gap: 5 }}><MapPin size={13} className="muted" />{v.storeAddress.address}</span> : <span className="muted">—</span>) },
    { key: 'status', header: 'Status', render: (v) => (v.isActive ? <StatusBadge status={v.approvalStatus} /> : <StatusBadge status="blocked" />) },
    { key: 'products', header: 'Products', align: 'right', hideOnMobile: true, render: (v) => num(v.productCount) },
    { key: 'orders', header: 'Delivered', align: 'right', hideOnMobile: true, render: (v) => num(v.deliveredOrders) },
    { key: 'sales', header: 'Sales', align: 'right', hideOnMobile: true, render: (v) => compactMoney(v.totalSales) },
    { key: 'rating', header: 'Rating', hideOnMobile: true, render: (v) => (v.totalRatings ? <span className="row" style={{ gap: 4 }}><Star size={13} fill="var(--accent)" color="var(--accent)" />{v.rating}</span> : <span className="muted">New</span>) },
    { key: 'joined', header: 'Joined', hideOnMobile: true, render: (v) => date(v.createdAt) },
    { key: 'actions', header: '', render: (v) => (v.approvalStatus === 'pending' ? <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); open(v); }}>Review</Button> : <IconButton icon={Eye} label="View vendor" onClick={(e) => { e.stopPropagation(); open(v); }} />) },
  ];

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Every store selling on Fauran Mart. Review applications, check performance and manage access."
      />

      <div className="stat-grid">
        <StatCard icon={Store} label="Live stores" value={counts ? num(counts.live) : '—'} footer="Approved and active" onClick={() => list.setFilter('status', 'approved')} />
        <StatCard icon={Building2} tone="amber" label="Awaiting review" value={counts ? num(counts.pending) : '—'} footer="Applications in queue" onClick={() => list.setFilter('status', 'pending')} />
        <StatCard icon={Ban} tone="rose" label="Blocked" value={counts ? num(counts.blocked) : '—'} footer="Can't sign in to the vendor app" onClick={() => list.setFilter('isActive', 'false')} />
      </div>

      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented
            value={list.filters.status}
            onChange={(v) => list.setFilter('status', v)}
            options={[
              { value: 'all', label: 'All', count: counts?.all },
              { value: 'pending', label: 'Pending', count: counts?.pending },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <div className="spacer" />
          <Select value={list.filters.isActive} onChange={(v) => list.setFilter('isActive', v)} options={[{ value: 'all', label: 'Active & blocked' }, { value: 'true', label: 'Active only' }, { value: 'false', label: 'Blocked only' }]} />
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search store, owner, phone or VEN id" />
        </div>
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          onRowClick={open}
          rowClassName={(v) => (v.approvalStatus === 'pending' ? 'row-attention' : '')}
        />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Tip: rows marked with an amber edge are waiting for your review. Readable ids like <Code>VEN0003</Code> work in the URL.</p>
    </>
  );
}
