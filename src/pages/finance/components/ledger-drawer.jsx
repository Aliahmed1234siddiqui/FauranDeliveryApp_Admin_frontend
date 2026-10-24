import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react';

import { Drawer } from '@/components/overlays';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useApi } from '@/hooks';
import { payoutsApi } from '@/services/api';
import { compactMoney, dateTime, money, titleCase } from '@/utils/format';

import { methodLabel } from '../payouts-utils';

// GET /admin/payouts/user/:id → { user, balance, settlements }
export function LedgerDrawer({ userId, onClose }) {
  const { data, loading, error, reload } = useApi(
    () => (userId ? payoutsApi.ledger(userId) : Promise.resolve(null)),
    [userId],
    { key: 'ledger' },
  );
  const user = data?.user;
  const b = data?.balance || {};
  const isRider = b.cashInHand !== undefined;
  return (
    <Drawer
      open={!!userId}
      onClose={onClose}
      width={620}
      title={user ? `${user.storeName || user.name} · ledger` : 'Ledger'}
      subtitle={
        user
          ? `${user.vendorId || user.riderId || userId} · ${titleCase(user.role || (isRider ? 'rider' : 'vendor'))}`
          : 'Loading…'
      }
    >
      {loading && !data ? (
        <Skeleton h={300} />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        data && (
          <>
            <div className="ledger-summary">
              <div className="mini-stat">
                <span>Total earned</span>
                <strong>{compactMoney(b.totalEarned)}</strong>
              </div>
              <div className="mini-stat">
                <span>Paid out</span>
                <strong className="neg">{compactMoney(b.paidOut)}</strong>
              </div>
              {isRider ? (
                <div className="mini-stat">
                  <span>{b.riderOwesFuran > 0 ? 'Rider owes Fauran Mart' : 'Fauran Mart owes rider'}</span>
                  <strong className={b.riderOwesFuran > 0 ? 'neg' : 'pos'}>
                    {compactMoney(b.riderOwesFuran > 0 ? b.riderOwesFuran : b.furanOwesRider)}
                  </strong>
                  <small>Cash in hand {money(b.cashInHand)}</small>
                </div>
              ) : (
                <div className="mini-stat">
                  <span>Due to vendor</span>
                  <strong className="pos">{compactMoney(b.due)}</strong>
                </div>
              )}
            </div>
            {!data.settlements?.length ? (
              <EmptyState
                icon={Receipt}
                title="No settlements yet"
                description="Payouts and cash deposits for this account will show here."
              />
            ) : (
              <div className="list">
                {data.settlements.map((s) => {
                  const incoming = s.type === 'cash_deposit';
                  return (
                    <div className="list-item" key={s._id}>
                      <span
                        className={`stat-icon ${incoming ? 'tone-success' : 'tone-danger'}`}
                        style={{ width: 32, height: 32 }}
                      >
                        {incoming ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                      </span>
                      <div className="identity-copy">
                        <strong>
                          {incoming ? 'Cash received from rider' : 'Payout sent'} · {methodLabel(s.method)}
                        </strong>
                        <small>
                          {dateTime(s.createdAt)} · {s.settlementId}
                          {s.reference ? ` · Ref ${s.reference}` : ''}
                          {s.note ? ` · ${s.note}` : ''}
                        </small>
                      </div>
                      <div className="list-item-end">
                        <strong className={incoming ? 'pos' : 'neg'}>
                          {incoming ? '+ ' : '− '}
                          {money(s.amount)}
                        </strong>
                        {s.createdBy?.name && <small>by {s.createdBy.name}</small>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
      )}
    </Drawer>
  );
}
