import { CalendarDays, Download, Eye, RotateCcw, X } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { useApi } from '../lib/hooks';
import { adminApi } from '../services/adminApi';
import { dateTime, money } from '../lib/format';
import { Badge, Button, Card, Code, IconButton, Identity, PageHeader, SearchInput, Select, StatusBadge, Tabs } from '../ui/primitives';
import DataTable, { Pagination } from '../ui/DataTable';

const FILTERS = ['status', 'vendorId', 'paymentMethod', 'fromDate', 'toDate'];
const STATUS_TABS = [
  { value: 'all', label: 'All orders' },
  { value: 'placed', label: 'New' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'on_the_way', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'return_requested', label: 'Returns' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Orders() {
  const { navigate } = useRouter();
  const list = useList(adminApi.getOrders, FILTERS, { limit: 10 });
  const fromDate = list.filters.fromDate === 'all' ? '' : list.filters.fromDate;
  const toDate = list.filters.toDate === 'all' ? '' : list.filters.toDate;
  const setFromDate = (v) => list.setFilter('fromDate', v || 'all');
  const setToDate = (v) => list.setFilter('toDate', v || 'all');
  const vendors = useApi(() => adminApi.getVendors({ status: 'approved', limit: 999 }), []);
  const all = useApi(() => adminApi.getOrders({ limit: 999 }), []);
  const counts = (all.data?.items || []).reduce((acc, o) => ({ ...acc, [o.status]: (acc[o.status] || 0) + 1 }), {});

  const columns = [
    { key: 'id', header: 'Order', sortable: true, sortKey: 'orderId', render: (o) => <><Code>{o.orderId}</Code><span className="cell-sub">{o.items.length} item{o.items.length > 1 ? 's' : ''}</span></> },
    { key: 'customer', header: 'Customer', render: (o) => <Identity name={o.customer.name} sub={o.customer.phone} /> },
    { key: 'vendor', header: 'Store', hideOnMobile: true, render: (o) => <span className="cell-strong">{o.vendor.storeName}</span> },
    { key: 'rider', header: 'Rider', hideOnMobile: true, render: (o) => (o.rider ? o.rider.name : <span className="muted">Not assigned</span>) },
    { key: 'total', header: 'Total', align: 'right', sortable: true, sortKey: 'total', render: (o) => <><span className="cell-strong">{money(o.total)}</span><span className="cell-sub">{o.paymentMethod.toUpperCase()}</span></> },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'placed', header: 'Placed', hideOnMobile: true, sortable: true, sortKey: 'createdAt', render: (o) => dateTime(o.createdAt) },
    { key: 'actions', header: '', render: (o) => <IconButton icon={Eye} label="View order" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.orderId}`); }} /> },
  ];

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track every order across the marketplace. Open one to see its timeline, cancel it, or confirm a return."
        actions={<Button variant="secondary" icon={Download}>Export CSV</Button>}
      />
      {counts.return_requested > 0 && list.filters.status !== 'return_requested' && (
        <div className="callout callout-warning mb">
          <RotateCcw size={16} />
          <div><strong>{counts.return_requested} return{counts.return_requested > 1 ? 's' : ''} waiting for confirmation.</strong> Customers are waiting on a refund.</div>
          <div className="spacer" />
          <Button size="sm" variant="secondary" onClick={() => list.setFilter('status', 'return_requested')}>Review returns</Button>
        </div>
      )}
      <Tabs value={list.filters.status} onChange={(v) => list.setFilter('status', v)} tabs={STATUS_TABS.map((t) => ({ ...t, count: t.value === 'all' ? all.data?.total : counts[t.value] || 0 }))} />
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Order id, customer, phone, store or rider" />
          <Select value={list.filters.vendorId} onChange={(v) => list.setFilter('vendorId', v)} options={[{ value: 'all', label: 'All stores' }, ...(vendors.data?.items || []).map((v) => ({ value: v._id, label: v.storeName }))]} />
          <Select value={list.filters.paymentMethod} onChange={(v) => list.setFilter('paymentMethod', v)} options={[{ value: 'all', label: 'Any payment' }, { value: 'cod', label: 'Cash on delivery' }, { value: 'card', label: 'Card' }, { value: 'wallet', label: 'Wallet' }]} />
          <div className="date-range">
            <CalendarDays size={16} className="muted" />
            <input type="date" className="input" value={fromDate} max={toDate || undefined} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" />
            <span className="muted">→</span>
            <input type="date" className="input" value={toDate} min={fromDate || undefined} onChange={(e) => setToDate(e.target.value)} aria-label="To date" />
            {(fromDate || toDate) && <IconButton icon={X} label="Clear dates" onClick={() => { setFromDate(''); setToDate(''); }} />}
          </div>
        </div>
        {(list.filters.vendorId !== 'all' || list.filters.paymentMethod !== 'all') && (
          <div className="row row-wrap" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 6 }}>
            <span className="muted" style={{ fontSize: 12.5 }}>Filtered by</span>
            {list.filters.vendorId !== 'all' && <Badge tone="brand">{vendors.data?.items.find((v) => v._id === list.filters.vendorId)?.storeName}<button type="button" className="search-clear" style={{ width: 16, height: 16 }} onClick={() => list.setFilter('vendorId', 'all')}><X size={10} /></button></Badge>}
            {list.filters.paymentMethod !== 'all' && <Badge tone="brand">{list.filters.paymentMethod.toUpperCase()}<button type="button" className="search-clear" style={{ width: 16, height: 16 }} onClick={() => list.setFilter('paymentMethod', 'all')}><X size={10} /></button></Badge>}
          </div>
        )}
        <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} sort={list.sort} onSort={list.setSort} onRowClick={(o) => navigate(`/orders/${o.orderId}`)} rowClassName={(o) => (o.status === 'return_requested' ? 'row-attention' : '')} />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
    </>
  );
}
