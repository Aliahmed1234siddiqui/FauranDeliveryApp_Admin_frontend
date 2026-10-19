import { useState } from 'react';
import { Bike, Check, CheckCircle2, Clock, CreditCard, IdCard, Landmark, MapPin, Phone, RotateCcw, ShieldCheck, Star, X } from 'lucide-react';
import { useAction, useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { payoutsApi, ridersApi } from '../services/api';
import { date, money, num, pct, timeAgo, titleCase, toLatLng } from '../lib/format';
import { Avatar, Badge, Button, Card, Code, ErrorState, KeyValue, Progress, StatusBadge } from '../ui/primitives';
import { ConfirmDialog, Menu } from '../ui/overlays';
import { ApprovalPanel, BackLink, BlockButton, DetailSkeleton, DocumentList } from './shared';

// Online riders are either free for a new order or out on one.
const riderNowStatus = (r) => (!r.isOnline ? 'offline' : r.isAvailable ? 'available' : 'busy');

export default function RiderDetail({ params }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const { data, loading, error, reload, setData } = useApi(() => ridersApi.get(params.id), [params.id]);
  // Earnings vs. COD position comes from the payouts ledger (payments permission only).
  const ledger = useApi(() => (can('payments') ? payoutsApi.ledger(params.id) : Promise.resolve(null)), [params.id]);

  if (loading && !data) return <DetailSkeleton />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { rider: r, stats, recentOrders } = data;
  // setApproval and the block switch both resolve the updated rider.
  const mergeRider = (u) => setData((d) => ({ ...d, rider: { ...d.rider, ...u } }));
  const decide = (status, reason) => ridersApi.setApproval(r._id, status, reason).then(mergeRider);
  const location = toLatLng(r.currentLocation);

  return (
    <>
      <BackLink to="/riders">All riders</BackLink>
      <Card className="mb">
        <div className="profile-card">
          <Avatar name={r.name} size="lg" />
          <div>
            <div className="row row-wrap">
              <h2>{r.name}</h2>
              <StatusBadge status={r.approvalStatus} />
              {!r.isActive && <StatusBadge status="blocked" />}
              {r.approvalStatus === 'approved' && <StatusBadge status={riderNowStatus(r)} />}
            </div>
            <p>
              <span><Code>{r.riderId}</Code></span>
              <span><Phone size={14} /> {r.phone}</span>
              <span><Bike size={14} /> {titleCase(r.vehicleType || '—')} · {r.vehicleNumber || '—'}</span>
              <span><Clock size={14} /> Joined {date(r.createdAt)}</span>
            </p>
          </div>
          <div className="profile-actions">
            {r.isOnline && location && <Button variant="secondary" icon={MapPin} onClick={() => navigate(`/riders/live?rider=${r._id}`)}>Locate</Button>}
            {can('payments') && r.approvalStatus === 'approved' && <Button variant="secondary" icon={Landmark} onClick={() => navigate(`/payouts?tab=riders&ledger=${r._id}`)}>Ledger</Button>}
            {r.approvalStatus !== 'pending' && <ChangeDecision status={r.approvalStatus} onDecide={decide} />}
            <BlockButton user={r} kind="rider" onDone={mergeRider} />
          </div>
        </div>
      </Card>

      {r.approvalStatus === 'pending' && (
        <ApprovalPanel
          title="New rider application"
          description="Verify the CNIC, driving licence and vehicle registration before approving. Approved riders can start accepting orders right away."
          onDecide={decide}
        >
          <DocumentList documents={r.documents} />
        </ApprovalPanel>
      )}

      <div className="grid grid-side">
        <div className="stack">
          <PerformanceCard stats={stats} />
          <RecentDeliveries orders={recentOrders} onOpen={(o) => navigate(`/orders/${o.orderId}`)} />
        </div>
        <div className="stack">
          <Card title="Rider details">
            <KeyValue columns={1} items={[
              ['Email', r.email],
              ['CNIC', r.cnic && <span key="c" className="row" style={{ gap: 6 }}><IdCard size={14} className="muted" /><Code>{r.cnic}</Code></span>],
              ['Driving licence', r.licenseNumber && <Code key="l">{r.licenseNumber}</Code>],
              ['Vehicle', <span key="v" className="row" style={{ gap: 6 }}><Bike size={14} className="muted" />{titleCase(r.vehicleType || '—')} · {r.vehicleNumber || '—'}</span>],
              ['Last known location', location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Never shared'],
            ]} />
          </Card>
          <Card title="Payout account">
            {r.payoutDetails?.accountNumber ? (
              <KeyValue columns={1} items={[
                ['Method', titleCase(r.payoutDetails.method || '—')],
                ['Account title', r.payoutDetails.accountTitle],
                ['Account number', <Code key="a">{r.payoutDetails.accountNumber}</Code>],
              ]} />
            ) : <p className="muted">No payout account added yet.</p>}
          </Card>
          {ledger.data?.balance && <SettlementCard balance={ledger.data.balance} onDeposit={() => navigate(`/payouts?tab=riders&deposit=${r.riderId}`)} />}
          {r.approvalStatus !== 'pending' && (
            <Card title="Documents">
              <DocumentList documents={r.documents} />
            </Card>
          )}
          {r.approvalStatus === 'approved' && <div className="callout"><CheckCircle2 size={16} className="pos" /><div><strong>Documents reviewed.</strong> They were checked when this rider was approved.</div></div>}
        </div>
      </div>
    </>
  );
}

function PerformanceCard({ stats }) {
  const successRate = stats.totalAssigned ? (stats.deliveries / stats.totalAssigned) * 100 : 0;
  return (
    <Card title="Delivery performance" subtitle="Lifetime">
      <div className="mini-stats">
        <div className="mini-stat"><span>Deliveries</span><strong>{num(stats.deliveries)}</strong></div>
        <div className="mini-stat"><span>Rating</span><strong className="row" style={{ gap: 4 }}>{stats.totalRatings ? stats.rating : '—'} {stats.totalRatings > 0 && <Star size={15} fill="var(--accent)" color="var(--accent)" />}</strong></div>
        <div className="mini-stat"><span>Earnings</span><strong>{money(stats.totalEarnings)}</strong></div>
        <div className="mini-stat"><span>Avg. delivery</span><strong>{stats.avgDeliveryMinutes ? `${Math.round(stats.avgDeliveryMinutes)} min` : '—'}</strong></div>
      </div>
      <div style={{ marginTop: 18 }}>
        <KeyValue items={[['Assigned orders', num(stats.totalAssigned)], ['Cancelled', num(stats.cancelled)], ['Failed deliveries', num(stats.failedDeliveries)], ['COD collected', money(stats.cashCollected)]]} />
      </div>
      {stats.totalAssigned > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}><span className="text-2">Delivered ({num(stats.deliveries)} of {num(stats.totalAssigned)} assigned)</span><strong>{pct(successRate)}</strong></div>
          <Progress value={successRate} tone={successRate > 90 ? 'success' : 'warning'} />
        </div>
      )}
    </Card>
  );
}

