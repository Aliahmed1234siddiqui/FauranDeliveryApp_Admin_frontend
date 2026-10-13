import { Banknote, Download, Eye, UserCheck, UserX, Users } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { useAction, useApi } from '../lib/hooks';
import { adminApi } from '../services/adminApi';
import { date, money, num, timeAgo } from '../lib/format';
import { Button, Card, IconButton, Identity, PageHeader, SearchInput, Segmented, Select, StatCard, StatusBadge, Toggle } from '../ui/primitives';
import DataTable, { Pagination } from '../ui/DataTable';

const FILTERS = ['status', 'cod'];

export default function Customers() {
  const { navigate } = useRouter();
  const list = useList(adminApi.getCustomers, FILTERS, { limit: 10, defaultSort: '-totalSpent' });
  const all = useApi(() => adminApi.getCustomers({ limit: 999 }), []);
  const items = all.data?.items || [];
  const [run] = useAction();

  const toggleCod = (c, value) => {
    list.setData((d) => ({ ...d, items: d.items.map((x) => (x._id === c._id ? { ...x, codEnabled: value } : x)) }));
    run(() => adminApi.setCustomerCod(c._id, value), { success: value ? `COD enabled for ${c.name}` : `COD disabled for ${c.name}` }).catch(() => list.reload());
  };

  const columns = [
    { key: 'name', header: 'Customer', sortable: true, sortKey: 'name', render: (c) => <Identity name={c.name} sub={c.email} /> },
    { key: 'phone', header: 'Phone', hideOnMobile: true, render: (c) => c.phone },
    { key: 'orders', header: 'Orders', align: 'right', sortable: true, sortKey: 'totalOrders', render: (c) => num(c.totalOrders) },
    { key: 'spent', header: 'Lifetime spend', align: 'right', sortable: true, sortKey: 'totalSpent', render: (c) => <span className="cell-strong">{money(c.totalSpent)}</span> },
    { key: 'last', header: 'Last order', hideOnMobile: true, sortable: true, sortKey: 'lastOrderAt', render: (c) => timeAgo(c.lastOrderAt) },
    { key: 'joined', header: 'Joined', hideOnMobile: true, render: (c) => date(c.createdAt) },
    { key: 'cod', header: 'COD', render: (c) => <span onClick={(e) => e.stopPropagation()}><Toggle checked={c.codEnabled} onChange={(v) => toggleCod(c, v)} /></span> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.isActive ? 'active' : 'blocked'} /> },
    { key: 'actions', header: '', render: (c) => <IconButton icon={Eye} label="View customer" onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.customerId}`); }} /> },
  ];

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who shops on Fauran. Control cash-on-delivery access and account status."
        actions={<Button variant="secondary" icon={Download}>Export CSV</Button>}
      />
      <div className="stat-grid">
        <StatCard icon={Users} label="Total customers" value={num(items.length)} footer="Registered accounts" />
        <StatCard icon={UserCheck} tone="blue" label="Active" value={num(items.filter((c) => c.isActive).length)} footer="Can place orders" onClick={() => list.setFilter('status', 'active')} />
        <StatCard icon={UserX} tone="rose" label="Blocked" value={num(items.filter((c) => !c.isActive).length)} footer="Signed out of the app" onClick={() => list.setFilter('status', 'blocked')} />
        <StatCard icon={Banknote} tone="amber" label="COD disabled" value={num(items.filter((c) => !c.codEnabled).length)} footer="Must prepay by card/wallet" onClick={() => list.setFilter('cod', 'false')} />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'blocked', label: 'Blocked' }]} />
          <div className="spacer" />
          <Select value={list.filters.cod} onChange={(v) => list.setFilter('cod', v)} options={[{ value: 'all', label: 'Any COD access' }, { value: 'true', label: 'COD allowed' }, { value: 'false', label: 'COD disabled' }]} />
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Search name, phone, email or CUS id" />
        </div>
        <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} sort={list.sort} onSort={list.setSort} onRowClick={(c) => navigate(`/customers/${c.customerId}`)} />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
    </>
  );
}
