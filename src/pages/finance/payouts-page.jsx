import { useState } from 'react';
import { Banknote, Bike, HandCoins, Landmark, Receipt, Store } from 'lucide-react';

import { Button, PageHeader, StatCard, Tabs } from '@/components/ui';
import { useApi, useList } from '@/hooks';
import { useQueryState } from '@/router';
import { payoutsApi, settlementsApi } from '@/services/api';
import { compactMoney } from '@/utils/format';

import { CashDepositModal } from './components/cash-deposit-modal';
import { LedgerDrawer } from './components/ledger-drawer';
import { PayoutModal } from './components/payout-modal';
import { RiderTab } from './components/rider-balances-tab';
import { SettlementsTab } from './components/settlements-tab';
import { VendorTab } from './components/vendor-balances-tab';
import { sum } from './payouts-utils';

const SETTLEMENT_FILTERS = ['role', 'type', 'from', 'to'];

export default function Payouts() {
  const [tab, setTab] = useQueryState('tab', 'vendors');
  const [ledger, setLedger] = useQueryState('ledger');
  const [deposit, setDeposit] = useQueryState('deposit');
  const [due, setDue] = useQueryState('due');
  const [owes, setOwes] = useQueryState('owes');
  const [payTarget, setPayTarget] = useState(null);

  const vendors = useApi(() => payoutsApi.vendorBalances({ due: due === '1' || undefined }), [due], {
    key: 'vendor-balances',
  });
  // Unfiltered riders feed the stat cards and the cash-deposit picker; the table re-fetches with `owes`.
  const ridersAll = useApi(() => payoutsApi.riderBalances(), [], { key: 'rider-balances' });
  const ridersOwes = useApi(
    () => (owes ? payoutsApi.riderBalances({ owes }) : Promise.resolve(null)),
    [owes],
    { key: 'rider-balances-owes' },
  );
  const settlements = useList(settlementsApi.list, SETTLEMENT_FILTERS, {
    limit: 10,
    defaults: { from: '', to: '' },
  });

  const vendorRows = vendors.data || [];
  const riderRows = ridersAll.data || [];
  const refresh = () => {
    vendors.reload();
    ridersAll.reload();
    ridersOwes.reload();
    settlements.reload();
  };

  const payVendor = (v) =>
    setPayTarget({
      kind: 'vendor',
      userId: v.vendorId,
      name: v.storeName || v.name,
      max: v.due,
      paidOut: v.paidOut,
      account: v.bankDetails,
    });
  const payRider = (r) =>
    setPayTarget({
      kind: 'rider',
      userId: r.riderId,
      name: r.name,
      max: r.furanOwesRider,
      paidOut: r.paidOut,
      account: r.payoutDetails,
      cashInHand: r.cashInHand,
    });
  const openDeposit = (id) => {
    setTab('riders');
    setDeposit(id);
  };

  return (
    <>
      <PageHeader
        title="Payouts & settlements"
        description="What Fauran Mart owes vendors and riders, and the COD cash riders still need to hand over."
        actions={
          <Button variant="secondary" icon={HandCoins} onClick={() => openDeposit('1')}>
            Record cash received
          </Button>
        }
      />
      <div className="stat-grid">
        <StatCard
          icon={Store}
          label="Due to vendors"
          value={vendors.loading && !vendors.data ? '–' : compactMoney(sum(vendorRows, 'due'))}
          footer={`${vendorRows.filter((v) => v.due > 0).length} vendors owed money`}
          onClick={() => setTab('vendors')}
        />
        <StatCard
          icon={Bike}
          tone="violet"
          label="Fauran Mart owes riders"
          value={ridersAll.loading && !ridersAll.data ? '–' : compactMoney(sum(riderRows, 'furanOwesRider'))}
          footer={`${riderRows.filter((r) => r.furanOwesRider > 0).length} riders to pay`}
          onClick={() => {
            setTab('riders');
            setOwes('furan');
          }}
        />
        <StatCard
          icon={Banknote}
          tone="rose"
          label="COD cash with riders"
          value={ridersAll.loading && !ridersAll.data ? '–' : compactMoney(sum(riderRows, 'cashInHand'))}
          footer={`${riderRows.filter((r) => r.cashInHand > 0).length} riders holding cash`}
          onClick={() => setTab('riders')}
        />
        <StatCard
          icon={Landmark}
          tone="blue"
          label="Riders owe Fauran Mart"
          value={ridersAll.loading && !ridersAll.data ? '–' : compactMoney(sum(riderRows, 'riderOwesFuran'))}
          footer="Cash held beyond their earnings"
          onClick={() => {
            setTab('riders');
            setOwes('rider');
          }}
        />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'vendors', label: 'Vendor balances', icon: Store },
          { value: 'riders', label: 'Rider balances & COD', icon: Bike },
          {
            value: 'settlements',
            label: 'Settlement history',
            icon: Receipt,
            count: settlements.total || undefined,
          },
        ]}
      />

      {tab === 'vendors' && (
        <VendorTab
          list={vendors}
          onlyDue={due === '1'}
          setOnlyDue={(on) => setDue(on ? '1' : '')}
          onPay={payVendor}
          onLedger={setLedger}
        />
      )}
      {tab === 'riders' && (
        <RiderTab
          list={owes ? ridersOwes : ridersAll}
          owes={owes}
          setOwes={setOwes}
          onPay={payRider}
          onDeposit={openDeposit}
          onLedger={setLedger}
        />
      )}
      {tab === 'settlements' && <SettlementsTab list={settlements} />}

      <PayoutModal target={payTarget} onClose={() => setPayTarget(null)} onDone={refresh} />
      <CashDepositModal
        riderId={deposit}
        riders={riderRows}
        loading={ridersAll.loading}
        onClose={() => setDeposit('')}
        onDone={refresh}
      />
      <LedgerDrawer userId={ledger} onClose={() => setLedger('')} />
    </>
  );
}
