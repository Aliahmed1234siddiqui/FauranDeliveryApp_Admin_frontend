import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Banknote, CornerDownLeft, PackagePlus, Search, Store, UserPlus } from 'lucide-react';

import { NAV_ITEMS } from '@/components/layout/nav-config';
import { useAuth } from '@/context';
import { paths, useRouter } from '@/router';

const ACTIONS = [
  {
    label: 'Review pending vendors',
    to: paths.vendors({ status: 'pending' }),
    icon: Store,
    perm: ['vendors'],
  },
  { label: 'Add a product', to: paths.products({ new: 1 }), icon: PackagePlus, perm: ['products'] },
  {
    label: 'Record rider cash deposit',
    to: paths.payouts({ tab: 'riders', deposit: 1 }),
    icon: Banknote,
    perm: ['payments'],
  },
  { label: 'Add an employee', to: paths.employees({ new: 1 }), icon: UserPlus, perm: ['employees'] },
];

export function CommandPalette({ open, onClose }) {
  return open ? <Palette onClose={onClose} /> : null;
}

function Palette({ onClose }) {
  const [q, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const { navigate } = useRouter();
  const { can } = useAuth();
  const setQ = (value) => {
    setQuery(value);
    setActive(0);
  };

  const results = useMemo(() => {
    const term = q.toLowerCase().trim();
    const pages = NAV_ITEMS.filter((i) => can(i.perm)).map((i) => ({ ...i, kind: 'Pages' }));
    const actions = ACTIONS.filter((a) => can(a.perm)).map((a) => ({ ...a, kind: 'Quick actions' }));
    return [...pages, ...actions].filter(
      (r) => !term || `${r.label} ${r.group || ''}`.toLowerCase().includes(term),
    );
  }, [q, can]);

  const go = (r) => {
    onClose();
    navigate(r.to);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    }
    if (e.key === 'Enter' && results[active]) go(results[active]);
    if (e.key === 'Escape') onClose();
  };

  let lastKind = null;
  return createPortal(
    <div className="overlay cmdk-overlay" onMouseDown={onClose}>
      <div
        className="cmdk"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="cmdk-input">
          <Search size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search pages and actions…"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="cmdk-list">
          {results.length === 0 && (
            <div className="empty">
              <strong>No matches</strong>
              <p>Try “orders”, “payouts” or “employees”.</p>
            </div>
          )}
          {results.map((r, i) => {
            const header =
              r.kind !== lastKind ? (
                <div className="cmdk-group" key={`g-${r.kind}`}>
                  {r.kind}
                </div>
              ) : null;
            lastKind = r.kind;
            const Icon = r.icon;
            return [
              header,
              <button
                key={r.to + r.label}
                type="button"
                className={`cmdk-item ${i === active ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
              >
                <Icon size={17} />
                {r.label}
                <small>{r.group || <ArrowRight size={14} />}</small>
              </button>,
            ];
          })}
        </div>
        <div className="cmdk-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>
              <CornerDownLeft size={10} />
            </kbd>{' '}
            to open
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
