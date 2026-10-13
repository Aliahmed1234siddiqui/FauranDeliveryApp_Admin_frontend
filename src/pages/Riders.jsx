import { Bike, Eye, MapPinned, Star, UserCheck, Wallet } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { useApi } from '../lib/hooks';
import { adminApi } from '../services/adminApi';
import { compactMoney, money, num, pct } from '../lib/format';
import { Badge, Button, Card, IconButton, Identity, PageHeader, SearchInput, Segmented, Select, StatCard, StatusBadge } from '../ui/primitives';
import DataTable, { Pagination } from '../ui/DataTable';

const FILTERS = ['status', 'online'];

export default function Riders() {
  const { navigate } = useRouter();
  const list = useList(adminApi.getRiders, FILTERS, { limit: 8 });
  const all = useApi(() => adminApi.getRiders({ limit: 999 }), []);
  const items = all.data?.items || [];

  const columns = [
    { key: 'name', header: 'Rider', sortable: true, sortKey: 'name', render: (r) => <Identity name={r.name} sub={r.riderId} /> },
    { key: 'phone', header: 'Phone', hideOnMobile: true, render: (r) => r.phone },
    { key: 'vehicle', header: 'Vehicle', hideOnMobile: true, render: (r) => <><span className="cell-strong">{r.vehicleType}</span><span className="cell-sub">{r.vehicleNumber}</span></> },
    { key: 'zone', header: 'Zone', hideOnMobile: true, render: (r) => r.zone },
    { key: 'status', header: 'Account', render: (r) => (!r.isActive ? <StatusBadge status="blocked" /> : <StatusBadge status={r.approvalStatus} />) },
    { key: 'live', header: 'Right now', render: (r) => (r.approvalStatus === 'approved' ? <StatusBadge status={r.currentStatus} /> : <span className="muted">—</span>) },
    { key: 'deliveries', header: 'Deliveries', align: 'right', sortable: true, sortKey: 'totalDeliveries', hideOnMobile: true, render: (r) => num(r.totalDeliveries) },
    { key: 'rating', header: 'Rating', hideOnMobile: true, render: (r) => (r.rating ? <span className="row" style={{ gap: 4 }}><Star size={13} fill="var(--accent)" color="var(--accent)" />{r.rating}</span> : <span className="muted">New</span>) },
    { key: 'cod', header: 'COD in hand', align: 'right', sortable: true, sortKey: 'codInHand', hideOnMobile: true, render: (r) => (r.codInHand > 30000 ? <Badge tone="danger">{money(r.codInHand)}</Badge> : money(r.codInHand)) },
    { key: 'actions', header: '', render: (r) => (r.approvalStatus === 'pending' ? <Button size="sm" variant="soft" onClick={(e) => { e.stopPropagation(); navigate(`/riders/${r.riderId}`); }}>Review</Button> : <IconButton icon={Eye} label="View rider" onClick={(e) => { e.stopPropagation(); navigate(`/riders/${r.riderId}`); }} />) },
  ];

  const approved = items.filter((r) => r.approvalStatus === 'approved');

  return (
    <>
      <PageHeader
        title="Riders"
        description="Onboard riders, keep an eye on who's online and make sure COD cash comes back to the hub."
        actions={<Button icon={MapPinned} onClick={() => navigate('/riders/live')}>Open live map</Button>}
      />
      <div className="stat-grid">
        <StatCard icon={Bike} label="Online now" value={`${approved.filter((r) => r.isOnline).length} / ${approved.length}`} footer={<><span className="live-dot" /> {approved.filter((r) => r.currentStatus === 'delivering').length} on a delivery</>} onClick={() => list.setFilter('online', 'true')} />
        <StatCard icon={UserCheck} tone="amber" label="Pending applications" value={items.filter((r) => r.approvalStatus === 'pending').length} footer="Need document review" onClick={() => list.setFilter('status', 'pending')} />
        <StatCard icon={Star} tone="violet" label="Avg. on-time rate" value={pct(approved.reduce((s, r) => s + r.onTimeRate, 0) / (approved.length || 1))} footer="Across approved riders" />
        <StatCard icon={Wallet} tone="rose" label="COD held by riders" value={compactMoney(items.reduce((s, r) => s + r.codInHand, 0))} footer="To be deposited at hubs" onClick={() => navigate('/payouts?tab=riders')} />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: 'all', label: 'All', count: items.length }, { value: 'pending', label: 'Pending', count: items.filter((r) => r.approvalStatus === 'pending').length }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} />
          <div className="spacer" />
          <Select value={list.filters.online} onChange={(v) => list.setFilter('online', v)} options={[{ value: 'all', label: 'Online & offline' }, { value: 'true', label: 'Online only' }, { value: 'false', label: 'Offline only' }]} />
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search name, phone, zone or bike no." />
        </div>
        <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} sort={list.sort} onSort={list.setSort} onRowClick={(r) => navigate(`/riders/${r.riderId}`)} rowClassName={(r) => (r.approvalStatus === 'pending' ? 'row-attention' : '')} />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
    </>
  );
}
