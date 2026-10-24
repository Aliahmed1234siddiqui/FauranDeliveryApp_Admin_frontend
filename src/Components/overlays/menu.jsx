import { useCallback, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

import { useClickOutside } from '@/hooks';

// Small anchored action menu (row actions, user menu).
export function Menu({ items, trigger, align = 'right', label = 'More actions' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  return (
    <div className="menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      {trigger ? (
        trigger({ open, toggle: () => setOpen((o) => !o) })
      ) : (
        <button
          type="button"
          className="icon-btn"
          aria-label={label}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <MoreHorizontal size={17} />
        </button>
      )}
      {open && (
        <div className={`menu-pop menu-${align}`} role="menu">
          {items.filter(Boolean).map((item, i) =>
            item === 'divider' ? (
              <hr key={`d${i}`} />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={item.tone === 'danger' ? 'is-danger' : ''}
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.icon && <item.icon size={15} />}
                <span>{item.label}</span>
                {item.hint && <kbd>{item.hint}</kbd>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
