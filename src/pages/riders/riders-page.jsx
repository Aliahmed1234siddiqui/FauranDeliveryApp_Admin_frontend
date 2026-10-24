import { Ban, Bike, Eye, MapPinned, Star, UserCheck, Wallet } from 'lucide-react';

import { DataTable, Pagination } from '@/components/data-table';
import {
  Button,
  Card,
  IconButton,
  Identity,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import { useAuth } from '@/context';
import { useApi, useList } from '@/hooks';
import { paths, useRouter } from '@/router';
import { payoutsApi, ridersApi } from '@/services/api';
import { compactMoney, money, num, titleCase } from '@/utils/format';

import { riderNowStatus } from './rider-utils';

const FILTERS = ['status', 'isOnline'];

// Header counts come from list totals (limit 1), not from loading every rider.
const countOf = (params) => ridersApi.list({ ...params, limit: 1 }).then((r) => r.total);
const loadCounts = () =>
  Promise.all([
    countOf({}),
    countOf({ status: 'pending' }),
    countOf({ status: 'approved', isActive: true }),
    countOf({ status: 'approved', isActive: true, isOnline: true }),
    countOf({ isActive: false }),
  ]).then(([all, pending, approved, online, blocked]) => ({ all, pending, approved, online, blocked }));

export default function Riders() {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const list = useList(ridersApi.list, FILTERS, { limit: 8 });
  const counts = useApi(loadCounts, [], { key: 'rider-counts' }).data;
  // COD still held by riders lives in the payouts module (needs the payments permission).
  const cod = useApi(() => (can('payments') ? payoutsApi.riderBalances() : Promise.resolve(null)), [], {
    key: 'rider-cod',
  }).data;
  const codInHand = cod?.reduce((s, r) => s + (r.cashInHand || 0), 0);
  const open = (r) => navigate(paths.rider(r.riderId));

  const columns = [
    { key: 'name', header: 'Rider', render: (r) => <Identity name={r.name} sub={r.riderId} /> },
    { key: 'phone', header: 'Phone', hideOnMobile: true, render: (r) => r.phone },
    {
      key: 'vehicle',
      header: 'Vehicle',
      hideOnMobile: true,
      render: (r) => (
        <>
          <span className="cell-strong">{titleCase(r.vehicleType || '—')}</span>
          <span className="cell-sub">{r.vehicleNumber}</span>
        </>
      ),
    },
    {
      key: 'status',
      header: 'Account',
      render: (r) =>
        !r.isActive ? <StatusBadge status="blocked" /> : <StatusBadge status={r.approvalStatus} />,
    },
    {
      key: 'live',
      header: 'Right now',
      render: (r) =>
        r.approvalStatus === 'approved' ? (
          <StatusBadge status={riderNowStatus(r)} />
        ) : (
          <span className="muted">—</span>
        ),
    },
    {
      key: 'deliveries',
      header: 'Deliveries',
      align: 'right',
      hideOnMobile: true,
      render: (r) => num(r.totalDeliveries),
    },
    {
      key: 'rating',
      header: 'Rating',
      hideOnMobile: true,
      render: (r) =>
        r.totalRatings ? (
          <span className="row" style={{ gap: 4 }}>
            <Star size={13} fill="var(--accent)" color="var(--accent)" />
            {r.rating}
          </span>
        ) : (
          <span className="muted">New</span>
        ),
    },
    {
      key: 'earnings',
      header: 'Earnings',
      align: 'right',
      hideOnMobile: true,
      render: (r) => money(r.totalEarnings),
    },
    {
      key: 'actions',
      header: '',
      render: (r) =>
        r.approvalStatus === 'pending' ? (
          <Button
            size="sm"
            variant="soft"
            onClick={(e) => {
              e.stopPropagation();
              open(r);
            }}
          >
            Review
          </Button>
        ) : (
          <IconButton
            icon={Eye}
            label="View rider"
            onClick={(e) => {
              e.stopPropagation();
              open(r);
            }}
          />
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Riders"
        description="Onboard riders, keep an eye on who's online and make sure COD cash comes back to the hub."
        actions={
          <Button icon={MapPinned} onClick={() => navigate(paths.liveRiders())}>
            Open live map
          </Button>
        }
      />
      <div className="stat-grid">
        <StatCard
          icon={Bike}
          label="Online now"
          value={counts ? `${num(counts.online)} / ${num(counts.approved)}` : '—'}
          footer={
            <>
              <span className="live-dot" /> Approved riders online
            </>
          }
          onClick={() => list.setFilter('isOnline', 'true')}
        />
        <StatCard
          icon={UserCheck}
          tone="amber"
          label="Pending applications"
          value={counts ? num(counts.pending) : '—'}
          footer="Need document review"
          onClick={() => list.setFilter('status', 'pending')}
        />
        <StatCard
          icon={Ban}
          tone="violet"
          label="Blocked"
          value={counts ? num(counts.blocked) : '—'}
          footer="Can't sign in to the rider app"
        />
        {can('payments') && (
          <StatCard
            icon={Wallet}
            tone="rose"
            label="COD held by riders"
            value={cod ? compactMoney(codInHand) : '—'}
            footer="To be deposited at hubs"
            onClick={() => navigate(paths.payouts({ tab: 'riders' }))}
          />
        )}
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented
            value={list.filters.status}
            onChange={(v) => list.setFilter('status', v)}
            options={[
              { value: 'all', label: 'All', count: counts?.all },
              { value: 'pending', label: 'Pending', count: counts?.pending },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
          />
          <div className="spacer" />
          <Select
            value={list.filters.isOnline}
            onChange={(v) => list.setFilter('isOnline', v)}
            options={[
              { value: 'all', label: 'Online & offline' },
              { value: 'true', label: 'Online only' },
              { value: 'false', label: 'Offline only' },
            ]}
          />
          <SearchInput
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search name, phone or bike no."
          />
        </div>
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          onRowClick={open}
          rowClassName={(r) => (r.approvalStatus === 'pending' ? 'row-attention' : '')}
        />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
    </>
  );
}
