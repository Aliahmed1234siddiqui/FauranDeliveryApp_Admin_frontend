import { useState } from 'react';
import { ArrowLeft, Ban, CalendarDays, Check, ExternalLink, FileText, ShieldCheck, Undo2, X } from 'lucide-react';
import { Link } from '../lib/router';
import { useAction } from '../lib/hooks';
import { money } from '../lib/format';
import { parentOf } from '../lib/categories';
import { paymentsApi, usersApi } from '../services/api';
import { Button, Card, EmptyState, Field, IconButton, Input, Skeleton } from '../ui/primitives';
import { ConfirmDialog, Modal } from '../ui/overlays';
import { fileUrl } from '../config';

// Main category first, then one of its sub-categories. `value` is the sub-category _id.
// Items saved in a main category before the sub-category rule still open with it preselected.
export function CategoryPicker({ categories, value, onChange, error }) {
  const current = categories.find((c) => c._id === value);
  const [picked, setPicked] = useState(null);
  const main = picked ?? (parentOf(current) || current?._id || '');
  const mains = categories.filter((c) => !c.parentCategory);
  const subs = categories.filter((c) => parentOf(c) === main);
  const inMain = !!current && !parentOf(current);
  const pickMain = (id) => { setPicked(id); onChange(''); };

  return (
    <>
      <Field label="Category" required>
        {(id) => <select id={id} className="input" value={main} onChange={(e) => pickMain(e.target.value)}><option value="">Select…</option>{mains.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}
      </Field>
      <Field label="Sub-category" required error={error} hint={inMain ? 'Saved in a main category. Pick a sub-category to move it.' : undefined}>
        {(id) => (main && !subs.length
          ? <Input id={id} value="No sub-categories yet" disabled />
          : <select id={id} className="input" value={inMain ? '' : value} disabled={!main} onChange={(e) => onChange(e.target.value)}><option value="">{main ? 'Select…' : 'Pick a category first'}</option>{subs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>)}
      </Field>
    </>
  );
}

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

// Block / unblock any account (customer, vendor, rider, employee) via PATCH /admin/users/:id/block.
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
        description={blocking ? `They'll be signed out everywhere and can't use the ${kind} app until you unblock them. The reason is sent in their notification.` : 'They will regain access to the app right away.'}
        reason={blocking}
        reasonLabel="Reason (optional)"
        reasonPlaceholder="e.g. Repeated order cancellations"
        confirmLabel={blocking ? 'Block account' : 'Unblock account'}
        onConfirm={(reason) => run(() => usersApi.setActive(user._id, !blocking, reason || undefined), { success: blocking ? 'Account blocked' : 'Account unblocked' }).then((u) => { setOpen(false); onDone?.(u); }).catch(() => {})}
      />
    </>
  );
}

// Uploaded documents (CNIC, licence, …) arrive as plain Cloudinary links.
export function DocumentList({ documents = [] }) {
  if (!documents.length) return <EmptyState icon={FileText} title="No documents uploaded" description="Documents appear here once they are uploaded from the app." />;
  return (
    <div className="doc-list">
      {documents.map((url, i) => (
        <a key={url} className="doc" href={fileUrl(url)} target="_blank" rel="noreferrer">
          <FileText size={16} />
          <span>Document {i + 1}{/\.pdf(\?|$)/i.test(url) ? ' (PDF)' : ''}</span>
          <ExternalLink size={14} className="muted" />
        </a>
      ))}
    </div>
  );
}

// From / to date filter. Values are YYYY-MM-DD strings; `to` is inclusive on the server.
export function DateRange({ from, to, onChange }) {
  return (
    <div className="date-range">
      <CalendarDays size={16} className="muted" />
      <input type="date" className="input" value={from || ''} max={to || undefined} onChange={(e) => onChange({ from: e.target.value, to })} aria-label="From date" />
      <span className="muted">→</span>
      <input type="date" className="input" value={to || ''} min={from || undefined} onChange={(e) => onChange({ from, to: e.target.value })} aria-label="To date" />
      {(from || to) && <IconButton icon={X} label="Clear dates" onClick={() => onChange({ from: '', to: '' })} />}
    </div>
  );
}

// Card refunds are manual (POST /api/payments/refund/:orderId). Leave the amount
// empty to refund what the server suggests (refundDue, else the whole payment).
export function RefundButton({ order, maxAmount, onDone, size, variant = 'secondary' }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [run, pending] = useAction();
  const suggested = order.refundDue > 0 ? order.refundDue : maxAmount ?? order.totalAmount;
  const submit = () => run(() => paymentsApi.refund(order.orderId || order._id, amount || undefined), { success: `Refund of ${money(amount || suggested)} processed` })
    .then((payment) => { setOpen(false); setAmount(''); onDone?.(payment); })
    .catch(() => {});
  return (
    <>
      <Button size={size} variant={variant} icon={Undo2} onClick={() => setOpen(true)}>Refund now</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Refund card payment"
        description="The money goes back to the customer's card through Stripe and they get a notification. Each payment can be refunded once."
        icon={Undo2}
        size="sm"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={pending} onClick={submit}>Refund {money(amount || suggested)}</Button></>}
      >
        <Field label="Amount (PKR)" hint={`Leave empty to refund ${money(suggested)}${order.refundDue > 0 ? ' (products only, delivery fee kept)' : ''}.`}>
          {(id) => <Input id={id} type="number" min="1" max={maxAmount ?? order.totalAmount} prefix="Rs." value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(suggested)} />}
        </Field>
      </Modal>
    </>
  );
}
