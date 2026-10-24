import { useState } from 'react';
import { Undo2 } from 'lucide-react';

import { Modal } from '@/components/overlays';
import { Button, Field, Input } from '@/components/ui';
import { useAction } from '@/hooks';
import { paymentsApi } from '@/services/api';
import { money } from '@/utils/format';

// Card refunds are manual (POST /api/payments/refund/:orderId). Leave the amount
// empty to refund what the server suggests (refundDue, else the whole payment).
export function RefundButton({ order, maxAmount, onDone, size, variant = 'secondary' }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [run, pending] = useAction();
  const suggested = order.refundDue > 0 ? order.refundDue : (maxAmount ?? order.totalAmount);
  const submit = () =>
    run(() => paymentsApi.refund(order.orderId || order._id, amount || undefined), {
      success: `Refund of ${money(amount || suggested)} processed`,
    })
      .then((payment) => {
        setOpen(false);
        setAmount('');
        onDone?.(payment);
      })
      .catch(() => {});
  return (
    <>
      <Button size={size} variant={variant} icon={Undo2} onClick={() => setOpen(true)}>
        Refund now
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Refund card payment"
        description="The money goes back to the customer's card through Stripe and they get a notification. Each payment can be refunded once."
        icon={Undo2}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={pending} onClick={submit}>
              Refund {money(amount || suggested)}
            </Button>
          </>
        }
      >
        <Field
          label="Amount (PKR)"
          hint={`Leave empty to refund ${money(suggested)}${order.refundDue > 0 ? ' (products only, delivery fee kept)' : ''}.`}
        >
          {(id) => (
            <Input
              id={id}
              type="number"
              min="1"
              max={maxAmount ?? order.totalAmount}
              prefix="Rs."
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(suggested)}
            />
          )}
        </Field>
      </Modal>
    </>
  );
}
