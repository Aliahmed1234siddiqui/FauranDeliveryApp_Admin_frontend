import { Eye, PackageX, X } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { useApi } from '../lib/hooks';
import { useAuth } from '../lib/auth';
import { ordersApi, vendorsApi } from '../services/api';
import { dateTime, money } from '../lib/format';
import { ORDER_PAYMENT_STATUSES, PAYMENT_METHODS, withAll } from '../lib/constants';
import { statusLabel } from '../ui/status';
import { Badge, Button, Card, Code, IconButton, Identity, PageHeader, SearchInput, Select, StatusBadge, Tabs } from '../ui/primitives';
import DataTable, { Pagination } from '../ui/DataTable';
import { DateRange } from './shared';

// customerId / riderId have no control here; they arrive from links on the customer and rider pages.
const FILTERS = ['status', 'paymentMethod', 'paymentStatus', 'vendorId', 'customerId', 'riderId', 'from', 'to'];
const STATUS_TABS = [
  { value: 'all', label: 'All orders' },
  { value: 'placed', label: 'New' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'on_the_way', label: 'On the way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'delivery_failed', label: 'Failed' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];
const METHOD_OPTIONS = withAll('Any payment', Object.keys(PAYMENT_METHODS), (m) => PAYMENT_METHODS[m]);
const PAY_STATUS_OPTIONS = withAll('Any payment status', ORDER_PAYMENT_STATUSES, statusLabel);

export default function Orders() {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const list = useList(ordersApi.list, FILTERS, { defaults: { from: '', to: '' } });
  const { filters } = list;
  const canSeeVendors = can('vendors', 'dashboard');
  const vendors = useApi(() => (canSeeVendors ? vendorsApi.list({ status: 'approved', limit: 500 }) : Promise.resolve({ items: [] })), [canSeeVendors], { key: 'order-vendor-filter' });
  // Only the failed-delivery tab gets a count: one `limit: 1` request for its total.
  const failed = useApi(() => ordersApi.list({ status: 'delivery_failed', limit: 1 }), [], { key: 'failed-deliveries' });
  const failedCount = failed.data?.total || 0;

  const vendorItems = vendors.data?.items || [];
  const vendorName = (id) => vendorItems.find((v) => v._id === id || v.vendorId === id)?.storeName || list.rows?.[0]?.vendor?.storeName || id;
  // A link may carry the readable VEN… id; keep it selectable so the dropdown shows the active store.
  const vendorOptions = [{ value: 'all', label: 'All stores' }, ...vendorItems.map((v) => ({ value: v._id, label: v.storeName }))];
  if (filters.vendorId !== 'all' && !vendorItems.some((v) => v._id === filters.vendorId)) vendorOptions.push({ value: filters.vendorId, label: vendorName(filters.vendorId) });
  const firstRow = list.rows?.[0];
  const chips = [
    filters.vendorId !== 'all' && ['vendorId', vendorName(filters.vendorId)],
    filters.customerId !== 'all' && ['customerId', `Customer: ${firstRow?.customer?.name || filters.customerId}`],
    filters.riderId !== 'all' && ['riderId', `Rider: ${firstRow?.rider?.name || filters.riderId}`],
    filters.paymentMethod !== 'all' && ['paymentMethod', PAYMENT_METHODS[filters.paymentMethod] || filters.paymentMethod],
    filters.paymentStatus !== 'all' && ['paymentStatus', `Payment ${statusLabel(filters.paymentStatus).toLowerCase()}`],
  ].filter(Boolean);

  const columns = [
    { key: 'id', header: 'Order', render: (o) => <><Code>{o.orderId}</Code><span className="cell-sub">{o.items.length} item{o.items.length === 1 ? '' : 's'}</span></> },
    { key: 'customer', header: 'Customer', render: (o) => <Identity name={o.customer?.name} sub={o.customer?.phone} /> },
    { key: 'vendor', header: 'Store', hideOnMobile: true, render: (o) => <span className="cell-strong">{o.vendor?.storeName}</span> },
    { key: 'rider', header: 'Rider', hideOnMobile: true, render: (o) => (o.rider ? o.rider.name : <span className="muted">Not assigned</span>) },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <><span className="cell-strong">{money(o.totalAmount)}</span><span className="cell-sub">{PAYMENT_METHODS[o.paymentMethod] || o.paymentMethod} · {statusLabel(o.paymentStatus)}</span></> },
    { key: 'status', header: 'Status', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'placed', header: 'Placed', hideOnMobile: true, render: (o) => dateTime(o.createdAt) },
    { key: 'actions', header: '', render: (o) => <IconButton icon={Eye} label="View order" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.orderId}`); }} /> },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Track every order across the marketplace. Open one to see its timeline, cancel it, or confirm a return." />
      {failedCount > 0 && filters.status !== 'delivery_failed' && (
        <div className="callout callout-warning mb">
          <PackageX size={16} />
          <div><strong>{failedCount} failed deliver{failedCount === 1 ? 'y' : 'ies'} waiting for return confirmation.</strong> Confirm once the rider brings the items back to the store.</div>
          <div className="spacer" />
          <Button size="sm" variant="secondary" onClick={() => list.setFilter('status', 'delivery_failed')}>Review</Button>
        </div>
      )}
      <Tabs value={filters.status} onChange={(v) => list.setFilter('status', v)} tabs={STATUS_TABS.map((t) => (t.value === 'delivery_failed' && failed.data ? { ...t, count: failedCount } : t))} />
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Order or tracking id (ORD… / TRK…)" />
          {canSeeVendors && <Select value={filters.vendorId} onChange={(v) => list.setFilter('vendorId', v)} options={vendorOptions} />}
          <Select value={filters.paymentMethod} onChange={(v) => list.setFilter('paymentMethod', v)} options={METHOD_OPTIONS} />
          <Select value={filters.paymentStatus} onChange={(v) => list.setFilter('paymentStatus', v)} options={PAY_STATUS_OPTIONS} />
          <DateRange from={filters.from} to={filters.to} onChange={({ from, to }) => { list.setFilter('from', from); list.setFilter('to', to); }} />
        </div>
        {chips.length > 0 && (
          <div className="row row-wrap" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 6 }}>
            <span className="muted" style={{ fontSize: 12.5 }}>Filtered by</span>
            {chips.map(([key, label]) => (
              <Badge key={key} tone="brand">
                {label}
                <button type="button" className="search-clear" style={{ width: 16, height: 16 }} aria-label="Remove filter" onClick={() => list.setFilter(key, 'all')}><X size={10} /></button>
              </Badge>
            ))}
          </div>
        )}
        <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} onRowClick={(o) => navigate(`/orders/${o.orderId}`)} rowClassName={(o) => (o.status === 'delivery_failed' ? 'row-attention' : '')} />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
    </>
  );
}
