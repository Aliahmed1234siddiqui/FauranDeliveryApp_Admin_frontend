import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import { useEscape, useLockScroll } from './use-overlay-behavior';

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 520, headerExtra }) {
  useLockScroll(open);
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="overlay overlay-drawer" onMouseDown={onClose}>
      <aside
        className="drawer"
        style={{ '--drawer-w': `${width}px` }}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          {headerExtra}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer && <footer className="drawer-foot">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
