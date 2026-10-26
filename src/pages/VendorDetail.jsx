import { useState } from 'react';
import { Check, Clock, Landmark, Mail, MapPin, Package, Phone, RotateCcw, ShieldCheck, Star, X } from 'lucide-react';
import { useAction, useApi } from '../lib/hooks';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { vendorsApi } from '../services/api';
import { compactMoney, date, money, num, pct, timeAgo } from '../lib/format';
import { Avatar, Badge, Button, Card, Code, ErrorState, KeyValue, Progress, StatusBadge } from '../ui/primitives';
import { ConfirmDialog, Menu } from '../ui/overlays';
import { statusLabel } from '../ui/status';
import { ApprovalPanel, BackLink, BlockButton, DetailSkeleton, DocumentList } from './shared';

export default function VendorDetail({ params }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const { data, loading, error, reload, setData } = useApi(() => vendorsApi.get(params.id), [params.id], { key: 'vendor' });

  if (loading && !data) return <DetailSkeleton />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { vendor: v, stats, products, recentOrders } = data;
  // setApproval and the block switch both resolve the updated vendor.
  const mergeVendor = (u) => setData((d) => ({ ...d, vendor: { ...d.vendor, ...u } }));
  const decide = (status, reason) => vendorsApi.setApproval(v._id, status, reason).then(mergeVendor);

  return (
    <>
      <BackLink to="/vendors">All vendors</BackLink>

      <Card className="mb">
        <div className="profile-card">
          <Avatar name={v.storeName} src={v.storeLogo} size="lg" square />
          <div>
            <div className="row row-wrap">
              <h2>{v.storeName}</h2>
              <StatusBadge status={v.approvalStatus} />
              {!v.isActive && <StatusBadge status="blocked" />}
              {v.approvalStatus === 'approved' && <Badge tone={v.isOpen ? 'success' : 'neutral'}>{v.isOpen ? 'Open now' : 'Closed'}</Badge>}
            </div>
            <p>
              <span><Code>{v.vendorId}</Code></span>
              {v.storeAddress?.address && <span><MapPin size={14} /> {v.storeAddress.address}</span>}
              <span><Phone size={14} /> {v.phone}</span>
              <span><Clock size={14} /> Joined {date(v.createdAt)}</span>
            </p>
          </div>
          <div className="profile-actions">
            {can('products') && <Button variant="secondary" icon={Package} onClick={() => navigate(`/products?vendorId=${v._id}`)}>Products</Button>}
            {can('payments') && v.approvalStatus === 'approved' && <Button variant="secondary" icon={Landmark} onClick={() => navigate(`/payouts?tab=vendors&ledger=${v._id}`)}>Ledger</Button>}
            {v.approvalStatus !== 'pending' && <ChangeDecision status={v.approvalStatus} onDecide={decide} />}
            <BlockButton user={v} kind="vendor" onDone={mergeVendor} />
          </div>
        </div>
      </Card>

      {v.approvalStatus === 'pending' && (
        <ApprovalPanel
          title="This store is waiting for approval"
          description="Check the documents and store details. Approving makes the store visible to customers in its delivery radius."
          onDecide={decide}
        />
      )}

      <div className="grid grid-side">
        <div className="stack">
          <PerformanceCard stats={stats} rating={v.rating} totalRatings={v.totalRatings} />
          <RecentOrders orders={recentOrders} onOpen={(o) => navigate(`/orders/${o.orderId}`)} onAll={() => navigate(`/orders?vendorId=${v._id}`)} />
          <ProductsCard products={products} total={stats.productCount} onOpen={(p) => navigate(`/products?search=${p.productId}`)} onAll={() => navigate(`/products?vendorId=${v._id}`)} />
        </div>

        <div className="stack">
          <Card title="Store details">
            <KeyValue columns={1} items={[
              ['Owner', v.name],
              ['Email', v.email && <span key="e" className="row" style={{ gap: 6 }}><Mail size={14} className="muted" />{v.email}</span>],
              ['Address', v.storeAddress?.address],
              ['Opening hours', v.openingTime && v.closingTime ? `${v.openingTime} – ${v.closingTime}` : null],
              ['Catalog size', `${num(stats.productCount)} products`],
            ]} />
          </Card>
          <Card title="Documents">
            <DocumentList documents={v.documents} />
          </Card>
          <Card title="Payout account">
            {v.bankDetails?.accountNumber ? (
              <KeyValue columns={1} items={[
                ['Account title', v.bankDetails.accountTitle],
                ['Bank', v.bankDetails.bankName],
                ['Account number', <Code key="a">{v.bankDetails.accountNumber}</Code>],
              ]} />
            ) : <p className="muted">No bank details added yet.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}

function PerformanceCard({ stats, rating, totalRatings }) {
  const deliveredShare = stats.totalOrders ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0;
  const byStatus = Object.entries(stats.ordersByStatus || {}).filter(([, n]) => n > 0);
  return (
    <Card title="Performance" subtitle="Lifetime">
      <div className="mini-stats">
        <div className="mini-stat"><span>Orders</span><strong>{num(stats.totalOrders)}</strong></div>
        <div className="mini-stat"><span>Gross sales</span><strong>{compactMoney(stats.totalSales)}</strong></div>
        <div className="mini-stat"><span>Rating</span><strong className="row" style={{ gap: 4 }}>{totalRatings ? rating : '—'} {totalRatings > 0 && <Star size={15} fill="var(--accent)" color="var(--accent)" />}</strong></div>
        <div className="mini-stat"><span>Cancelled</span><strong>{num(stats.cancelledOrders)}</strong></div>
      </div>
      <div style={{ marginTop: 18 }}>
        <KeyValue items={[['Commission from vendor', money(stats.platformCommission)], ['Vendor payout', money(stats.vendorPayout)]]} />
      </div>
      {stats.totalOrders > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span className="text-2">Delivered ({num(stats.deliveredOrders)} of {num(stats.totalOrders)})</span><strong>{pct(deliveredShare)}</strong>
          </div>
          <Progress value={deliveredShare} tone={deliveredShare > 90 ? 'success' : 'warning'} />
        </div>
      )}
      {byStatus.length > 0 && (
        <div className="row row-wrap" style={{ marginTop: 16, gap: 6 }}>
          {byStatus.map(([status, n]) => <StatusBadge key={status} status={status} label={`${statusLabel(status)} · ${num(n)}`} />)}
        </div>
      )}
    </Card>
  );
}

function RecentOrders({ orders, onOpen, onAll }) {
  return (
    <Card title="Recent orders" padded className="card-flush" action={<Button variant="ghost" size="sm" onClick={onAll}>View all</Button>}>
      <div className="table-scroll" style={{ marginTop: 12 }}>
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th className="hide-sm">Placed</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 28 }}>No orders yet</td></tr>}
            {orders.map((o) => (
              <tr key={o._id} className="is-clickable" onClick={() => onOpen(o)}>
                <td><Code>{o.orderId}</Code></td>
                <td className="cell-strong">{o.customer?.name || '—'}</td>
                <td>{money(o.totalAmount)}</td>
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

const productStatus = (p) => (!p.isApproved ? 'pending' : p.isActive ? 'active' : 'inactive');

function ProductsCard({ products, total, onOpen, onAll }) {
  return (
    <Card title="Products" subtitle={`${num(total)} listed`} padded className="card-flush" action={<Button variant="ghost" size="sm" onClick={onAll}>View all</Button>}>
      <div className="table-scroll" style={{ marginTop: 12 }}>
        <table className="table">
          <thead><tr><th>Product</th><th>Price</th><th className="hide-sm">Stock</th><th>Status</th></tr></thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 28 }}>No products yet</td></tr>}
            {products.map((p) => (
              <tr key={p._id} className="is-clickable" onClick={() => onOpen(p)}>
                <td><span className="cell-strong">{p.name}</span><span className="cell-sub">{p.productId}</span></td>
                <td>{p.discountPrice ? <>{money(p.discountPrice)} <s className="muted">{money(p.price)}</s></> : money(p.price)}</td>
                <td className="hide-sm">{num(p.stock)} {p.unit}</td>
                <td><StatusBadge status={productStatus(p)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        title="Reject this store?"
        description="The store is blocked and signed out. The vendor is notified with your reason."
        confirmLabel="Reject store"
        reason
        reasonRequired
        reasonLabel="Reason for rejection"
      />
    </>
  );
}
