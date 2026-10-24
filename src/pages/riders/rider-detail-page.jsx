import { Bike, CheckCircle2, Clock, IdCard, Landmark, MapPin, Phone } from 'lucide-react';

import { ApprovalPanel, BackLink, BlockButton, DetailSkeleton, DocumentList } from '@/components/common';
import { ChangeDecision } from '@/components/common';
import { Avatar, Button, Card, Code, ErrorState, KeyValue, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context';
import { useApi } from '@/hooks';
import { paths, useRouter } from '@/router';
import { payoutsApi, ridersApi } from '@/services/api';
import { date, titleCase, toLatLng } from '@/utils/format';

import { PerformanceCard } from './components/rider-performance-card';
import { RecentDeliveries } from './components/rider-recent-deliveries';
import { SettlementCard } from './components/rider-settlement-card';
import { riderNowStatus } from './rider-utils';

const REJECT_COPY = {
  title: 'Reject this rider?',
  description: 'The rider is blocked and signed out. They are notified with your reason.',
  confirmLabel: 'Reject rider',
};

export default function RiderDetail({ params }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const { data, loading, error, reload, setData } = useApi(() => ridersApi.get(params.id), [params.id], {
    key: 'rider',
  });
  // Earnings vs. COD position comes from the payouts ledger (payments permission only).
  const ledger = useApi(
    () => (can('payments') ? payoutsApi.ledger(params.id) : Promise.resolve(null)),
    [params.id],
    { key: 'rider-ledger' },
  );

  if (loading && !data) return <DetailSkeleton />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;

  const { rider: r, stats, recentOrders } = data;
  // setApproval and the block switch both resolve the updated rider.
  const mergeRider = (u) => setData((d) => ({ ...d, rider: { ...d.rider, ...u } }));
  const decide = (status, reason) => ridersApi.setApproval(r._id, status, reason).then(mergeRider);
  const location = toLatLng(r.currentLocation);

  return (
    <>
      <BackLink to={paths.riders()}>All riders</BackLink>
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
              <span>
                <Code>{r.riderId}</Code>
              </span>
              <span>
                <Phone size={14} /> {r.phone}
              </span>
              <span>
                <Bike size={14} /> {titleCase(r.vehicleType || '—')} · {r.vehicleNumber || '—'}
              </span>
              <span>
                <Clock size={14} /> Joined {date(r.createdAt)}
              </span>
            </p>
          </div>
          <div className="profile-actions">
            {r.isOnline && location && (
              <Button
                variant="secondary"
                icon={MapPin}
                onClick={() => navigate(paths.liveRiders({ rider: r._id }))}
              >
                Locate
              </Button>
            )}
            {can('payments') && r.approvalStatus === 'approved' && (
              <Button
                variant="secondary"
                icon={Landmark}
                onClick={() => navigate(paths.payouts({ tab: 'riders', ledger: r._id }))}
              >
                Ledger
              </Button>
            )}
            {r.approvalStatus !== 'pending' && (
              <ChangeDecision status={r.approvalStatus} onDecide={decide} rejectCopy={REJECT_COPY} />
            )}
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
          <RecentDeliveries orders={recentOrders} onOpen={(o) => navigate(paths.order(o.orderId))} />
        </div>
        <div className="stack">
          <Card title="Rider details">
            <KeyValue
              columns={1}
              items={[
                ['Email', r.email],
                [
                  'CNIC',
                  r.cnic && (
                    <span key="c" className="row" style={{ gap: 6 }}>
                      <IdCard size={14} className="muted" />
                      <Code>{r.cnic}</Code>
                    </span>
                  ),
                ],
                ['Driving licence', r.licenseNumber && <Code key="l">{r.licenseNumber}</Code>],
                [
                  'Vehicle',
                  <span key="v" className="row" style={{ gap: 6 }}>
                    <Bike size={14} className="muted" />
                    {titleCase(r.vehicleType || '—')} · {r.vehicleNumber || '—'}
                  </span>,
                ],
                [
                  'Last known location',
                  location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Never shared',
                ],
              ]}
            />
          </Card>
          <Card title="Payout account">
            {r.payoutDetails?.accountNumber ? (
              <KeyValue
                columns={1}
                items={[
                  ['Method', titleCase(r.payoutDetails.method || '—')],
                  ['Account title', r.payoutDetails.accountTitle],
                  ['Account number', <Code key="a">{r.payoutDetails.accountNumber}</Code>],
                ]}
              />
            ) : (
              <p className="muted">No payout account added yet.</p>
            )}
          </Card>
          {ledger.data?.balance && (
            <SettlementCard
              balance={ledger.data.balance}
              onDeposit={() => navigate(paths.payouts({ tab: 'riders', deposit: r.riderId }))}
            />
          )}
          {r.approvalStatus !== 'pending' && (
            <Card title="Documents">
              <DocumentList documents={r.documents} />
            </Card>
          )}
          {r.approvalStatus === 'approved' && (
            <div className="callout">
              <CheckCircle2 size={16} className="pos" />
              <div>
                <strong>Documents reviewed.</strong> They were checked when this rider was approved.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
