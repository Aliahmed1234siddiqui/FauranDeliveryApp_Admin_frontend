import { useState } from 'react';
import { Check, ShieldCheck, X } from 'lucide-react';

import { ConfirmDialog } from '@/components/overlays';
import { Button, Card } from '@/components/ui';
import { useAction } from '@/hooks';

// Approve / reject panel shared by vendor and rider applications.
// `onDecide(status, reason)` calls the matching PATCH .../:id/approve route.
export function ApprovalPanel({ title, description, onDecide, children }) {
  const [rejecting, setRejecting] = useState(false);
  const [run, pending] = useAction();
  const decide = (status, reason) =>
    run(() => onDecide(status, reason), {
      success: status === 'approved' ? 'Application approved' : 'Application rejected',
    })
      .then(() => setRejecting(false))
      .catch(() => {});
  return (
    <Card
      className="mb"
      style={{
        borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)',
        background: 'linear-gradient(180deg, var(--accent-soft), var(--surface) 70%)',
      }}
    >
      <div className="row row-wrap" style={{ alignItems: 'flex-start', gap: 16 }}>
        <span className="stat-icon tone-amber">
          <ShieldCheck size={18} />
        </span>
        <div style={{ flex: '1 1 300px' }}>
          <h2 className="card-title">{title}</h2>
          <p className="card-subtitle">{description}</p>
          {children && <div style={{ marginTop: 14 }}>{children}</div>}
        </div>
        <div className="row">
          <Button variant="danger-soft" icon={X} onClick={() => setRejecting(true)}>
            Reject
          </Button>
          <Button icon={Check} loading={pending && !rejecting} onClick={() => decide('approved')}>
            Approve
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        onConfirm={(reason) => decide('rejected', reason)}
        loading={pending}
        title="Reject this application?"
        description="The applicant will be notified with your reason and can re-apply later."
        confirmLabel="Reject application"
        reason
        reasonRequired
        reasonLabel="Reason for rejection"
        reasonPlaceholder="e.g. CNIC photo is blurry, please re-upload."
      />
    </Card>
  );
}
