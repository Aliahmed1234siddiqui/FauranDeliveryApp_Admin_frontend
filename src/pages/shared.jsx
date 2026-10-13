import { useState } from 'react';
import { ArrowLeft, Ban, Check, ShieldCheck, X } from 'lucide-react';
import { Link } from '../lib/router';
import { useAction } from '../lib/hooks';
import { adminApi } from '../services/adminApi';
import { Button, Card, Skeleton } from '../ui/primitives';
import { ConfirmDialog } from '../ui/overlays';

export function BackLink({ to, children }) {
  return <Link to={to} className="back-link"><ArrowLeft size={15} /> {children}</Link>;
}

export function DetailSkeleton() {
  return (
    <div className="stack">
      <Skeleton w={120} />
      <div className="card card-padded"><div className="row"><Skeleton w={64} h={64} r={18} /><div style={{ flex: 1, display: 'grid', gap: 8 }}><Skeleton w="40%" h={20} /><Skeleton w="60%" /></div></div></div>
      <div className="grid grid-side"><Skeleton h={320} r={16} /><Skeleton h={320} r={16} /></div>
    </div>
  );
}

// Approve / reject panel shared by vendor and rider applications.
// `onDecide(status, reason)` calls the matching PATCH .../:id/approve route.
export function ApprovalPanel({ title, description, onDecide, children }) {
  const [rejecting, setRejecting] = useState(false);
  const [run, pending] = useAction();
  const decide = (status, reason) => run(() => onDecide(status, reason), { success: status === 'approved' ? 'Application approved' : 'Application rejected' }).then(() => setRejecting(false)).catch(() => {});
  return (
    <Card className="mb" style={{ borderColor: 'color-mix(in srgb, var(--accent) 55%, transparent)', background: 'linear-gradient(180deg, var(--accent-soft), var(--surface) 70%)' }}>
      <div className="row row-wrap" style={{ alignItems: 'flex-start', gap: 16 }}>
        <span className="stat-icon tone-amber"><ShieldCheck size={18} /></span>
        <div style={{ flex: '1 1 300px' }}>
          <h2 className="card-title">{title}</h2>
          <p className="card-subtitle">{description}</p>
          {children && <div style={{ marginTop: 14 }}>{children}</div>}
        </div>
        <div className="row">
          <Button variant="danger-soft" icon={X} onClick={() => setRejecting(true)}>Reject</Button>
          <Button icon={Check} loading={pending && !rejecting} onClick={() => decide('approved')}>Approve</Button>
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

// Block / unblock any account via PATCH /admin/users/:id/block
export function BlockButton({ user, kind, onDone, size }) {
  const [open, setOpen] = useState(false);
  const [run, pending] = useAction();
  const blocking = user.isActive;
  return (
    <>
      <Button variant={blocking ? 'danger-soft' : 'secondary'} size={size} icon={blocking ? Ban : Check} onClick={() => setOpen(true)}>
        {blocking ? `Block ${kind}` : `Unblock ${kind}`}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        tone={blocking ? 'danger' : 'brand'}
        icon={blocking ? Ban : Check}
        loading={pending}
        title={blocking ? `Block this ${kind}?` : `Unblock this ${kind}?`}
        description={blocking ? `They'll be signed out immediately and can't use the ${kind} app until you unblock them.` : 'They will regain access to the app right away.'}
        confirmLabel={blocking ? 'Block account' : 'Unblock account'}
        onConfirm={() => run(() => adminApi.blockUser(user._id, !blocking), { success: blocking ? 'Account blocked' : 'Account unblocked' }).then((u) => { setOpen(false); onDone?.(u); }).catch(() => {})}
      />
    </>
  );
}