function RecentDeliveries({ orders, onOpen }) {
  return (
    <Card title="Recent deliveries" className="card-flush">
      <div className="table-scroll" style={{ marginTop: 12 }}>
        <table className="table">
          <thead><tr><th>Order</th><th>Store</th><th className="hide-sm">Customer</th><th>Payment</th><th>Status</th><th className="hide-sm">When</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 28 }}>No deliveries yet</td></tr>}
            {orders.map((o) => (
              <tr key={o._id} className="is-clickable" onClick={() => onOpen(o)}>
                <td><Code>{o.orderId}</Code></td>
                <td className="cell-strong">{o.vendor?.storeName || '—'}</td>
                <td className="hide-sm">{o.customer?.name || '—'}</td>
                <td><Badge tone={o.paymentMethod === 'cod' ? 'warning' : 'neutral'}>{o.paymentMethod === 'cod' ? 'COD' : 'Card'}</Badge></td>
                <td><StatusBadge status={o.status} /></td>
                <td className="hide-sm">{timeAgo(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Rider balance from GET /admin/payouts/user/:id (see services/api/finance.js).
function SettlementCard({ balance, onDeposit }) {
  return (
    <Card title="Settlement position">
      <KeyValue columns={1} items={[
        ['Fauran owes rider', <span key="o" className="pos">{money(balance.furanOwesRider)}</span>],
        ['Rider owes Fauran', <span key="r" className={balance.riderOwesFuran ? 'neg' : ''}>{money(balance.riderOwesFuran)}</span>],
        ['COD cash in hand', <span key="c" className={balance.cashInHand ? 'neg' : ''}>{money(balance.cashInHand)}</span>],
        ['Last payout', balance.lastPayoutAt ? timeAgo(balance.lastPayoutAt) : 'Never'],
      ]} />
      <Button variant="soft" icon={CreditCard} style={{ marginTop: 16, width: '100%' }} onClick={onDeposit}>Record cash deposit</Button>
    </Card>
  );
}

// Re-open or reverse an earlier approve / reject decision.
function ChangeDecision({ status, onDecide }) {
  const [rejecting, setRejecting] = useState(false);
  const [run, pending] = useAction();
  const decide = (next, reason) => run(() => onDecide(next, reason), { success: `Marked as ${next}` }).then(() => setRejecting(false)).catch(() => {});
  return (
    <>
      <Menu
        trigger={({ toggle }) => <Button variant="secondary" icon={ShieldCheck} loading={pending && !rejecting} onClick={toggle}>Change decision</Button>}
        items={[
          status !== 'approved' && { label: 'Approve', icon: Check, onClick: () => decide('approved') },
          status !== 'rejected' && { label: 'Reject', icon: X, tone: 'danger', onClick: () => setRejecting(true) },
          { label: 'Move back to pending', icon: RotateCcw, onClick: () => decide('pending') },
        ]}
      />
      <ConfirmDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        onConfirm={(reason) => decide('rejected', reason)}
        loading={pending}
        title="Reject this rider?"
        description="The rider is blocked and signed out. They are notified with your reason."
        confirmLabel="Reject rider"
        reason
        reasonRequired
        reasonLabel="Reason for rejection"
      />
    </>
  );
}
