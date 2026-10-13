import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Banknote, BookOpen, Download, HandCoins, Landmark, Receipt, Send, Store, Bike, Wallet } from 'lucide-react';
import { useQueryState } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { useList } from '../lib/useList';
import { adminApi } from '../services/adminApi';
import { compactMoney, date, dateTime, money, timeAgo, titleCase } from '../lib/format';
import { Badge, Button, Card, Code, Field, Identity, Input, PageHeader, SearchInput, Segmented, Skeleton, StatCard, StatusBadge, Tabs } from '../ui/primitives';
import { Drawer, Menu, Modal } from '../ui/overlays';
import DataTable, { Pagination } from '../ui/DataTable';

const METHODS = [
  { value: 'bank_transfer', label: 'Bank transfer (IBFT)' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'Easypaisa' },
  { value: 'cash', label: 'Cash' },
];

// POST /admin/payouts  { userId, amount, method, reference, note }
function PayoutModal(props) {
  return props.target ? <PayoutBody key={props.target.user._id} {...props} /> : null;
}

function PayoutBody({ target, onClose, onDone }) {
  const [form, setForm] = useState(() => ({ amount: String(target.balance || ''), method: 'bank_transfer', reference: '', note: '' }));
  const [run, pending] = useAction();
  const amount = Number(form.amount);
  const error = amount > target.balance ? `Can't pay more than the outstanding ${money(target.balance)}` : amount <= 0 && form.amount !== '' ? 'Enter an amount above zero' : '';
  const submit = (e) => {
    e.preventDefault();
    if (error || !amount) return;
    run(() => adminApi.createPayout({ userId: target.user._id, amount, method: form.method, reference: form.reference, note: form.note }), { success: `${money(amount)} paid to ${target.user.name}` }).then(() => { onClose(); onDone(); }).catch(() => {});
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Pay ${target.user.name}`}
      description="Record money Fauran has sent to this account. It's added to the settlement history."
      icon={Send}
      footer={(
        <>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="payout-form" icon={Send} loading={pending} disabled={!!error || !amount}>Pay {amount ? money(amount) : ''}</Button>
        </>
      )}
    >
      <form id="payout-form" onSubmit={submit} className="stack">
        <div className="callout"><Wallet size={16} /><div>Outstanding balance <strong>{money(target.balance)}</strong> · paid so far {money(target.paidOut)}</div></div>
        <Field label="Amount" required error={error}>
          {(id) => <Input id={id} prefix="Rs." type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} autoFocus />}
        </Field>
        <div className="row" style={{ gap: 6, marginTop: -8 }}>
          {[0.25, 0.5, 1].map((f) => <button key={f} type="button" className="chip chip-add" onClick={() => setForm({ ...form, amount: String(Math.round(target.balance * f)) })}>{f === 1 ? 'Full balance' : `${f * 100}%`}</button>)}
        </div>
        <div className="form-grid">
          <Field label="Method">{(id) => <select id={id} className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select>}</Field>
          <Field label="Transaction reference" hint="Bank or wallet transaction id">{(id) => <Input id={id} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="IBFT123456" />}</Field>
          <Field label="Note" className="span-2">{(id) => <Input id={id} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Weekly settlement, week 41" />}</Field>
        </div>
      </form>
    </Modal>
  );
}

// POST /admin/payouts/cash-deposit  { riderId, amount, reference, note }
function CashDepositModal(props) {
  return props.target ? <CashDepositBody key={props.target === true ? 'any' : props.target.user._id} {...props} /> : null;
}

function CashDepositBody({ target, riders, onClose, onDone }) {
  // `target === true` means "no rider chosen yet" - preselect the first one holding cash.
  const [riderId, setRiderId] = useState(() => (target === true ? riders.find((r) => r.codHeld > 0)?.user._id || '' : target.user._id));
  const [form, setForm] = useState(() => ({ amount: String(riders.find((r) => r.user._id === riderId)?.codHeld || ''), reference: '', note: '' }));
  const [run, pending] = useAction();
  const rider = riders.find((r) => r.user._id === riderId);
  const amount = Number(form.amount);
  const error = rider && amount > rider.codHeld ? `This rider only holds ${money(rider.codHeld)}` : '';
  const submit = (e) => {
    e.preventDefault();
    if (!rider || error || !amount) return;
    run(() => adminApi.recordCashDeposit({ riderId, amount, reference: form.reference, note: form.note }), { success: `${money(amount)} deposit recorded for ${rider.user.name}` }).then(() => { onClose(); onDone(); }).catch(() => {});
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Record COD cash deposit"
      description="Log cash a rider has handed over at the hub. It reduces the COD they're holding."
      icon={HandCoins}
      tone="amber"
      footer={(
        <>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="deposit-form" icon={HandCoins} loading={pending} disabled={!!error || !amount}>Record deposit</Button>
        </>
      )}
    >
      <form id="deposit-form" onSubmit={submit} className="stack">
        <Field label="Rider" required>
          {(id) => (
            <select id={id} className="input" value={riderId} onChange={(e) => { setRiderId(e.target.value); setForm({ ...form, amount: String(riders.find((r) => r.user._id === e.target.value)?.codHeld || '') }); }}>
              {riders.map((r) => <option key={r.user._id} value={r.user._id}>{r.user.name} · holding {money(r.codHeld)}</option>)}
            </select>
          )}
        </Field>
        <Field label="Amount received" required error={error}>{(id) => <Input id={id} prefix="Rs." type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />}</Field>
        <div className="form-grid">
          <Field label="Receipt / slip no.">{(id) => <Input id={id} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="DEP-00412" />}</Field>
          <Field label="Received at">{(id) => <Input id={id} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Gulberg Hub counter" />}</Field>
        </div>
      </form>
    </Modal>
  );
}

// GET /admin/payouts/user/:id
function LedgerDrawer({ userId, onClose }) {
  const { data, loading } = useApi(() => (userId ? adminApi.getUserLedger(userId) : Promise.resolve(null)), [userId]);
  const totals = useMemo(() => (data ? data.entries.reduce((t, e) => ({ credit: t.credit + e.credit, debit: t.debit + e.debit }), { credit: 0, debit: 0 }) : null), [data]);
  return (
    <Drawer open={!!userId} onClose={onClose} width={620} title={data?.user ? `${data.user.name} · ledger` : 'Ledger'} subtitle={data?.user ? `${data.user.code} · ${titleCase(data.user.role)}` : 'Loading…'} footer={<Button variant="secondary" icon={Download}>Download statement</Button>}>
      {loading && !data ? <Skeleton h={300} /> : data && (
        <>
          <div className="ledger-summary">
            <div className="mini-stat"><span>Credits</span><strong className="pos">{compactMoney(totals.credit)}</strong></div>
            <div className="mini-stat"><span>Debits</span><strong className="neg">{compactMoney(totals.debit)}</strong></div>
            <div className="mini-stat"><span>Running balance</span><strong>{compactMoney(data.balance)}</strong></div>
          </div>
          <div className="list">
            {data.entries.map((e, i) => (
              <div className="list-item" key={`${e.ref}-${e.type}-${i}`}>
                <span className={`stat-icon ${e.credit ? 'tone-success' : 'tone-danger'}`} style={{ width: 32, height: 32 }}>{e.credit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span>
                <div className="identity-copy">
                  <strong>{e.description}</strong>
                  <small>{dateTime(e.at)} · {e.ref}</small>
                </div>
                <div className="list-item-end">
                  <strong className={e.credit ? 'pos' : 'neg'}>{e.credit ? `+ ${money(e.credit)}` : `− ${money(e.debit)}`}</strong>
                  <small>Bal. {money(e.balance)}</small>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Drawer>
  );
}

export default function Payouts() {
  const [tab, setTab] = useQueryState('tab', 'vendors');
  const [ledger, setLedger] = useQueryState('ledger');
  const [deposit, setDeposit] = useQueryState('deposit');
  const [search, setSearch] = useState('');
  const [payTarget, setPayTarget] = useState(null);
  const vendors = useApi(() => adminApi.getVendorBalances(), []);
  const riders = useApi(() => adminApi.getRiderBalances(), []);
  const settlements = useList(adminApi.getSettlements, ['type', 'partyType'], { limit: 10 });
  const riderRows = riders.data?.items || [];
  const vendorRows = vendors.data?.items || [];
  const depositTarget = deposit ? (deposit === '1' ? true : riderRows.find((r) => r.user._id === deposit) || (riderRows.length ? true : null)) : null;

  const refresh = () => { vendors.reload(); riders.reload(); settlements.reload(); };
  const match = (r) => `${r.user.name} ${r.user.code}`.toLowerCase().includes(search.toLowerCase());

  const vendorCols = [
    { key: 'vendor', header: 'Vendor', render: (b) => <Identity name={b.user.name} sub={`${b.user.code} · ${b.user.sub}`} square /> },
    { key: 'gross', header: 'Gross sales', align: 'right', hideOnMobile: true, render: (b) => money(b.grossSales) },
    { key: 'commission', header: 'Commission', align: 'right', hideOnMobile: true, render: (b) => (b.commission ? <span className="neg">− {money(b.commission)}</span> : <Badge>Dark store</Badge>) },
    { key: 'paid', header: 'Paid out', align: 'right', hideOnMobile: true, render: (b) => money(b.paidOut) },
    { key: 'balance', header: 'Owed to vendor', align: 'right', render: (b) => <span className="cell-strong">{money(b.balance)}</span> },
    { key: 'last', header: 'Last payout', hideOnMobile: true, render: (b) => (b.lastPayoutAt ? timeAgo(b.lastPayoutAt) : <span className="muted">Never</span>) },
    { key: 'actions', header: '', render: (b) => <div className="row" style={{ gap: 4 }}><Button size="sm" variant="soft" icon={Send} disabled={!b.balance} onClick={(e) => { e.stopPropagation(); setPayTarget(b); }}>Pay</Button><Menu items={[{ label: 'View ledger', icon: BookOpen, onClick: () => setLedger(b.user._id) }]} /></div> },
  ];

  const riderCols = [
    { key: 'rider', header: 'Rider', render: (b) => <Identity name={b.user.name} sub={`${b.user.code} · ${b.user.sub}`} /> },
    { key: 'earnings', header: 'Earnings', align: 'right', hideOnMobile: true, render: (b) => money(b.earnings) },
    { key: 'owed', header: 'Owed to rider', align: 'right', render: (b) => <span className="cell-strong">{money(b.balance)}</span> },
    { key: 'cod', header: 'COD cash held', align: 'right', render: (b) => (b.codHeld > 30000 ? <Badge tone="danger">{money(b.codHeld)}</Badge> : b.codHeld ? <span className="cell-strong">{money(b.codHeld)}</span> : <span className="muted">—</span>) },
    { key: 'deposit', header: 'Last deposit', hideOnMobile: true, render: (b) => (b.lastDepositAt ? timeAgo(b.lastDepositAt) : <span className="muted">Never</span>) },
    {
      key: 'actions',
      header: '',
      render: (b) => (
        <div className="row" style={{ gap: 4 }}>
          <Button size="sm" variant="soft" icon={HandCoins} disabled={!b.codHeld} onClick={(e) => { e.stopPropagation(); setDeposit(b.user._id); }}>Collect cash</Button>
          <Menu items={[{ label: 'Pay earnings', icon: Send, disabled: !b.balance, onClick: () => setPayTarget(b) }, { label: 'View ledger', icon: BookOpen, onClick: () => setLedger(b.user._id) }]} />
        </div>
      ),
    },
  ];

  const settlementCols = [
    { key: 'id', header: 'Settlement', render: (s) => <><Code>{s.settlementId}</Code>{s.reference && <span className="cell-sub">Ref {s.reference}</span>}</> },
    { key: 'type', header: 'Type', render: (s) => <StatusBadge status={s.type} /> },
    { key: 'party', header: 'Account', render: (s) => <Identity name={s.party.name} sub={`${s.party.code} · ${titleCase(s.partyType)}`} square={s.partyType === 'vendor'} /> },
    { key: 'amount', header: 'Amount', align: 'right', render: (s) => <span className={`cell-strong ${s.type === 'cash_deposit' ? 'pos' : ''}`}>{s.type === 'cash_deposit' ? '+ ' : '− '}{money(s.amount)}</span> },
    { key: 'method', header: 'Method', hideOnMobile: true, render: (s) => METHODS.find((m) => m.value === s.method)?.label || s.method },
    { key: 'by', header: 'Recorded by', hideOnMobile: true, render: (s) => <><span className="cell-strong">{s.createdBy}</span><span className="cell-sub">{s.note}</span></> },
    { key: 'date', header: 'Date', hideOnMobile: true, render: (s) => date(s.createdAt) },
  ];

  const owedVendors = vendorRows.reduce((s, b) => s + b.balance, 0);
  const owedRiders = riderRows.reduce((s, b) => s + b.balance, 0);
  const codHeld = riderRows.reduce((s, b) => s + b.codHeld, 0);

  return (
    <>
      <PageHeader
        title="Payouts & settlements"
        description="What Fauran owes vendors and riders, and the COD cash riders still need to hand over."
        actions={(
          <>
            <Button variant="secondary" icon={HandCoins} onClick={() => setDeposit('1')}>Record cash deposit</Button>
            <Button icon={Send} onClick={() => setTab('vendors')}>New payout</Button>
          </>
        )}
      />
      <div className="stat-grid">
        <StatCard icon={Store} label="Owed to vendors" value={compactMoney(owedVendors)} footer={`${vendorRows.filter((b) => b.balance > 0).length} vendors with a balance`} onClick={() => setTab('vendors')} />
        <StatCard icon={Bike} tone="violet" label="Owed to riders" value={compactMoney(owedRiders)} footer="Delivery earnings not yet paid" onClick={() => setTab('riders')} />
        <StatCard icon={Banknote} tone="rose" label="COD cash with riders" value={compactMoney(codHeld)} footer={`${riderRows.filter((b) => b.codHeld > 30000).length} riders over the Rs. 30k limit`} onClick={() => setTab('riders')} />
        <StatCard icon={Landmark} tone="blue" label="Settlements this week" value={settlements.total || '–'} footer="Payouts + cash deposits" onClick={() => setTab('settlements')} />
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'vendors', label: 'Vendor balances', icon: Store }, { value: 'riders', label: 'Rider balances & COD', icon: Bike }, { value: 'settlements', label: 'Settlement history', icon: Receipt, count: settlements.total }]} />

      {tab !== 'settlements' ? (
        <Card className="table-card" padded={false}>
          <div className="toolbar">
            <SearchInput value={search} onChange={setSearch} placeholder={`Search ${tab === 'vendors' ? 'vendor' : 'rider'} name or id`} />
            <div className="spacer" />
            <span className="muted" style={{ fontSize: 13 }}>Click a row to open the full ledger</span>
          </div>
          {tab === 'vendors'
            ? <DataTable columns={vendorCols} rows={vendorRows.filter(match)} rowKey={(b) => b.user._id} loading={vendors.loading} onRowClick={(b) => setLedger(b.user._id)} />
            : <DataTable columns={riderCols} rows={riderRows.filter(match)} rowKey={(b) => b.user._id} loading={riders.loading} onRowClick={(b) => setLedger(b.user._id)} rowClassName={(b) => (b.codHeld > 30000 ? 'row-attention' : '')} />}
        </Card>
      ) : (
        <Card className="table-card" padded={false}>
          <div className="toolbar">
            <Segmented value={settlements.filters.type} onChange={(v) => settlements.setFilter('type', v)} options={[{ value: 'all', label: 'All' }, { value: 'payout', label: 'Payouts' }, { value: 'cash_deposit', label: 'Cash deposits' }]} />
            <Segmented value={settlements.filters.partyType} onChange={(v) => settlements.setFilter('partyType', v)} options={[{ value: 'all', label: 'Everyone' }, { value: 'vendor', label: 'Vendors' }, { value: 'rider', label: 'Riders' }]} />
            <div className="spacer" />
            <SearchInput value={settlements.search} onChange={settlements.setSearch} placeholder="Settlement id, name or reference" />
          </div>
          <DataTable columns={settlementCols} rows={settlements.rows} loading={settlements.loading} error={settlements.error} onRetry={settlements.reload} />
          <Pagination page={settlements.page} limit={settlements.params.limit} total={settlements.total} onPage={settlements.setPage} />
        </Card>
      )}

      <PayoutModal target={payTarget} onClose={() => setPayTarget(null)} onDone={refresh} />
      <CashDepositModal target={depositTarget} riders={riderRows} onClose={() => setDeposit('')} onDone={refresh} />
      <LedgerDrawer userId={ledger} onClose={() => setLedger('')} />
    </>
  );
}
