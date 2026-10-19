import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Banknote, BookOpen, HandCoins, Info, Landmark, Receipt, Send, Store, Bike, Wallet } from 'lucide-react';
import { useQueryState } from '../lib/router';
import { useAction, useApi } from '../lib/hooks';
import { useList } from '../lib/useList';
import { payoutsApi, settlementsApi, SETTLEMENT_METHODS } from '../services/api';
import { SETTLEMENT_METHOD_LABELS, withAll } from '../lib/constants';
import { compactMoney, date, dateTime, money, num, timeAgo, titleCase } from '../lib/format';
import { Badge, Button, Card, Code, EmptyState, ErrorState, Field, Identity, Input, PageHeader, SearchInput, Segmented, Skeleton, StatCard, StatusBadge, Tabs, Toggle } from '../ui/primitives';
import { Drawer, Menu, Modal } from '../ui/overlays';
import DataTable, { Pagination } from '../ui/DataTable';
import { DateRange } from './shared';

const METHOD_OPTIONS = SETTLEMENT_METHODS.map((m) => ({ value: m, label: SETTLEMENT_METHOD_LABELS[m] || titleCase(m) }));
const methodLabel = (m) => SETTLEMENT_METHOD_LABELS[m] || titleCase(m || '');
const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0);

// "Bank · 0123…" line for vendor bankDetails / rider payoutDetails.
function AccountCell({ account, provider }) {
  if (!account?.accountNumber) return <span className="muted">Not added</span>;
  return <><span className="cell-strong">{provider || account.accountTitle}</span><span className="cell-sub">{account.accountNumber}{provider && account.accountTitle ? ` · ${account.accountTitle}` : ''}</span></>;
}

// Amount / method / reference / note, shared by the payout and cash-deposit dialogs.
function SettlementFields({ form, setForm, error, max, amountLabel }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <>
      <Field label={amountLabel} required error={error} hint={`Up to ${money(max)}`}>
        {(id) => <Input id={id} prefix="Rs." type="number" min="1" max={max} value={form.amount} onChange={set('amount')} autoFocus />}
      </Field>
      <div className="row" style={{ gap: 6, marginTop: -8 }}>
        {[0.25, 0.5, 1].map((f) => <button key={f} type="button" className="chip chip-add" onClick={() => setForm((s) => ({ ...s, amount: String(f === 1 ? max : Math.floor(max * f)) }))}>{f === 1 ? 'Full amount' : `${f * 100}%`}</button>)}
      </div>
      <div className="form-grid">
        <Field label="Method">{(id) => <select id={id} className="input" value={form.method} onChange={set('method')}>{METHOD_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select>}</Field>
        <Field label="Reference" hint="Bank / wallet transaction id or receipt no.">{(id) => <Input id={id} value={form.reference} onChange={set('reference')} placeholder="IBFT123456" />}</Field>
        <Field label="Note" className="span-2">{(id) => <Input id={id} value={form.note} onChange={set('note')} placeholder="e.g. Weekly settlement, week 41" />}</Field>
      </div>
    </>
  );
}

const amountError = (form, max, overMessage) => {
  const amount = Number(form.amount);
  if (form.amount === '') return '';
  if (!(amount > 0)) return 'Enter an amount above zero';
  return amount > max ? overMessage : '';
};

// POST /admin/payouts. target: { userId, name, max, paidOut, account, kind, cashInHand? }
function PayoutModal(props) {
  return props.target ? <PayoutBody key={props.target.userId} {...props} /> : null;
}

