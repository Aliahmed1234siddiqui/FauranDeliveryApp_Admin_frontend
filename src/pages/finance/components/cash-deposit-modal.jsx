import { useState } from 'react';
import { HandCoins } from 'lucide-react';

import { Modal } from '@/components/overlays';
import { Button, EmptyState, Field, Skeleton } from '@/components/ui';
import { useAction } from '@/hooks';
import { payoutsApi } from '@/services/api';
import { money } from '@/utils/format';

import { amountError } from '../payouts-utils';
import { SettlementFields } from './settlement-fields';

// POST /admin/payouts/cash-deposit. `riderId` is a RID… id, or '1' for "pick a rider".
export function CashDepositModal(props) {
  // Remount once the rider list arrives so the preselected rider and amount fill in.
  return props.riderId ? (
    <CashDepositBody key={`${props.riderId}-${props.riders.length > 0}`} {...props} />
  ) : null;
}

function CashDepositBody({ riderId: initialId, riders, loading, onClose, onDone }) {
  const holding = riders.filter((r) => r.cashInHand > 0);
  const [riderId, setRiderId] = useState(() => (initialId !== '1' ? initialId : holding[0]?.riderId || ''));
  const rider = riders.find((r) => r.riderId === riderId);
  const [form, setForm] = useState(() => ({
    amount: rider?.cashInHand > 0 ? String(rider.cashInHand) : '',
    method: 'cash',
    reference: '',
    note: '',
  }));
  const [run, pending] = useAction();
  const max = rider?.cashInHand || 0;
  const amount = Number(form.amount);
  const error = amountError(form, max, `This rider only holds ${money(max)}`);
  const pick = (id) => {
    setRiderId(id);
    const r = riders.find((x) => x.riderId === id);
    setForm((f) => ({ ...f, amount: r?.cashInHand > 0 ? String(r.cashInHand) : '' }));
  };
  const submit = (e) => {
    e.preventDefault();
    if (!rider || error || !amount) return;
    run(() => payoutsApi.recordCashDeposit({ riderId, ...form }), {
      success: `${money(amount)} received from ${rider.name}`,
    })
      .then(() => {
        onClose();
        onDone();
      })
      .catch(() => {});
  };
  // The rider from the URL may not be in the list yet (or holds no cash), keep them selectable.
  const options = rider && !holding.includes(rider) ? [rider, ...holding] : holding;

  return (
    <Modal
      open
      onClose={onClose}
      title="Record cash received"
      description="Log COD cash a rider has handed over. It lowers their cash in hand and raises what Fauran Mart owes them."
      icon={HandCoins}
      tone="amber"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="deposit-form"
            icon={HandCoins}
            loading={pending}
            disabled={!rider || !!error || !amount}
          >
            Record deposit
          </Button>
        </>
      }
    >
      {loading && !riders.length ? (
        <Skeleton h={160} />
      ) : !options.length ? (
        <EmptyState
          icon={HandCoins}
          title="No rider is holding cash"
          description="Cash in hand appears here once riders collect COD payments."
        />
      ) : (
        <form id="deposit-form" onSubmit={submit} className="stack">
          <Field label="Rider" required>
            {(id) => (
              <select id={id} className="input" value={riderId} onChange={(e) => pick(e.target.value)}>
                {!rider && <option value="">Choose a rider</option>}
                {options.map((r) => (
                  <option key={r.riderId} value={r.riderId}>
                    {r.name} · {r.riderId} · holding {money(r.cashInHand)}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {rider && (
            <SettlementFields
              form={form}
              setForm={setForm}
              error={error}
              max={max}
              amountLabel="Amount received"
            />
          )}
        </form>
      )}
    </Modal>
  );
}
