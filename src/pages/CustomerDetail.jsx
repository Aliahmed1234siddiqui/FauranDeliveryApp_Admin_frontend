import { useState } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useAction, useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { adminApi } from '../services/adminApi';
import { date, money, num, timeAgo } from '../lib/format';
import { Avatar, Badge, Card, Code, ErrorState, KeyValue, StatusBadge, Toggle } from '../ui/primitives';
import { ConfirmDialog } from '../ui/overlays';
import { BackLink, DetailSkeleton } from './shared';

export default function CustomerDetail({ params }) {
  const { navigate } = useRouter();
  const { data: c, loading, error, reload, setData } = useApi(() => adminApi.getCustomerById(params.id), [params.id]);
  const [run, pending] = useAction();
  const [confirm, setConfirm] = useState(null);

  if (loading && !c) return <DetailSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const setStatus = (isActive) => run(() => adminApi.setCustomerStatus(c._id, isActive), { success: isActive ? 'Account reactivated' : 'Account suspended' })
    .then((u) => { setData((d) => ({ ...d, isActive: u.isActive })); setConfirm(null); }).catch(() => {});
  const setCod = (codEnabled) => run(() => adminApi.setCustomerCod(c._id, codEnabled), { success: codEnabled ? 'Cash on delivery enabled' : 'Cash on delivery disabled' })
    .then((u) => setData((d) => ({ ...d, codEnabled: u.codEnabled }))).catch(() => {});

  const aov = c.totalOrders ? c.totalSpent / c.totalOrders : 0;
  const cancelRate = c.totalOrders ? (c.cancelledOrders / c.totalOrders) * 100 : 0;

  return (
    <>
      <BackLink to="/customers">All customers</BackLink>
      <Card className="mb">
        <div className="profile-card">
          <Avatar name={c.name} size="lg" />
          <div>
            <div className="row row-wrap"><h2>{c.name}</h2><StatusBadge status={c.isActive ? 'active' : 'blocked'} />{!c.codEnabled && <Badge tone="warning">COD off</Badge>}</div>
            <p>
              <span><Code>{c.customerId}</Code></span>
              <span><Phone size={14} /> {c.phone}</span>
              <span><Mail size={14} /> {c.email}</span>
              <span><Clock size={14} /> Customer since {date(c.createdAt)}</span>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-side">
        <div className="stack">
          <div className="mini-stats">
            <div className="mini-stat"><span>Orders</span><strong>{num(c.totalOrders)}</strong></div>
            <div className="mini-stat"><span>Lifetime spend</span><strong>{money(c.totalSpent)}</strong></div>
            <div className="mini-stat"><span>Avg. basket</span><strong>{money(aov)}</strong></div>
            <div className="mini-stat"><span>Cancellation rate</span><strong className={cancelRate > 15 ? 'neg' : ''}>{cancelRate.toFixed(0)}%</strong></div>
          </div>
          <Card title="Order history" className="card-flush">
            <div className="table-scroll" style={{ marginTop: 12 }}>
              <table className="table">
                <thead><tr><th>Order</th><th>Store</th><th>Total</th><th>Status</th><th className="hide-sm">Placed</th></tr></thead>
                <tbody>
                  {c.recentOrders.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 28 }}>No orders yet</td></tr>}
                  {c.recentOrders.map((o) => (
                    <tr key={o._id} className="is-clickable" onClick={() => navigate(`/orders/${o.orderId}`)}>
                      <td><Code>{o.orderId}</Code></td>
                      <td className="cell-strong">{o.vendor.storeName}</td>
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
          <Card title="Account controls" subtitle="Changes take effect immediately in the customer app">
            <div className="stack" style={{ gap: 18 }}>
              <Toggle label="Account active" description={c.isActive ? 'Customer can browse and order.' : 'Customer is signed out and blocked.'} checked={c.isActive} disabled={pending} onChange={(v) => (v ? setStatus(true) : setConfirm('suspend'))} />
              <hr />
              <Toggle label="Allow cash on delivery" description={cancelRate > 15 ? 'High cancellation rate - consider disabling COD.' : 'Turn off to require card or wallet payment.'} checked={c.codEnabled} disabled={pending} onChange={setCod} />
            </div>
          </Card>
          <Card title="Saved addresses">
            <div className="list">
              {c.addresses.map((a) => <div key={a} className="list-item"><span className="identity-icon"><MapPin size={16} /></span><span className="text-2">{a}</span></div>)}
            </div>
          </Card>
          <Card title="Details">
            <KeyValue columns={1} items={[['Last order', timeAgo(c.lastOrderAt)], ['Cancelled orders', num(c.cancelledOrders)]]} />
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'suspend'}
        onClose={() => setConfirm(null)}
        onConfirm={() => setStatus(false)}
        loading={pending}
        title={`Suspend ${c.name}?`}
        description="They'll be signed out of the customer app and can't place orders until you reactivate the account."
        confirmLabel="Suspend account"
      />
    </>
  );
}
