import { Clock, Landmark, Mail, MapPin, Package, Phone } from 'lucide-react';

import { ApprovalPanel, BackLink, BlockButton, DetailSkeleton, DocumentList } from '@/components/common';
import { ChangeDecision } from '@/components/common';
import { Avatar, Badge, Button, Card, Code, ErrorState, KeyValue, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context';
import { useApi } from '@/hooks';
import { paths, useRouter } from '@/router';
import { vendorsApi } from '@/services/api';
import { date, num } from '@/utils/format';

import { PerformanceCard } from './components/vendor-performance-card';
import { ProductsCard } from './components/vendor-products-card';
import { RecentOrders } from './components/vendor-recent-orders';

const REJECT_COPY = {
  title: 'Reject this store?',
  description: 'The store is blocked and signed out. The vendor is notified with your reason.',
  confirmLabel: 'Reject store',
};

export default function VendorDetail({ params }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const { data, loading, error, reload, setData } = useApi(() => vendorsApi.get(params.id), [params.id], {
    key: 'vendor',
  });

  if (loading && !data) return <DetailSkeleton />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { vendor: v, stats, products, recentOrders } = data;
  // setApproval and the block switch both resolve the updated vendor.
  const mergeVendor = (u) => setData((d) => ({ ...d, vendor: { ...d.vendor, ...u } }));
  const decide = (status, reason) => vendorsApi.setApproval(v._id, status, reason).then(mergeVendor);

  return (
    <>
      <BackLink to={paths.vendors()}>All vendors</BackLink>

      <Card className="mb">
        <div className="profile-card">
          <Avatar name={v.storeName} src={v.storeLogo} size="lg" square />
          <div>
            <div className="row row-wrap">
              <h2>{v.storeName}</h2>
              <StatusBadge status={v.approvalStatus} />
              {!v.isActive && <StatusBadge status="blocked" />}
              {v.approvalStatus === 'approved' && (
                <Badge tone={v.isOpen ? 'success' : 'neutral'}>{v.isOpen ? 'Open now' : 'Closed'}</Badge>
              )}
            </div>
            <p>
              <span>
                <Code>{v.vendorId}</Code>
              </span>
              {v.storeAddress?.address && (
                <span>
                  <MapPin size={14} /> {v.storeAddress.address}
                </span>
              )}
              <span>
                <Phone size={14} /> {v.phone}
              </span>
              <span>
                <Clock size={14} /> Joined {date(v.createdAt)}
              </span>
            </p>
          </div>
          <div className="profile-actions">
            {can('products') && (
              <Button
                variant="secondary"
                icon={Package}
                onClick={() => navigate(paths.products({ vendorId: v._id }))}
              >
                Products
              </Button>
            )}
            {can('payments') && v.approvalStatus === 'approved' && (
              <Button
                variant="secondary"
                icon={Landmark}
                onClick={() => navigate(paths.payouts({ tab: 'vendors', ledger: v._id }))}
              >
                Ledger
              </Button>
            )}
            {v.approvalStatus !== 'pending' && (
              <ChangeDecision status={v.approvalStatus} onDecide={decide} rejectCopy={REJECT_COPY} />
            )}
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
          <RecentOrders
            orders={recentOrders}
            onOpen={(o) => navigate(paths.order(o.orderId))}
            onAll={() => navigate(paths.orders({ vendorId: v._id }))}
          />
          <ProductsCard
            products={products}
            total={stats.productCount}
            onOpen={(p) => navigate(paths.products({ search: p.productId }))}
            onAll={() => navigate(paths.products({ vendorId: v._id }))}
          />
        </div>

        <div className="stack">
          <Card title="Store details">
            <KeyValue
              columns={1}
              items={[
                ['Owner', v.name],
                [
                  'Email',
                  v.email && (
                    <span key="e" className="row" style={{ gap: 6 }}>
                      <Mail size={14} className="muted" />
                      {v.email}
                    </span>
                  ),
                ],
                ['Address', v.storeAddress?.address],
                [
                  'Opening hours',
                  v.openingTime && v.closingTime ? `${v.openingTime} – ${v.closingTime}` : null,
                ],
                ['Catalog size', `${num(stats.productCount)} products`],
              ]}
            />
          </Card>
          <Card title="Documents">
            <DocumentList documents={v.documents} />
          </Card>
          <Card title="Payout account">
            {v.bankDetails?.accountNumber ? (
              <KeyValue
                columns={1}
                items={[
                  ['Account title', v.bankDetails.accountTitle],
                  ['Bank', v.bankDetails.bankName],
                  ['Account number', <Code key="a">{v.bankDetails.accountNumber}</Code>],
                ]}
              />
            ) : (
              <p className="muted">No bank details added yet.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
