import { CreditCard } from 'lucide-react';

import { Button, Card, KeyValue } from '@/components/ui';
import { money, timeAgo } from '@/utils/format';

// Rider balance from GET /admin/payouts/user/:id (see services/api/finance.js).
export function SettlementCard({ balance, onDeposit }) {
  return (
    <Card title="Settlement position">
      <KeyValue
        columns={1}
        items={[
          [
            'Fauran Mart owes rider',
            <span key="o" className="pos">
              {money(balance.furanOwesRider)}
            </span>,
          ],
          [
            'Rider owes Fauran Mart',
            <span key="r" className={balance.riderOwesFuran ? 'neg' : ''}>
              {money(balance.riderOwesFuran)}
            </span>,
          ],
          [
            'COD cash in hand',
            <span key="c" className={balance.cashInHand ? 'neg' : ''}>
              {money(balance.cashInHand)}
            </span>,
          ],
          ['Last payout', balance.lastPayoutAt ? timeAgo(balance.lastPayoutAt) : 'Never'],
        ]}
      />
      <Button variant="soft" icon={CreditCard} style={{ marginTop: 16, width: '100%' }} onClick={onDeposit}>
        Record cash deposit
      </Button>
    </Card>
  );
}
