import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { useEscape, useLockScroll } from './use-overlay-behavior';

export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  tone = 'brand',
  size = 'md',
  children,
  footer,
}) {
  useLockScroll(open);
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="overlay" onMouseDown={onClose}>
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          {Icon && (
            <span className={`modal-icon tone-${tone}`}>
              <Icon size={20} />
            </span>
          )}
          <div className="modal-titles">
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
