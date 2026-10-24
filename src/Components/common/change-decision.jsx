import { useState } from 'react';
import { Check, RotateCcw, ShieldCheck, X } from 'lucide-react';

import { ConfirmDialog, Menu } from '@/components/overlays';
import { Button } from '@/components/ui';
import { useAction } from '@/hooks';

// Approve / reject / back-to-pending menu for an application that was already decided.
// Re-open or reverse an earlier approve / reject decision.
export function ChangeDecision({ status, onDecide, rejectCopy }) {
  const [rejecting, setRejecting] = useState(false);
  const [run, pending] = useAction();
  const decide = (next, reason) =>
    run(() => onDecide(next, reason), { success: `Marked as ${next}` })
      .then(() => setRejecting(false))
      .catch(() => {});
  return (
    <>
      <Menu
        trigger={({ toggle }) => (
          <Button variant="secondary" icon={ShieldCheck} loading={pending && !rejecting} onClick={toggle}>
            Change decision
          </Button>
        )}
        items={[
          status !== 'approved' && { label: 'Approve', icon: Check, onClick: () => decide('approved') },
          status !== 'rejected' && {
            label: 'Reject',
            icon: X,
            tone: 'danger',
            onClick: () => setRejecting(true),
          },
          { label: 'Move back to pending', icon: RotateCcw, onClick: () => decide('pending') },
        ]}
      />
      <ConfirmDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        onConfirm={(reason) => decide('rejected', reason)}
        loading={pending}
        {...rejectCopy}
        reason
        reasonRequired
        reasonLabel="Reason for rejection"
      />
    </>
  );
}
