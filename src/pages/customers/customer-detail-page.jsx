import { useState } from 'react';
import { Ban, Clock, Mail, MapPin, Phone } from 'lucide-react';

import { BackLink, DetailSkeleton } from '@/components/common';
import { ConfirmDialog } from '@/components/overlays';
import {
  Avatar,
  Badge,
  Card,
  Code,
  EmptyState,
  ErrorState,
  KeyValue,
  StatusBadge,
  Toggle,
} from '@/components/ui';
import { useAction, useApi } from '@/hooks';
import { paths } from '@/router';
import { customersApi } from '@/services/api';
import { date, money, num, timeAgo } from '@/utils/format';

import { OrderHistory } from './components/customer-order-history';

export default function CustomerDetail({ params }) {
  // Old links built from a missing customerId end up as /customers/undefined.
  const id = params.id && params.id !== 'undefined' && params.id !== 'null' ? params.id : null;
  const { data, loading, error, reload } = useApi(() => customersApi.get(id), [id], {
    key: 'customer',
    enabled: !!id,
  });
  const [run, pending] = useAction();
  const [blocking, setBlocking] = useState(false);

  if (!id)
    return (
      <>
        <BackLink to={paths.customers()}>All customers</BackLink>
        <EmptyState title="Customer not found" />
      </>
    );
  if (loading && !data) return <DetailSkeleton />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  // The backend may omit sections (or send the customer unwrapped), so default everything.
  const c = data?.customer || data || {};
  const stats = {
    totalOrders: c.totalOrders,
    totalSpent: c.totalSpent,
    lastOrderAt: c.lastOrderAt,
    deliveredOrders: 0,
    cancelledOrders: 0,
    ...(data?.stats || {}),
  };
  const addresses = Array.isArray(data?.addresses)
    ? data.addresses
    : Array.isArray(c.addresses)
      ? c.addresses
      : [];
  const orders = Array.isArray(data?.orders)
    ? data.orders
    : Array.isArray(data?.recentOrders)
      ? data.recentOrders
      : [];

  const setActive = (isActive, reason) =>
    run(() => customersApi.setActive(c._id, isActive, reason || undefined), {
      success: isActive ? 'Account unblocked' : 'Account blocked',
    })
      .then(() => {
        setBlocking(false);
        reload();
      })
      .catch(() => {});
  const setCodAllowed = (allowed) =>
    run(() => customersApi.setCodBlocked(c._id, !allowed), {
      success: allowed ? 'Cash on delivery re-allowed' : 'Customer can now only pay by card',
    })
      .then(reload)
      .catch(() => {});

  const aov = stats.totalOrders ? stats.totalSpent / stats.totalOrders : 0;
  const cancelRate = stats.totalOrders ? (stats.cancelledOrders / stats.totalOrders) * 100 : 0;

  return (
    <>
      <BackLink to={paths.customers()}>All customers</BackLink>
      <Card className="mb">
        <div className="profile-card">
          <Avatar name={c.name} size="lg" />
          <div>
            <div className="row row-wrap">
              <h2>{c.name}</h2>
              <StatusBadge status={c.isActive ? 'active' : 'blocked'} />
              {c.isVerified && <Badge tone="info">Verified</Badge>}
              {c.codBlocked && <Badge tone="warning">Card only</Badge>}
            </div>
            <p>
              <span>
                <Code>{c.customerId}</Code>
              </span>
              <span>
                <Phone size={14} /> {c.phone}
              </span>
              {c.email && (
                <span>
                  <Mail size={14} /> {c.email}
                </span>
              )}
              <span>
                <Clock size={14} /> Customer since {date(c.createdAt)}
              </span>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-side">
        <div className="stack">
          <div className="mini-stats">
            <div className="mini-stat">
              <span>Orders</span>
              <strong>{num(stats.totalOrders)}</strong>
            </div>
            <div className="mini-stat">
              <span>Lifetime spend</span>
              <strong>{money(stats.totalSpent)}</strong>
            </div>
            <div className="mini-stat">
              <span>Avg. basket</span>
              <strong>{money(aov)}</strong>
            </div>
            <div className="mini-stat">
              <span>Cancellation rate</span>
              <strong className={cancelRate > 15 ? 'neg' : ''}>{cancelRate.toFixed(0)}%</strong>
            </div>
          </div>
          <OrderHistory orders={orders} customerId={c._id} />
        </div>
        <div className="stack">
          <Card title="Account controls" subtitle="Changes take effect immediately in the customer app">
            <div className="stack" style={{ gap: 18 }}>
              <Toggle
                label="Account active"
                description={
                  c.isActive ? 'Customer can browse and order.' : 'Customer is signed out and blocked.'
                }
                checked={c.isActive}
                disabled={pending}
                onChange={(v) => (v ? setActive(true) : setBlocking(true))}
              />
              <hr />
              <Toggle
                label="Allow cash on delivery"
                description={
                  c.codBlocked
                    ? `Card only after ${num(c.failedCodDeliveries)} failed COD deliver${c.failedCodDeliveries === 1 ? 'y' : 'ies'}. Re-allowing resets the count.`
                    : 'Turn off to require card payment.'
                }
                checked={!c.codBlocked}
                disabled={pending}
                onChange={setCodAllowed}
              />
            </div>
          </Card>
          <Card title="Saved addresses">
            {addresses.length ? (
              <div className="list">
                {addresses.map((a, i) => (
                  <div key={a.addressId || a._id || i} className="list-item">
                    <span className="identity-icon">
                      <MapPin size={16} />
                    </span>
                    <span className="text-2">
                      {a.label && <strong>{a.label} </strong>}
                      {[a.addressLine, a.city].filter(Boolean).join(', ')}
                      {a.isDefault && (
                        <>
                          {' '}
                          <Badge tone="brand">Default</Badge>
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={MapPin} title="No saved addresses" />
            )}
          </Card>
          <Card title="Details">
            <KeyValue
              columns={1}
              items={[
                ['Last order', timeAgo(stats.lastOrderAt)],
                ['Delivered orders', num(stats.deliveredOrders)],
                ['Cancelled orders', num(stats.cancelledOrders)],
                ['Failed COD deliveries', num(c.failedCodDeliveries)],
              ]}
            />
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={blocking}
        onClose={() => setBlocking(false)}
        onConfirm={(reason) => setActive(false, reason)}
        loading={pending}
        icon={Ban}
        title={`Block ${c.name}?`}
        description="They'll be signed out of the customer app and can't place orders until you unblock the account. The reason is sent in their notification."
        confirmLabel="Block account"
        reason
        reasonLabel="Reason (optional)"
        reasonPlaceholder="e.g. Repeated failed cash deliveries"
      />
    </>
  );
}
