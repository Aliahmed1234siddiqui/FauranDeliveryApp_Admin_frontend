import { CheckCircle2, Clock, FileText, Landmark, Mail, MapPin, Package, Phone, Star, XCircle } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { adminApi } from '../services/adminApi';
import { compactMoney, date, money, num, pct, timeAgo } from '../lib/format';
import { Avatar, Badge, Button, Card, Code, ErrorState, KeyValue, Progress, StatusBadge } from '../ui/primitives';
import { ApprovalPanel, BackLink, BlockButton, DetailSkeleton } from './shared';

export default function VendorDetail({ params }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const { data: v, loading, error, reload, setData } = useApi(() => adminApi.getVendorById(params.id), [params.id]);

  if (loading && !v) return <DetailSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <BackLink to="/vendors">All vendors</BackLink>

      <Card className="mb">
        <div className="profile-card">
          <Avatar name={v.storeName} size="lg" square />
          <div>
            <div className="row row-wrap">
              <h2>{v.storeName}</h2>
              <StatusBadge status={v.approvalStatus} />
              {!v.isActive && <StatusBadge status="blocked" />}
              <Badge tone={v.storeType === 'dark_store' ? 'brand' : 'info'}>{v.storeType === 'dark_store' ? 'Dark store' : 'Partner kiryana'}</Badge>
            </div>
            <p>
              <span><Code>{v.vendorId}</Code></span>
              <span><MapPin size={14} /> {v.area}, {v.city}</span>
              <span><Phone size={14} /> {v.phone}</span>
              <span><Clock size={14} /> Joined {date(v.createdAt)}</span>
            </p>
          </div>
          <div className="profile-actions">
            {can('products') && <Button variant="secondary" icon={Package} onClick={() => navigate(`/products?vendorId=${v._id}`)}>Products</Button>}
            {can('payments') && v.balance && <Button variant="secondary" icon={Landmark} onClick={() => navigate(`/payouts?tab=vendors&ledger=${v._id}`)}>Ledger</Button>}
            <BlockButton user={v} kind="vendor" onDone={(u) => setData((d) => ({ ...d, isActive: u.isActive }))} />
          </div>
        </div>
      </Card>

      {v.approvalStatus === 'pending' && (
        <ApprovalPanel
          title="This store is waiting for approval"
          description="Check the documents and store details. Approving makes the store visible to customers in its delivery radius."
          onDecide={(status, reason) => adminApi.approveVendor(v._id, status, reason).then((u) => setData((d) => ({ ...d, ...u })))}
        />
      )}
      {v.approvalStatus === 'rejected' && v.rejectionReason && (
        <div className="callout callout-danger mb"><XCircle size={16} /><div><strong>Rejected:</strong> {v.rejectionReason}</div></div>
      )}

      <div className="grid grid-side">
        <div className="stack">
          <Card title="Performance" subtitle="Lifetime">
            <div className="mini-stats">
              <div className="mini-stat"><span>Orders</span><strong>{num(v.totalOrders)}</strong></div>
              <div className="mini-stat"><span>Gross sales</span><strong>{compactMoney(v.grossSales)}</strong></div>
              <div className="mini-stat"><span>Rating</span><strong className="row" style={{ gap: 4 }}>{v.rating || '—'} {v.rating > 0 && <Star size={15} fill="var(--accent)" color="var(--accent)" />}</strong></div>
              <div className="mini-stat"><span>Avg. prep time</span><strong>{v.avgPrepMinutes ? `${v.avgPrepMinutes} min` : '—'}</strong></div>
            </div>
            {v.fulfilmentRate > 0 && (
              <div style={{ marginTop: 18 }}>
                <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                  <span className="text-2">Fulfilment rate</span><strong>{pct(v.fulfilmentRate)}</strong>
                </div>
                <Progress value={v.fulfilmentRate} tone={v.fulfilmentRate > 95 ? 'success' : 'warning'} />
              </div>
            )}
          </Card>

          <Card title="Recent orders" padded className="card-flush" action={<Button variant="ghost" size="sm" onClick={() => navigate(`/orders?vendorId=${v._id}`)}>View all</Button>}>
            <div className="table-scroll" style={{ marginTop: 12 }}>
              <table className="table">
                <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th className="hide-sm">Placed</th></tr></thead>
                <tbody>
                  {v.recentOrders.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 28 }}>No orders yet</td></tr>}
                  {v.recentOrders.map((o) => (
                    <tr key={o._id} className="is-clickable" onClick={() => navigate(`/orders/${o.orderId}`)}>
                      <td><Code>{o.orderId}</Code></td>
                      <td className="cell-strong">{o.customer.name}</td>
                      <td>{money(o.total)}</td>
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
          <Card title="Store details">
            <KeyValue columns={1} items={[
              ['Owner', v.ownerName],
              ['Email', <span key="e" className="row" style={{ gap: 6 }}><Mail size={14} className="muted" />{v.email}</span>],
              ['Address', v.address],
              ['Catalog size', `${num(v.productsCount)} products`],
              ['Commission', v.commissionPercent ? `${v.commissionPercent}% per order` : 'Not charged (dark store)'],
            ]} />
          </Card>
          <Card title="Documents">
            <div className="doc-list">
              {v.documents.map((d) => (
                <div key={d.name} className="doc">
                  <FileText size={16} />
                  <span>{d.name}</span>
                  {d.verified ? <Badge tone="success" icon={CheckCircle2}>Verified</Badge> : <Badge tone="warning">Unverified</Badge>}
                </div>
              ))}
            </div>
          </Card>
          <Card title="Payout account">
            <KeyValue columns={1} items={[['Account title', v.bank.title], ['Bank', v.bank.bankName], ['IBAN', <Code key="i">{v.bank.iban}</Code>], v.balance && ['Outstanding balance', money(v.balance.balance)]]} />
          </Card>
        </div>
      </div>
    </>
  );
}