function PayoutBody({ target, onClose, onDone }) {
  const [form, setForm] = useState(() => ({ amount: target.max > 0 ? String(target.max) : '', method: 'bank_transfer', reference: '', note: '' }));
  const [run, pending] = useAction();
  const amount = Number(form.amount);
  const error = amountError(form, target.max, `Only ${money(target.max)} is owed to this ${target.kind}`);
  const submit = (e) => {
    e.preventDefault();
    if (error || !amount) return;
    run(() => payoutsApi.create({ userId: target.userId, ...form }), { success: `${money(amount)} paid to ${target.name}` })
      .then(() => { onClose(); onDone(); }).catch(() => {});
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Pay ${target.name}`}
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
        <div className="callout"><Wallet size={16} /><div>Owed now <strong>{money(target.max)}</strong> · paid so far {money(target.paidOut)}{target.account?.accountNumber ? <> · send to {target.account.bankName || methodLabel(target.account.method)} {target.account.accountNumber}</> : null}</div></div>
        {target.cashInHand > 0 && <div className="callout callout-warning"><Info size={16} /><div>This rider still holds <strong>{money(target.cashInHand)}</strong> of COD cash, which is netted off what they're owed. Record their cash deposit first to pay out the rest.</div></div>}
        <SettlementFields form={form} setForm={setForm} error={error} max={target.max} amountLabel="Amount" />
      </form>
    </Modal>
  );
}

// POST /admin/payouts/cash-deposit. `riderId` is a RID… id, or '1' for "pick a rider".
function CashDepositModal(props) {
  // Remount once the rider list arrives so the preselected rider and amount fill in.
  return props.riderId ? <CashDepositBody key={`${props.riderId}-${props.riders.length > 0}`} {...props} /> : null;
}

function CashDepositBody({ riderId: initialId, riders, loading, onClose, onDone }) {
  const holding = riders.filter((r) => r.cashInHand > 0);
  const [riderId, setRiderId] = useState(() => (initialId !== '1' ? initialId : holding[0]?.riderId || ''));
  const rider = riders.find((r) => r.riderId === riderId);
  const [form, setForm] = useState(() => ({ amount: rider?.cashInHand > 0 ? String(rider.cashInHand) : '', method: 'cash', reference: '', note: '' }));
  const [run, pending] = useAction();
  const max = rider?.cashInHand || 0;
  const amount = Number(form.amount);
  const error = amountError(form, max, `This rider only holds ${money(max)}`);
  const pick = (id) => {
    setRiderId(id);
    const r = riders.find((x) => x.riderId === id);
    setForm((f) => ({ ...f, amount: r?.cashInHand > 0 ? String(r.cashInHand) : '' }));
  };
  const submit = (e) => {
    e.preventDefault();
    if (!rider || error || !amount) return;
    run(() => payoutsApi.recordCashDeposit({ riderId, ...form }), { success: `${money(amount)} received from ${rider.name}` })
      .then(() => { onClose(); onDone(); }).catch(() => {});
  };
  // The rider from the URL may not be in the list yet (or holds no cash), keep them selectable.
  const options = rider && !holding.includes(rider) ? [rider, ...holding] : holding;

  return (
    <Modal
      open
      onClose={onClose}
      title="Record cash received"
      description="Log COD cash a rider has handed over. It lowers their cash in hand and raises what Fauran owes them."
      icon={HandCoins}
      tone="amber"
      footer={(
        <>
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="deposit-form" icon={HandCoins} loading={pending} disabled={!rider || !!error || !amount}>Record deposit</Button>
        </>
      )}
    >
      {loading && !riders.length ? <Skeleton h={160} /> : !options.length ? (
        <EmptyState icon={HandCoins} title="No rider is holding cash" description="Cash in hand appears here once riders collect COD payments." />
      ) : (
        <form id="deposit-form" onSubmit={submit} className="stack">
          <Field label="Rider" required>
            {(id) => (
              <select id={id} className="input" value={riderId} onChange={(e) => pick(e.target.value)}>
                {!rider && <option value="">Choose a rider</option>}
                {options.map((r) => <option key={r.riderId} value={r.riderId}>{r.name} · {r.riderId} · holding {money(r.cashInHand)}</option>)}
              </select>
            )}
          </Field>
          {rider && <SettlementFields form={form} setForm={setForm} error={error} max={max} amountLabel="Amount received" />}
        </form>
      )}
    </Modal>
  );
}

// GET /admin/payouts/user/:id → { user, balance, settlements }
function LedgerDrawer({ userId, onClose }) {
  const { data, loading, error, reload } = useApi(() => (userId ? payoutsApi.ledger(userId) : Promise.resolve(null)), [userId]);
  const user = data?.user;
  const b = data?.balance || {};
  const isRider = b.cashInHand !== undefined;
  return (
    <Drawer open={!!userId} onClose={onClose} width={620} title={user ? `${user.storeName || user.name} · ledger` : 'Ledger'} subtitle={user ? `${user.vendorId || user.riderId || userId} · ${titleCase(user.role || (isRider ? 'rider' : 'vendor'))}` : 'Loading…'}>
      {loading && !data ? <Skeleton h={300} /> : error && !data ? <ErrorState error={error} onRetry={reload} /> : data && (
        <>
          <div className="ledger-summary">
            <div className="mini-stat"><span>Total earned</span><strong>{compactMoney(b.totalEarned)}</strong></div>
            <div className="mini-stat"><span>Paid out</span><strong className="neg">{compactMoney(b.paidOut)}</strong></div>
            {isRider ? (
              <div className="mini-stat">
                <span>{b.riderOwesFuran > 0 ? 'Rider owes Fauran' : 'Fauran owes rider'}</span>
                <strong className={b.riderOwesFuran > 0 ? 'neg' : 'pos'}>{compactMoney(b.riderOwesFuran > 0 ? b.riderOwesFuran : b.furanOwesRider)}</strong>
                <small>Cash in hand {money(b.cashInHand)}</small>
              </div>
            ) : <div className="mini-stat"><span>Due to vendor</span><strong className="pos">{compactMoney(b.due)}</strong></div>}
          </div>
          {!data.settlements?.length ? <EmptyState icon={Receipt} title="No settlements yet" description="Payouts and cash deposits for this account will show here." /> : (
            <div className="list">
              {data.settlements.map((s) => {
                const incoming = s.type === 'cash_deposit';
                return (
                  <div className="list-item" key={s._id}>
                    <span className={`stat-icon ${incoming ? 'tone-success' : 'tone-danger'}`} style={{ width: 32, height: 32 }}>{incoming ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span>
                    <div className="identity-copy">
                      <strong>{incoming ? 'Cash received from rider' : 'Payout sent'} · {methodLabel(s.method)}</strong>
                      <small>{dateTime(s.createdAt)} · {s.settlementId}{s.reference ? ` · Ref ${s.reference}` : ''}{s.note ? ` · ${s.note}` : ''}</small>
                    </div>
                    <div className="list-item-end">
                      <strong className={incoming ? 'pos' : 'neg'}>{incoming ? '+ ' : '− '}{money(s.amount)}</strong>
                      {s.createdBy?.name && <small>by {s.createdBy.name}</small>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}

function RiderBalance({ r }) {
  if (r.furanOwesRider > 0) return <span className="cell-strong pos">Fauran owes {money(r.furanOwesRider)}</span>;
  if (r.riderOwesFuran > 0) return <Badge tone="danger">Rider owes {money(r.riderOwesFuran)}</Badge>;
  return <span className="muted">Settled</span>;
}

function MoneyRule({ children }) {
  return <div style={{ padding: '12px 16px 0' }}><div className="callout callout-info"><Info size={16} /><div>{children}</div></div></div>;
}

const lastPayout = (at) => (at ? timeAgo(at) : <span className="muted">Never</span>);

function VendorTab({ list, onlyDue, setOnlyDue, onPay, onLedger }) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const rows = list.data?.filter((v) => !q || `${v.storeName} ${v.name} ${v.vendorId}`.toLowerCase().includes(q));
  const columns = [
    { key: 'vendor', header: 'Vendor', render: (v) => <Identity name={v.storeName || v.name} sub={`${v.vendorId} · ${v.name}`} square /> },
    { key: 'bank', header: 'Bank details', hideOnMobile: true, render: (v) => <AccountCell account={v.bankDetails} provider={v.bankDetails?.bankName} /> },
    { key: 'orders', header: 'Delivered', align: 'right', hideOnMobile: true, render: (v) => num(v.deliveredOrders) },
    { key: 'earned', header: 'Earned', align: 'right', hideOnMobile: true, render: (v) => money(v.totalEarned) },
    { key: 'paid', header: 'Paid out', align: 'right', hideOnMobile: true, render: (v) => money(v.paidOut) },
    { key: 'due', header: 'Due', align: 'right', render: (v) => <span className="cell-strong">{money(v.due)}</span> },
    { key: 'last', header: 'Last payout', hideOnMobile: true, render: (v) => lastPayout(v.lastPayoutAt) },
    { key: 'actions', header: '', render: (v) => <div className="row" style={{ gap: 4 }}><Button size="sm" variant="soft" icon={Send} disabled={!(v.due > 0)} onClick={(e) => { e.stopPropagation(); onPay(v); }}>Pay</Button><Menu items={[{ label: 'View ledger', icon: BookOpen, onClick: () => onLedger(v.vendorId) }]} /></div> },
  ];
  return (
    <Card className="table-card" padded={false}>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search store, owner or vendor id" />
        <div className="spacer" />
        <Toggle label="Only vendors owed money" checked={onlyDue} onChange={setOnlyDue} />
      </div>
      <MoneyRule>Due = total earned − paid out. You can pay a vendor up to what&apos;s due.</MoneyRule>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="vendorId"
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        onRowClick={(v) => onLedger(v.vendorId)}
        empty={<EmptyState icon={Store} title={q ? 'No matching vendors' : onlyDue ? 'No vendor is owed money' : 'No vendors yet'} description={q ? 'Try a different name or id.' : undefined} />}
      />
    </Card>
  );
}

function RiderTab({ list, owes, setOwes, onPay, onDeposit, onLedger }) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const rows = list.data?.filter((r) => !q || `${r.name} ${r.riderId} ${r.phone}`.toLowerCase().includes(q));
  const columns = [
    { key: 'rider', header: 'Rider', render: (r) => <Identity name={r.name} sub={[r.riderId, r.vehicleNumber].filter(Boolean).join(' · ')} /> },
    { key: 'payout', header: 'Payout details', hideOnMobile: true, render: (r) => <AccountCell account={r.payoutDetails} provider={r.payoutDetails?.method && methodLabel(r.payoutDetails.method)} /> },
    { key: 'earned', header: 'Earned', align: 'right', hideOnMobile: true, render: (r) => money(r.totalEarned) },
    { key: 'paid', header: 'Paid out', align: 'right', hideOnMobile: true, render: (r) => money(r.paidOut) },
    { key: 'cash', header: 'Cash in hand', align: 'right', render: (r) => (r.cashInHand > 0 ? <span className="cell-strong">{money(r.cashInHand)}</span> : <span className="muted">—</span>) },
    { key: 'balance', header: 'Balance', align: 'right', render: (r) => <RiderBalance r={r} /> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="row" style={{ gap: 4 }}>
          <Button size="sm" variant="soft" icon={HandCoins} disabled={!(r.cashInHand > 0)} onClick={(e) => { e.stopPropagation(); onDeposit(r.riderId); }}>Cash received</Button>
          <Menu items={[{ label: 'Pay rider', icon: Send, disabled: !(r.furanOwesRider > 0), onClick: () => onPay(r) }, { label: 'View ledger', icon: BookOpen, onClick: () => onLedger(r.riderId) }]} />
        </div>
      ),
    },
  ];
  return (
    <Card className="table-card" padded={false}>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search rider name, id or phone" />
        <div className="spacer" />
        <Segmented value={owes} onChange={setOwes} options={[{ value: '', label: 'All riders' }, { value: 'furan', label: 'Fauran owes rider' }, { value: 'rider', label: 'Rider owes Fauran' }]} />
      </div>
      <MoneyRule>
        Cash in hand = COD collected − cash deposited. Balance = earned − paid out − cash in hand. A rider can only be paid what Fauran owes them, so record cash received first.
      </MoneyRule>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="riderId"
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        onRowClick={(r) => onLedger(r.riderId)}
        rowClassName={(r) => (r.riderOwesFuran > 0 ? 'row-attention' : '')}
        empty={<EmptyState icon={Bike} title={q ? 'No matching riders' : 'No riders in this view'} description={q ? 'Try a different name or id.' : undefined} />}
      />
    </Card>
  );
}

// GET /admin/settlements - user is a vendor ({ vendorId, storeName }) or a rider ({ riderId, name }).
function SettlementsTab({ list }) {
  const columns = [
    { key: 'id', header: 'Settlement', render: (s) => <><Code>{s.settlementId}</Code>{s.reference && <span className="cell-sub">Ref {s.reference}</span>}</> },
    { key: 'type', header: 'Type', render: (s) => <StatusBadge status={s.type} /> },
    { key: 'user', header: 'Account', render: (s) => <Identity name={s.user?.storeName || s.user?.name || '—'} sub={`${s.user?.vendorId || s.user?.riderId || ''} · ${titleCase(s.role || s.user?.role || '')}`} square={s.role === 'vendor'} /> },
    { key: 'amount', header: 'Amount', align: 'right', render: (s) => <span className={`cell-strong ${s.type === 'cash_deposit' ? 'pos' : ''}`}>{s.type === 'cash_deposit' ? '+ ' : '− '}{money(s.amount)}</span> },
    { key: 'method', header: 'Method', hideOnMobile: true, render: (s) => methodLabel(s.method) },
    { key: 'by', header: 'Recorded by', hideOnMobile: true, render: (s) => <><span className="cell-strong">{s.createdBy?.name || '—'}</span><span className="cell-sub">{s.createdBy?.adminId || s.createdBy?.employeeId}{s.note ? ` · ${s.note}` : ''}</span></> },
    { key: 'date', header: 'Date', hideOnMobile: true, render: (s) => date(s.createdAt) },
  ];
  const { filters, setFilter } = list;
  return (
    <Card className="table-card" padded={false}>
      <div className="toolbar">
        <Segmented value={filters.type} onChange={(v) => setFilter('type', v)} options={withAll('All', ['payout', 'cash_deposit'], (v) => (v === 'payout' ? 'Payouts' : 'Cash deposits'))} />
        <Segmented value={filters.role} onChange={(v) => setFilter('role', v)} options={withAll('Everyone', ['vendor', 'rider'], (v) => `${titleCase(v)}s`)} />
        <div className="spacer" />
        <DateRange from={filters.from} to={filters.to} onChange={({ from, to }) => { setFilter('from', from); setFilter('to', to); }} />
      </div>
      <DataTable columns={columns} rows={list.rows} loading={list.loading} error={list.error} onRetry={list.reload} empty={<EmptyState icon={Receipt} title="No settlements" description="Payouts and cash deposits you record appear here." />} />
      <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
    </Card>
  );
}

const SETTLEMENT_FILTERS = ['role', 'type', 'from', 'to'];

export default function Payouts() {
  const [tab, setTab] = useQueryState('tab', 'vendors');
  const [ledger, setLedger] = useQueryState('ledger');
  const [deposit, setDeposit] = useQueryState('deposit');
  const [due, setDue] = useQueryState('due');
  const [owes, setOwes] = useQueryState('owes');
  const [payTarget, setPayTarget] = useState(null);

  const vendors = useApi(() => payoutsApi.vendorBalances({ due: due === '1' || undefined }), [due]);
  // Unfiltered riders feed the stat cards and the cash-deposit picker; the table re-fetches with `owes`.
  const ridersAll = useApi(() => payoutsApi.riderBalances(), []);
  const ridersOwes = useApi(() => (owes ? payoutsApi.riderBalances({ owes }) : Promise.resolve(null)), [owes]);
  const settlements = useList(settlementsApi.list, SETTLEMENT_FILTERS, { limit: 10, defaults: { from: '', to: '' } });

  const vendorRows = vendors.data || [];
  const riderRows = ridersAll.data || [];
  const refresh = () => { vendors.reload(); ridersAll.reload(); ridersOwes.reload(); settlements.reload(); };

  const payVendor = (v) => setPayTarget({ kind: 'vendor', userId: v.vendorId, name: v.storeName || v.name, max: v.due, paidOut: v.paidOut, account: v.bankDetails });
  const payRider = (r) => setPayTarget({ kind: 'rider', userId: r.riderId, name: r.name, max: r.furanOwesRider, paidOut: r.paidOut, account: r.payoutDetails, cashInHand: r.cashInHand });
  const openDeposit = (id) => { setTab('riders'); setDeposit(id); };

  return (
    <>
      <PageHeader
        title="Payouts & settlements"
        description="What Fauran owes vendors and riders, and the COD cash riders still need to hand over."
        actions={<Button variant="secondary" icon={HandCoins} onClick={() => openDeposit('1')}>Record cash received</Button>}
      />
      <div className="stat-grid">
        <StatCard icon={Store} label="Due to vendors" value={vendors.loading && !vendors.data ? '–' : compactMoney(sum(vendorRows, 'due'))} footer={`${vendorRows.filter((v) => v.due > 0).length} vendors owed money`} onClick={() => setTab('vendors')} />
        <StatCard icon={Bike} tone="violet" label="Fauran owes riders" value={ridersAll.loading && !ridersAll.data ? '–' : compactMoney(sum(riderRows, 'furanOwesRider'))} footer={`${riderRows.filter((r) => r.furanOwesRider > 0).length} riders to pay`} onClick={() => { setTab('riders'); setOwes('furan'); }} />
        <StatCard icon={Banknote} tone="rose" label="COD cash with riders" value={ridersAll.loading && !ridersAll.data ? '–' : compactMoney(sum(riderRows, 'cashInHand'))} footer={`${riderRows.filter((r) => r.cashInHand > 0).length} riders holding cash`} onClick={() => setTab('riders')} />
        <StatCard icon={Landmark} tone="blue" label="Riders owe Fauran" value={ridersAll.loading && !ridersAll.data ? '–' : compactMoney(sum(riderRows, 'riderOwesFuran'))} footer="Cash held beyond their earnings" onClick={() => { setTab('riders'); setOwes('rider'); }} />
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ value: 'vendors', label: 'Vendor balances', icon: Store }, { value: 'riders', label: 'Rider balances & COD', icon: Bike }, { value: 'settlements', label: 'Settlement history', icon: Receipt, count: settlements.total || undefined }]} />

      {tab === 'vendors' && <VendorTab list={vendors} onlyDue={due === '1'} setOnlyDue={(on) => setDue(on ? '1' : '')} onPay={payVendor} onLedger={setLedger} />}
      {tab === 'riders' && <RiderTab list={owes ? ridersOwes : ridersAll} owes={owes} setOwes={setOwes} onPay={payRider} onDeposit={openDeposit} onLedger={setLedger} />}
      {tab === 'settlements' && <SettlementsTab list={settlements} />}

      <PayoutModal target={payTarget} onClose={() => setPayTarget(null)} onDone={refresh} />
      <CashDepositModal riderId={deposit} riders={riderRows} loading={ridersAll.loading} onClose={() => setDeposit('')} onDone={refresh} />
      <LedgerDrawer userId={ledger} onClose={() => setLedger('')} />
    </>
  );
}
