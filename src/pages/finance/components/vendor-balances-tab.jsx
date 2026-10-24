import { useState } from 'react';
import { BookOpen, Send, Store } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { Menu } from '@/components/overlays';
import { Button, Card, EmptyState, Identity, SearchInput, Toggle } from '@/components/ui';
import { money, num } from '@/utils/format';

import { lastPayout } from '../payouts-utils';
import { AccountCell } from './account-cell';
import { MoneyRule } from './money-rule';

export function VendorTab({ list, onlyDue, setOnlyDue, onPay, onLedger }) {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const rows = list.data?.filter(
    (v) => !q || `${v.storeName} ${v.name} ${v.vendorId}`.toLowerCase().includes(q),
  );
  const columns = [
    {
      key: 'vendor',
      header: 'Vendor',
      render: (v) => <Identity name={v.storeName || v.name} sub={`${v.vendorId} · ${v.name}`} square />,
    },
    {
      key: 'bank',
      header: 'Bank details',
      hideOnMobile: true,
      render: (v) => <AccountCell account={v.bankDetails} provider={v.bankDetails?.bankName} />,
    },
    {
      key: 'orders',
      header: 'Delivered',
      align: 'right',
      hideOnMobile: true,
      render: (v) => num(v.deliveredOrders),
    },
    {
      key: 'earned',
      header: 'Earned',
      align: 'right',
      hideOnMobile: true,
      render: (v) => money(v.totalEarned),
    },
    { key: 'paid', header: 'Paid out', align: 'right', hideOnMobile: true, render: (v) => money(v.paidOut) },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (v) => <span className="cell-strong">{money(v.due)}</span>,
    },
    { key: 'last', header: 'Last payout', hideOnMobile: true, render: (v) => lastPayout(v.lastPayoutAt) },
    {
      key: 'actions',
      header: '',
      render: (v) => (
        <div className="row" style={{ gap: 4 }}>
          <Button
            size="sm"
            variant="soft"
            icon={Send}
            disabled={!(v.due > 0)}
            onClick={(e) => {
              e.stopPropagation();
              onPay(v);
            }}
          >
            Pay
          </Button>
          <Menu items={[{ label: 'View ledger', icon: BookOpen, onClick: () => onLedger(v.vendorId) }]} />
        </div>
      ),
    },
  ];
  return (
    <Card className="table-card" padded={false}>
      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search store, owner or vendor id" />
        <div className="spacer" />
        <Toggle label="Only vendors owed money" checked={onlyDue} onChange={setOnlyDue} />
      </div>
      <MoneyRule>Due = total earned − paid out. You can pay a vendor up to what&apos;s due.</MoneyRule>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey="vendorId"
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        onRowClick={(v) => onLedger(v.vendorId)}
        empty={
          <EmptyState
            icon={Store}
            title={q ? 'No matching vendors' : onlyDue ? 'No vendor is owed money' : 'No vendors yet'}
            description={q ? 'Try a different name or id.' : undefined}
          />
        }
      />
    </Card>
  );
}
