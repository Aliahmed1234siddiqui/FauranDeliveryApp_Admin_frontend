import { Bike, CheckCircle2, Clock, CreditCard, FileText, IdCard, Landmark, MapPin, Phone, Star, XCircle } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { adminApi } from '../services/adminApi';
import { date, money, num, pct, timeAgo } from '../lib/format';
import { Avatar, Badge, Button, Card, Code, ErrorState, KeyValue, Progress, StatusBadge } from '../ui/primitives';
import { ApprovalPanel, BackLink, BlockButton, DetailSkeleton } from './shared';

export default function RiderDetail({ params }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const { data: r, loading, error, reload, setData } = useApi(() => adminApi.getRiderById(params.id), [params.id]);

  if (loading && !r) return <DetailSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

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
              {r.approvalStatus === 'approved' && <StatusBadge status={r.currentStatus} />}
            </div>
            <p>
              <span><Code>{r.riderId}</Code></span>
              <span><Phone size={14} /> {r.phone}</span>
              <span><MapPin size={14} /> {r.zone}</span>
              <span><Clock size={14} /> Joined {date(r.createdAt)}</span>
            </p>
          </div>
          <div className="profile-actions">
            {r.isOnline && <Button variant="secondary" icon={MapPin} onClick={() => navigate(`/riders/live?rider=${r._id}`)}>Locate</Button>}
            {can('payments') && r.approvalStatus === 'approved' && <Button variant="secondary" icon={Landmark} onClick={() => navigate(`/payouts?tab=riders&ledger=${r._id}`)}>Ledger</Button>}
            <BlockButton user={r} kind="rider" onDone={(u) => setData((d) => ({ ...d, isActive: u.isActive }))} />
          </div>
        </div>
      </Card>

      {r.approvalStatus === 'pending' && (
        <ApprovalPanel
          title="New rider application"
          description="Verify the CNIC, driving licence and vehicle registration before approving. Approved riders can start accepting orders right away."
          onDecide={(status, reason) => adminApi.approveRider(r._id, status, reason).then((u) => setData((d) => ({ ...d, ...u })))}
        >
          <div className="doc-list">
            {['CNIC (front & back)', 'Driving licence', 'Vehicle registration'].map((d) => <div className="doc" key={d}><FileText size={16} /><span>{d}</span><Button size="sm" variant="ghost">Preview</Button></div>)}
          </div>
        </ApprovalPanel>
      )}
      {r.approvalStatus === 'rejected' && r.rejectionReason && <div className="callout callout-danger mb"><XCircle size={16} /><div><strong>Rejected:</strong> {r.rejectionReason}</div></div>}

      <div className="grid grid-side">
        <div className="stack">
          <Card title="Delivery performance" subtitle="Lifetime">
            <div className="mini-stats">
              <div className="mini-stat"><span>Deliveries</span><strong>{num(r.totalDeliveries)}</strong></div>
              <div className="mini-stat"><span>Rating</span><strong className="row" style={{ gap: 4 }}>{r.rating || '—'} {r.rating > 0 && <Star size={15} fill="var(--accent)" color="var(--accent)" />}</strong></div>
              <div className="mini-stat"><span>Earnings</span><strong>{money(r.balance?.earnings || 0)}</strong></div>
              <div className="mini-stat"><span>COD in hand</span><strong className={r.codInHand > 30000 ? 'neg' : ''}>{money(r.codInHand)}</strong></div>
            </div>
            {r.onTimeRate > 0 && (
              <div style={{ marginTop: 18 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}><span className="text-2">On-time rate</span><strong>{pct(r.onTimeRate)}</strong></div>
                <Progress value={r.onTimeRate} tone={r.onTimeRate > 95 ? 'success' : 'warning'} />
              </div>
            )}
          </Card>
          <Card title="Recent deliveries" className="card-flush">
            <div className="table-scroll" style={{ marginTop: 12 }}>
              <table className="table">
                <thead><tr><th>Order</th><th>Store</th><th>Payment</th><th>Status</th><th className="hide-sm">When</th></tr></thead>
                <tbody>
                  {r.recentOrders.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 28 }}>No deliveries yet</td></tr>}
                  {r.recentOrders.map((o) => (
                    <tr key={o._id} className="is-clickable" onClick={() => navigate(`/orders/${o.orderId}`)}>
                      <td><Code>{o.orderId}</Code></td>
                      <td className="cell-strong">{o.vendor.storeName}</td>
                      <td><Badge tone={o.paymentMethod === 'cod' ? 'warning' : 'neutral'}>{o.paymentMethod.toUpperCase()}</Badge></td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="hide-sm">{timeAgo(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="stack">
          <Card title="Rider details">
            <KeyValue columns={1} items={[
              ['Email', r.email],
              ['CNIC', <span key="c" className="row" style={{ gap: 6 }}><IdCard size={14} className="muted" /><Code>{r.cnic}</Code></span>],
              ['Vehicle', <span key="v" className="row" style={{ gap: 6 }}><Bike size={14} className="muted" />{r.vehicleType} · {r.vehicleNumber}</span>],
              ['Home zone', r.zone],
              ['Last location ping', r.isOnline ? `${r.location.lastPingSec}s ago` : 'Offline'],
            ]} />
          </Card>
          {r.balance && (
            <Card title="Settlement position">
              <KeyValue columns={1} items={[
                ['Earnings owed to rider', <span key="o" className="pos">{money(r.balance.balance)}</span>],
                ['COD cash to collect', <span key="c" className={r.balance.codHeld ? 'neg' : ''}>{money(r.balance.codHeld)}</span>],
                ['Last cash deposit', r.balance.lastDepositAt ? timeAgo(r.balance.lastDepositAt) : 'Never'],
              ]} />
              {can('payments') && <Button variant="soft" icon={CreditCard} style={{ marginTop: 16, width: '100%' }} onClick={() => navigate(`/payouts?tab=riders&deposit=${r._id}`)}>Record cash deposit</Button>}
            </Card>
          )}
          {r.approvalStatus === 'approved' && <div className="callout"><CheckCircle2 size={16} className="pos" /><div><strong>Background verified.</strong> Documents were checked when this rider was approved.</div></div>}
        </div>
      </div>
    </>
  );
}
