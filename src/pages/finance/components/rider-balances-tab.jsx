import { useState } from 'react';
import { Bike, BookOpen, HandCoins, Send } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { Menu } from '@/components/overlays';
import { Button, Card, EmptyState, Identity, SearchInput, Segmented } from '@/components/ui';
import { money } from '@/utils/format';

import { methodLabel } from '../payouts-utils';
import { AccountCell } from './account-cell';
import { MoneyRule } from './money-rule';
import { RiderBalance } from './rider-balance';

export function RiderTab({ list, owes, setOwes, onPay, onDeposit, onLedger }) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const rows = list.data?.filter((r) => !q || `${r.name} ${r.riderId} ${r.phone}`.toLowerCase().includes(q));
  const columns = [
    {
      key: 'rider',
      header: 'Rider',
      render: (r) => (
        <Identity name={r.name} sub={[r.riderId, r.vehicleNumber].filter(Boolean).join(' · ')} />
      ),
    },
    {
      key: 'payout',
      header: 'Payout details',
      hideOnMobile: true,
      render: (r) => (
        <AccountCell
          account={r.payoutDetails}
          provider={r.payoutDetails?.method && methodLabel(r.payoutDetails.method)}
        />
      ),
    },
    {
      key: 'earned',
      header: 'Earned',
      align: 'right',
      hideOnMobile: true,
      render: (r) => money(r.totalEarned),
    },
    { key: 'paid', header: 'Paid out', align: 'right', hideOnMobile: true, render: (r) => money(r.paidOut) },
    {
      key: 'cash',
      header: 'Cash in hand',
      align: 'right',
      render: (r) =>
        r.cashInHand > 0 ? (
          <span className="cell-strong">{money(r.cashInHand)}</span>
        ) : (
          <span className="muted">—</span>
        ),
    },
    { key: 'balance', header: 'Balance', align: 'right', render: (r) => <RiderBalance r={r} /> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="row" style={{ gap: 4 }}>
          <Button
            size="sm"
            variant="soft"
            icon={HandCoins}
            disabled={!(r.cashInHand > 0)}
            onClick={(e) => {
              e.stopPropagation();
              onDeposit(r.riderId);
            }}
          >
            Cash received
          </Button>
          <Menu
            items={[
              { label: 'Pay rider', icon: Send, disabled: !(r.furanOwesRider > 0), onClick: () => onPay(r) },
              { label: 'View ledger', icon: BookOpen, onClick: () => onLedger(r.riderId) },
            ]}
          />
        </div>
      ),
    },
  ];
  return (
    <Card className="table-card" padded={false}>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search rider name, id or phone" />
        <div className="spacer" />
        <Segmented
          value={owes}
          onChange={setOwes}
          options={[
            { value: '', label: 'All riders' },
            { value: 'furan', label: 'Fauran Mart owes rider' },
            { value: 'rider', label: 'Rider owes Fauran Mart' },
          ]}
        />
      </div>
      <MoneyRule>
        Cash in hand = COD collected − cash deposited. Balance = earned − paid out − cash in hand. A rider can
        only be paid what Fauran Mart owes them, so record cash received first.
      </MoneyRule>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="riderId"
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        onRowClick={(r) => onLedger(r.riderId)}
        rowClassName={(r) => (r.riderOwesFuran > 0 ? 'row-attention' : '')}
        empty={
          <EmptyState
            icon={Bike}
            title={q ? 'No matching riders' : 'No riders in this view'}
            description={q ? 'Try a different name or id.' : undefined}
          />
        }
      />
    </Card>
  );
}
