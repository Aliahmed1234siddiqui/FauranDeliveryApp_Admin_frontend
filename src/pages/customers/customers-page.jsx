import { BadgeCheck, Eye, UserCheck, Users, UserX } from 'lucide-react';

import { DataTable, Pagination } from '@/components/data-table';
import {
  Card,
  IconButton,
  Identity,
  PageHeader,
  SearchInput,
  Segmented,
  Select,
  StatCard,
  StatusBadge,
  Toggle,
} from '@/components/ui';
import { useAction, useApi, useList } from '@/hooks';
import { paths, useRouter } from '@/router';
import { customersApi } from '@/services/api';
import { date, money, num, timeAgo } from '@/utils/format';

const FILTERS = ['status', 'verified'];

// Headline counts come from `total` of one-row requests, not from loading every customer.
const countCustomers = (params) => customersApi.list({ ...params, limit: 1 }).then((r) => r.total);

export default function Customers() {
  const { navigate } = useRouter();
  const list = useList(customersApi.list, FILTERS);
  const counts = useApi(
    () =>
      Promise.all([
        countCustomers({}),
        countCustomers({ status: 'active' }),
        countCustomers({ status: 'inactive' }),
        countCustomers({ verified: true }),
      ]),
    [],
    { key: 'customer-counts' },
  );
  const [total, active, inactive, verified] = counts.data || [];
  const [run] = useAction();

  // Optimistic switch; codBlocked = true means the customer must pay by card.
  const setCodAllowed = (c, allowed) => {
    list.setData((d) => ({
      ...d,
      items: d.items.map((x) =>
        x._id === c._id
          ? { ...x, codBlocked: !allowed, failedCodDeliveries: allowed ? 0 : x.failedCodDeliveries }
          : x,
      ),
    }));
    run(() => customersApi.setCodBlocked(c._id, !allowed), {
      success: allowed ? `COD re-allowed for ${c.name}` : `${c.name} can now only pay by card`,
    }).catch(() => list.reload());
  };

  // Some accounts have no customerId yet, so fall back to the Mongo _id.
  const open = (c) => navigate(paths.customer(c.customerId || c._id));

  const columns = [
    { key: 'name', header: 'Customer', render: (c) => <Identity name={c.name} sub={c.email} /> },
    { key: 'phone', header: 'Phone', hideOnMobile: true, render: (c) => c.phone },
    { key: 'orders', header: 'Orders', align: 'right', render: (c) => num(c.totalOrders) },
    {
      key: 'spent',
      header: 'Lifetime spend',
      align: 'right',
      render: (c) => <span className="cell-strong">{money(c.totalSpent)}</span>,
    },
    { key: 'last', header: 'Last order', hideOnMobile: true, render: (c) => timeAgo(c.lastOrderAt) },
    { key: 'joined', header: 'Joined', hideOnMobile: true, render: (c) => date(c.createdAt) },
    {
      key: 'cod',
      header: 'COD',
      render: (c) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Toggle checked={!c.codBlocked} onChange={(v) => setCodAllowed(c, v)} />
          {c.failedCodDeliveries > 0 && <span className="cell-sub">{c.failedCodDeliveries} failed</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <StatusBadge status={c.isActive ? 'active' : 'blocked'} />,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <IconButton
          icon={Eye}
          label="View customer"
          onClick={(e) => {
            e.stopPropagation();
            open(c);
          }}
        />
      ),
    },
  ];

  const stat = (n) => (counts.data ? num(n) : '—');

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who shops on Fauran Mart. Control cash-on-delivery access and account status."
      />
      <div className="stat-grid">
        <StatCard
          icon={Users}
          label="Total customers"
          value={stat(total)}
          footer="Registered accounts"
          onClick={() => list.setFilter('status', 'all')}
        />
        <StatCard
          icon={UserCheck}
          tone="blue"
          label="Active"
          value={stat(active)}
          footer="Can place orders"
          onClick={() => list.setFilter('status', 'active')}
        />
        <StatCard
          icon={UserX}
          tone="rose"
          label="Blocked"
          value={stat(inactive)}
          footer="Signed out of the app"
          onClick={() => list.setFilter('status', 'inactive')}
        />
        <StatCard
          icon={BadgeCheck}
          tone="amber"
          label="Verified"
          value={stat(verified)}
          footer="Verified accounts"
          onClick={() => list.setFilter('verified', 'true')}
        />
      </div>
      <Card className="table-card" padded={false}>
        <div className="toolbar">
          <Segmented
            value={list.filters.status}
            onChange={(v) => list.setFilter('status', v)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Blocked' },
            ]}
          />
          <div className="spacer" />
          <Select
            value={list.filters.verified}
            onChange={(v) => list.setFilter('verified', v)}
            options={[
              { value: 'all', label: 'Any verification' },
              { value: 'true', label: 'Verified' },
              { value: 'false', label: 'Not verified' },
            ]}
          />
          <SearchInput
            value={list.search}
            onChange={list.setSearch}
            placeholder="Search name, phone, email or CUS id"
          />
        </div>
        <DataTable
          columns={columns}
          rows={list.rows}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          onRowClick={open}
        />
        <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
      </Card>
    </>
  );
}
