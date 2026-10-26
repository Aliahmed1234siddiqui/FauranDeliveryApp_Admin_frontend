import { CircleCheck, Clock, Undo2 } from 'lucide-react';
import { useRouter } from '../lib/router';
import { useList } from '../lib/useList';
import { paymentsApi } from '../services/api';
import { compactMoney, dateTime, money } from '../lib/format';
import { PAYMENT_METHODS, PAYMENT_RECORD_STATUSES, withAll } from '../lib/constants';
import { statusLabel } from '../ui/status';
import { Badge, Card, Code, EmptyState, Identity, PageHeader, Segmented, Select, Skeleton, StatCard, StatusBadge } from '../ui/primitives';
import { Donut } from '../ui/charts';
import DataTable, { Pagination } from '../ui/DataTable';
import { DateRange, RefundButton } from './shared';

const FILTERS = ['status', 'method', 'from', 'to'];
const METHOD_OPTIONS = withAll('All methods', Object.keys(PAYMENT_METHODS), (m) => PAYMENT_METHODS[m]);
const STATUS_OPTIONS = withAll('All', PAYMENT_RECORD_STATUSES, statusLabel);

const sum = (rows, pick) => rows.reduce((s, r) => s + (Number(pick(r)) || 0), 0);

// The API's total-amount header isn't readable from the browser yet, so the
// summary only covers the rows on the current page and says so.
function pageSummary(rows) {
  const succeeded = rows.filter((p) => p.status === 'succeeded');
  return {
    succeeded: sum(succeeded, (p) => p.amount),
    pending: sum(rows.filter((p) => p.status === 'pending'), (p) => p.amount),
    refunded: sum(rows, (p) => p.refundedAmount),
    byMethod: Object.keys(PAYMENT_METHODS).map((method) => ({ method, amount: sum(succeeded.filter((p) => p.method === method), (p) => p.amount) })),
  };
}

export default function Payments() {
  const { navigate } = useRouter();
  const list = useList(paymentsApi.list, FILTERS, { defaults: { from: '', to: '' } });
  const summary = list.rows ? pageSummary(list.rows) : null;
  const methodTotal = summary ? sum(summary.byMethod, (m) => m.amount) : 0;

  const columns = [
    { key: 'id', header: 'Payment', render: (p) => <><Code>{p.paymentId}</Code>{p.stripePaymentIntentId && <span className="cell-sub">Ref {p.stripePaymentIntentId}</span>}</> },
    { key: 'order', header: 'Order', render: (p) => (p.order ? <button type="button" className="link-btn" onClick={() => navigate(`/orders/${p.order.orderId}`)}>{p.order.orderId}</button> : '—') },
    { key: 'customer', header: 'Customer', hideOnMobile: true, render: (p) => <Identity name={p.order?.customer?.name || '—'} sub={p.order?.vendor?.storeName} /> },
    { key: 'method', header: 'Method', render: (p) => <Badge tone={p.method === 'cod' ? 'warning' : 'info'}>{PAYMENT_METHODS[p.method] || p.method}</Badge> },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => <><span className="cell-strong">{money(p.amount)}</span>{p.refundedAmount > 0 && <span className="cell-sub">{money(p.refundedAmount)} refunded</span>}</> },
    { key: 'commission', header: 'Commission from vendor', align: 'right', hideOnMobile: true, render: (p) => money(p.commissionAmount) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'date', header: 'Date', hideOnMobile: true, render: (p) => dateTime(p.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (p) => (p.method === 'stripe' && p.status === 'succeeded' && !(p.refundedAmount > 0) && p.order
        ? <RefundButton order={p.order} maxAmount={p.amount} size="sm" variant="ghost" onDone={list.reload} />
        : null),
    },
  ];

  return (
    <>
      <PageHeader title="Payments" description="Every customer payment, by card or cash on delivery. Card refunds are issued from here or from the order." />
      <div className="grid grid-main mb">
        <div className="stat-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {summary ? (
            <>
              <StatCard icon={CircleCheck} label="Succeeded on this page" value={compactMoney(summary.succeeded)} footer="Sum of the rows shown below" onClick={() => list.setFilter('status', 'succeeded')} />
              <StatCard icon={Clock} tone="amber" label="Pending on this page" value={compactMoney(summary.pending)} footer="Not yet collected" onClick={() => list.setFilter('status', 'pending')} />
              <StatCard icon={Undo2} tone="violet" label="Refunded on this page" value={compactMoney(summary.refunded)} footer="Card refunds in these rows" onClick={() => list.setFilter('status', 'refunded')} />
            </>
          ) : [0, 1, 2].map((i) => <div key={i} className="stat-card"><Skeleton h={90} /></div>)}
        </div>
        <Card title="Succeeded by method" subtitle="This page only">
          {!summary ? <Skeleton h={140} /> : methodTotal > 0 ? (
            <Donut
              size={140}
              thickness={18}
              format={compactMoney}
              centerValue={compactMoney(methodTotal)}
              centerLabel="Total"
              data={summary.byMethod.map((m, i) => ({ label: PAYMENT_METHODS[m.method], value: m.amount, color: `var(--series-${i + 1})` }))}
            />
          ) : <EmptyState icon={CircleCheck} title="No succeeded payments" description="Nothing succeeded among the rows on this page." />}
        </Card>
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented value={list.filters.status} onChange={(v) => list.setFilter('status', v)} options={STATUS_OPTIONS} />
          <div className="spacer" />
          <Select value={list.filters.method} onChange={(v) => list.setFilter('method', v)} options={METHOD_OPTIONS} />
          <DateRange from={list.filters.from} to={list.filters.to} onChange={({ from, to }) => { list.setFilter('from', from); list.setFilter('to', to); }} />
        </div>
        <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
    </>
  );
}
