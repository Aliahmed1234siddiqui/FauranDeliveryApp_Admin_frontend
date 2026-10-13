import { Building2, Download, Eye, MapPin, Star, Store } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { useApi } from '../lib/hooks';
import { adminApi } from '../services/adminApi';
import { compactMoney, date, num } from '../lib/format';
import { Badge, Button, Card, Code, IconButton, Identity, PageHeader, SearchInput, Segmented, Select, StatCard, StatusBadge } from '../ui/primitives';
import DataTable, { Pagination } from '../ui/DataTable';

const FILTERS = ['status', 'storeType'];

export default function Vendors() {
  const { navigate } = useRouter();
  const list = useList(adminApi.getVendors, FILTERS, { limit: 8 });
  const all = useApi(() => adminApi.getVendors({ limit: 999 }), []);
  const items = all.data?.items || [];
  const count = (s) => items.filter((v) => v.approvalStatus === s).length;

  const columns = [
    { key: 'store', header: 'Store', sortable: true, sortKey: 'storeName', render: (v) => <Identity name={v.storeName} sub={v.vendorId} square /> },
    { key: 'type', header: 'Type', render: (v) => <Badge tone={v.storeType === 'dark_store' ? 'brand' : 'info'}>{v.storeType === 'dark_store' ? 'Dark store' : 'Partner kiryana'}</Badge> },
    { key: 'owner', header: 'Owner', hideOnMobile: true, render: (v) => <><span className="cell-strong">{v.ownerName}</span><span className="cell-sub">{v.phone}</span></> },
    { key: 'area', header: 'Location', hideOnMobile: true, render: (v) => <span className="row" style={{ gap: 5 }}><MapPin size={13} className="muted" />{v.area}</span> },
    { key: 'status', header: 'Status', render: (v) => (v.isActive ? <StatusBadge status={v.approvalStatus} /> : <StatusBadge status="blocked" />) },
    { key: 'orders', header: 'Orders', align: 'right', sortable: true, sortKey: 'totalOrders', hideOnMobile: true, render: (v) => num(v.totalOrders) },
    { key: 'rating', header: 'Rating', hideOnMobile: true, render: (v) => (v.rating ? <span className="row" style={{ gap: 4 }}><Star size={13} fill="var(--accent)" color="var(--accent)" />{v.rating}</span> : <span className="muted">New</span>) },
    { key: 'joined', header: 'Joined', hideOnMobile: true, sortable: true, sortKey: 'createdAt', render: (v) => date(v.createdAt) },
    { key: 'actions', header: '', render: (v) => (v.approvalStatus === 'pending' ? <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); navigate(`/vendors/${v.vendorId}`); }}>Review</Button> : <IconButton icon={Eye} label="View vendor" onClick={(e) => { e.stopPropagation(); navigate(`/vendors/${v.vendorId}`); }} />) },
  ];

  return (
    <>
      <PageHeader
        title="Vendors"
        description="Every dark store and partner kiryana on Fauran. Review applications, check performance and manage access."
        actions={<Button variant="secondary" icon={Download}>Export CSV</Button>}
      />

      <div className="stat-grid">
        <StatCard icon={Store} label="Live stores" value={count('approved')} footer={`${items.filter((v) => v.storeType === 'dark_store' && v.approvalStatus === 'approved').length} dark stores`} onClick={() => list.setFilter('status', 'approved')} />
        <StatCard icon={Building2} tone="amber" label="Awaiting review" value={count('pending')} footer="Applications in queue" onClick={() => list.setFilter('status', 'pending')} />
        <StatCard icon={Store} tone="violet" label="Partner GMV (lifetime)" value={compactMoney(items.reduce((s, v) => s + v.grossSales, 0))} footer="Across approved stores" />
      </div>

      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented
            value={list.filters.status}
            onChange={(v) => list.setFilter('status', v)}
            options={[
              { value: 'all', label: 'All', count: items.length },
              { value: 'pending', label: 'Pending', count: count('pending') },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <div className="spacer" />
          <Select value={list.filters.storeType} onChange={(v) => list.setFilter('storeType', v)} options={[{ value: 'all', label: 'All store types' }, { value: 'dark_store', label: 'Dark stores' }, { value: 'partner_kiryana', label: 'Partner kiryana' }]} />
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search store, owner, area or VEN id" />
        </div>
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          sort={list.sort}
          onSort={list.setSort}
          onRowClick={(v) => navigate(`/vendors/${v.vendorId}`)}
          rowClassName={(v) => (v.approvalStatus === 'pending' ? 'row-attention' : '')}
        />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
      <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>Tip: rows marked with an amber edge are waiting for your review. Readable ids like <Code>VEN0003</Code> work in the URL.</p>
    </>
  );
}
