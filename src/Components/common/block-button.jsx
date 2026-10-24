import { useState } from 'react';
import { Ban, Check } from 'lucide-react';

import { ConfirmDialog } from '@/components/overlays';
import { Button } from '@/components/ui';
import { useAction } from '@/hooks';
import { usersApi } from '@/services/api';

// Block / unblock any account (customer, vendor, rider, employee) via PATCH /admin/users/:id/block.
export function BlockButton({ user, kind, onDone, size }) {
  const [open, setOpen] = useState(false);
  const [run, pending] = useAction();
  const blocking = user.isActive;
  return (
    <>
      <Button
        variant={blocking ? 'danger-soft' : 'secondary'}
        size={size}
        icon={blocking ? Ban : Check}
        onClick={() => setOpen(true)}
      >
        {blocking ? `Block ${kind}` : `Unblock ${kind}`}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        tone={blocking ? 'danger' : 'brand'}
        icon={blocking ? Ban : Check}
        loading={pending}
        title={blocking ? `Block this ${kind}?` : `Unblock this ${kind}?`}
        description={
          blocking
            ? `They'll be signed out everywhere and can't use the ${kind} app until you unblock them. The reason is sent in their notification.`
            : 'They will regain access to the app right away.'
        }
        reason={blocking}
        reasonLabel="Reason (optional)"
        reasonPlaceholder="e.g. Repeated order cancellations"
        confirmLabel={blocking ? 'Block account' : 'Unblock account'}
        onConfirm={(reason) =>
          run(() => usersApi.setActive(user._id, !blocking, reason || undefined), {
            success: blocking ? 'Account blocked' : 'Account unblocked',
          })
            .then((u) => {
              setOpen(false);
              onDone?.(u);
            })
            .catch(() => {})
        }
      />
    </>
  );
}
