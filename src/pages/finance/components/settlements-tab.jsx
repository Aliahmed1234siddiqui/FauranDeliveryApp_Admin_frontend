import { Receipt } from 'lucide-react';

import { DateRange } from '@/components/common';
import { DataTable, Pagination } from '@/components/data-table';
import { Card, Code, EmptyState, Identity, Segmented, StatusBadge } from '@/components/ui';
import { withAll } from '@/constants';
import { date, money, titleCase } from '@/utils/format';

import { methodLabel } from '../payouts-utils';

// GET /admin/settlements - user is a vendor ({ vendorId, storeName }) or a rider ({ riderId, name }).
export function SettlementsTab({ list }) {
  const columns = [
    {
      key: 'id',
      header: 'Settlement',
      render: (s) => (
        <>
          <Code>{s.settlementId}</Code>
          {s.reference && <span className="cell-sub">Ref {s.reference}</span>}
        </>
      ),
    },
    { key: 'type', header: 'Type', render: (s) => <StatusBadge status={s.type} /> },
    {
      key: 'user',
      header: 'Account',
      render: (s) => (
        <Identity
          name={s.user?.storeName || s.user?.name || '—'}
          sub={`${s.user?.vendorId || s.user?.riderId || ''} · ${titleCase(s.role || s.user?.role || '')}`}
          square={s.role === 'vendor'}
        />
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (s) => (
        <span className={`cell-strong ${s.type === 'cash_deposit' ? 'pos' : ''}`}>
          {s.type === 'cash_deposit' ? '+ ' : '− '}
          {money(s.amount)}
        </span>
      ),
    },
    { key: 'method', header: 'Method', hideOnMobile: true, render: (s) => methodLabel(s.method) },
    {
      key: 'by',
      header: 'Recorded by',
      hideOnMobile: true,
      render: (s) => (
        <>
          <span className="cell-strong">{s.createdBy?.name || '—'}</span>
          <span className="cell-sub">
            {s.createdBy?.adminId || s.createdBy?.employeeId}
            {s.note ? ` · ${s.note}` : ''}
          </span>
        </>
      ),
    },
    { key: 'date', header: 'Date', hideOnMobile: true, render: (s) => date(s.createdAt) },
  ];
  const { filters, setFilter } = list;
  return (
    <Card className="table-card" padded={false}>
      <div className="toolbar">
        <Segmented
          value={filters.type}
          onChange={(v) => setFilter('type', v)}
          options={withAll('All', ['payout', 'cash_deposit'], (v) =>
            v === 'payout' ? 'Payouts' : 'Cash deposits',
          )}
        />
        <Segmented
          value={filters.role}
          onChange={(v) => setFilter('role', v)}
          options={withAll('Everyone', ['vendor', 'rider'], (v) => `${titleCase(v)}s`)}
        />
        <div className="spacer" />
        <DateRange
          from={filters.from}
          to={filters.to}
          onChange={({ from, to }) => {
            setFilter('from', from);
            setFilter('to', to);
          }}
        />
      </div>
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        empty={
          <EmptyState
            icon={Receipt}
            title="No settlements"
            description="Payouts and cash deposits you record appear here."
          />
        }
      />
      <Pagination page={list.page} limit={list.params.limit} total={list.total} onPage={list.setPage} />
    </Card>
  );
}
