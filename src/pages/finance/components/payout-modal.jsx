import { useState } from 'react';
import { Info, Send, Wallet } from 'lucide-react';

import { Modal } from '@/components/overlays';
import { Button } from '@/components/ui';
import { useAction } from '@/hooks';
import { payoutsApi } from '@/services/api';
import { money } from '@/utils/format';

import { amountError, methodLabel } from '../payouts-utils';
import { SettlementFields } from './settlement-fields';

// POST /admin/payouts. target: { userId, name, max, paidOut, account, kind, cashInHand? }
export function PayoutModal(props) {
  return props.target ? <PayoutBody key={props.target.userId} {...props} /> : null;
}

function PayoutBody({ target, onClose, onDone }) {
  const [form, setForm] = useState(() => ({
    amount: target.max > 0 ? String(target.max) : '',
    method: 'bank_transfer',
    reference: '',
    note: '',
  }));
  const [run, pending] = useAction();
  const amount = Number(form.amount);
  const error = amountError(form, target.max, `Only ${money(target.max)} is owed to this ${target.kind}`);
  const submit = (e) => {
    e.preventDefault();
    if (error || !amount) return;
    run(() => payoutsApi.create({ userId: target.userId, ...form }), {
      success: `${money(amount)} paid to ${target.name}`,
    })
      .then(() => {
        onClose();
        onDone();
      })
      .catch(() => {});
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Pay ${target.name}`}
      description="Record money Fauran Mart has sent to this account. It's added to the settlement history."
      icon={Send}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="payout-form"
            icon={Send}
            loading={pending}
            disabled={!!error || !amount}
          >
            Pay {amount ? money(amount) : ''}
          </Button>
        </>
      }
    >
      <form id="payout-form" onSubmit={submit} className="stack">
        <div className="callout">
          <Wallet size={16} />
          <div>
            Owed now <strong>{money(target.max)}</strong> · paid so far {money(target.paidOut)}
            {target.account?.accountNumber ? (
              <>
                {' '}
                · send to {target.account.bankName || methodLabel(target.account.method)}{' '}
                {target.account.accountNumber}
              </>
            ) : null}
          </div>
        </div>
        {target.cashInHand > 0 && (
          <div className="callout callout-warning">
            <Info size={16} />
            <div>
              This rider still holds <strong>{money(target.cashInHand)}</strong> of COD cash, which is netted
              off what they're owed. Record their cash deposit first to pay out the rest.
            </div>
          </div>
        )}
        <SettlementFields form={form} setForm={setForm} error={error} max={target.max} amountLabel="Amount" />
      </form>
    </Modal>
  );
}
