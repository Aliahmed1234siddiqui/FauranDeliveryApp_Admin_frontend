import { CircleCheck, Clock, Download, Undo2 } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { adminApi } from '../services/adminApi';
import { compactMoney, dateTime, money } from '../lib/format';
import { Badge, Button, Card, Code, Identity, PageHeader, SearchInput, Segmented, Select, Skeleton, StatCard, StatusBadge } from '../ui/primitives';
import { Donut } from '../ui/charts';
import DataTable, { Pagination } from '../ui/DataTable';

const FILTERS = ['status', 'method'];
const METHOD = { cod: 'Cash on delivery', card: 'Card', wallet: 'Wallet' };

export default function Payments() {
  const { navigate } = useRouter();
  const list = useList(adminApi.getPayments, FILTERS, { limit: 10 });
  const summary = list.data?.summary;

  const columns = [
    { key: 'id', header: 'Payment', render: (p) => <><Code>{p.paymentId}</Code>{p.gatewayRef && <span className="cell-sub">Ref {p.gatewayRef}</span>}</> },
    { key: 'order', header: 'Order', render: (p) => <button type="button" className="link-btn" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${p.orderId}`); }}>{p.orderId}</button> },
    { key: 'customer', header: 'Customer', hideOnMobile: true, render: (p) => <Identity name={p.customer.name} sub={p.vendor.storeName} /> },
    { key: 'method', header: 'Method', render: (p) => <Badge tone={p.method === 'cod' ? 'warning' : p.method === 'card' ? 'info' : 'violet'}>{METHOD[p.method]}</Badge> },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, sortKey: 'amount', render: (p) => <span className="cell-strong">{money(p.amount)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'date', header: 'Date', hideOnMobile: true, sortable: true, sortKey: 'createdAt', render: (p) => dateTime(p.createdAt) },
  ];

  return (
    <>
      <PageHeader title="Payments" description="Every customer payment, by card, wallet or cash on delivery." actions={<Button variant="secondary" icon={Download}>Export CSV</Button>} />
      <div className="grid grid-main mb">
        <div className="stat-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {summary ? (
            <>
              <StatCard icon={CircleCheck} label="Collected" value={compactMoney(summary.collected)} footer="Settled to Fauran" onClick={() => list.setFilter('status', 'paid')} />
              <StatCard icon={Clock} tone="amber" label="Pending" value={compactMoney(summary.pending)} footer="Mostly COD in transit" onClick={() => list.setFilter('status', 'pending')} />
              <StatCard icon={Undo2} tone="violet" label="Refunded" value={compactMoney(summary.refunded)} footer="Cancellations & returns" onClick={() => list.setFilter('status', 'refunded')} />
            </>
          ) : [0, 1, 2].map((i) => <div key={i} className="stat-card"><Skeleton h={90} /></div>)}
        </div>
        <Card title="By payment method">
          {summary ? (
            <Donut
              size={140}
              thickness={18}
              format={compactMoney}
              centerValue={compactMoney(summary.byMethod.reduce((s, m) => s + m.amount, 0))}
              centerLabel="Total"
              data={summary.byMethod.map((m, i) => ({ label: METHOD[m.method], value: m.amount, color: `var(--series-${i + 1})` }))}
            />
          ) : <Skeleton h={140} />}
        </Card>
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={[{ value: 'all', label: 'All' }, { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'refunded', label: 'Refunded' }]} />
          <div className="spacer" />
          <Select value={list.filters.method} onChange={(v) => list.setFilter('method', v)} options={[{ value: 'all', label: 'All methods' }, ...Object.entries(METHOD).map(([value, label]) => ({ value, label }))]} />
          <SearchInput value={list.search} onChange={list.setSearch} placeholder="Payment id, order id, customer or ref" />
        </div>
        <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} sort={list.sort} onSort={list.setSort} />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
    </>
  );
}
