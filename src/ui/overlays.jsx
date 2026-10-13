import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, MoreHorizontal, X } from 'lucide-react';
import { Button } from './primitives';
import { useClickOutside } from '../lib/hooks';

function useLockScroll(open) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}

function useEscape(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const key = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, description, icon: Icon, tone = 'brand', size = 'md', children, footer }) {
  useLockScroll(open);
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={onClose}>
      <div className={`modal modal-${size}`} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header className="modal-head">
          {Icon && <span className={`modal-icon tone-${tone}`}><Icon size={20} /></span>}
          <div className="modal-titles">
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 520, headerExtra }) {
  useLockScroll(open);
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="overlay overlay-drawer" onMouseDown={onClose}>
      <aside className="drawer" style={{ '--drawer-w': `${width}px` }} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {headerExtra}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}

// Confirmation dialog for destructive or irreversible actions. Optionally
// collects a reason (cancel order, reject vendor…) before confirming.
export function ConfirmDialog(props) {
  // Mounting only while open gives every opening a fresh, empty reason box.
  return props.open ? <ConfirmBody {...props} /> : null;
}

function ConfirmBody({ onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'danger', icon = AlertTriangle, reason, reasonLabel = 'Reason', reasonPlaceholder, reasonRequired, loading }) {
  const [text, setText] = useState('');
  const disabled = reasonRequired && !text.trim();
  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      tone={tone}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading} disabled={disabled} onClick={() => onConfirm(text.trim())}>{confirmLabel}</Button>
        </>
      )}
    >
      {reason && (
        <div className="field">
          <label className="field-label">{reasonLabel}{reasonRequired && <span className="req">*</span>}</label>
          <textarea className="input textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={reasonPlaceholder} autoFocus />
        </div>
      )}
    </Modal>
  );
}

// Small anchored action menu (row actions, user menu).
export function Menu({ items, trigger, align = 'right', label = 'More actions' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  return (
    <div className="menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      {trigger ? trigger({ open, toggle: () => setOpen((o) => !o) }) : (
        <button type="button" className="icon-btn" aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <MoreHorizontal size={17} />
        </button>
      )}
      {open && (
        <div className={`menu-pop menu-${align}`} role="menu">
          {items.filter(Boolean).map((item, i) => (item === 'divider' ? <hr key={`d${i}`} /> : (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={item.tone === 'danger' ? 'is-danger' : ''}
              disabled={item.disabled}
              onClick={() => { setOpen(false); item.onClick(); }}
            >
              {item.icon && <item.icon size={15} />}
              <span>{item.label}</span>
              {item.hint && <kbd>{item.hint}</kbd>}
            </button>
          )))}
        </div>
      )}
    </div>
  );
}
