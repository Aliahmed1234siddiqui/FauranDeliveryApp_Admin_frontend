import { useCallback, useRef, useState } from 'react';
import { Banknote, Bell, Boxes, ChevronRight, Eye, LogOut, Menu as MenuIcon, Moon, RotateCcw, Search, Store, Sun, UserRound } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useApi, useClickOutside } from '../lib/hooks';
import { timeAgo } from '../lib/format';
import { adminApi } from '../services/adminApi';
import { Avatar } from '../ui/primitives';
import { Menu } from '../ui/overlays';
import { employees } from '../data/mockDb';

const NOTIF_ICON = { vendor: [Store, 'tone-amber'], inventory: [Boxes, 'tone-danger'], order: [RotateCcw, 'tone-blue'], payments: [Banknote, 'tone-violet'] };

function Notifications() {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const { navigate } = useRouter();
  const { data = [] } = useApi(() => adminApi.getNotifications(), []);

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="icon-btn" aria-label="Notifications" onClick={() => { setOpen((o) => !o); setSeen(true); }}>
        <Bell size={18} />
        {!seen && data?.length > 0 && <span className="notif-dot" />}
      </button>
      {open && (
        <div className="popover">
          <div className="popover-head">
            <strong>Needs your attention</strong>
            <span className="badge badge-neutral">{data?.length || 0}</span>
          </div>
          {(data || []).map((n) => {
            const [Icon, tone] = NOTIF_ICON[n.kind] || [Bell, 'tone-brand'];
            return (
              <button type="button" key={n.id} className="notif" onClick={() => { setOpen(false); navigate(n.path); }}>
                <span className={`notif-icon ${tone}`}><Icon size={16} /></span>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.detail}</p>
                  <time>{timeAgo(n.at)}</time>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Topbar({ crumbs, onMenu, onOpenSearch, theme, onToggleTheme }) {
  const { admin, logout, previewAs, setPreviewAs } = useAuth();
  const { navigate } = useRouter();

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar-menu" aria-label="Open navigation" onClick={onMenu}><MenuIcon size={20} /></button>
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          i === crumbs.length - 1
            ? <strong key={c.label}>{c.label}</strong>
            : <span key={c.label} className="row" style={{ gap: 6 }}>{c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}<ChevronRight size={14} /></span>
        ))}
      </nav>

      <div className="topbar-actions">
        <button type="button" className="topbar-search" onClick={onOpenSearch}>
          <Search size={15} /><span>Search pages & actions</span><kbd>Ctrl K</kbd>
        </button>
        <button type="button" className="icon-btn" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Notifications />
        <Menu
          trigger={({ toggle }) => (
            <button type="button" className="user-chip" onClick={toggle} aria-label="Account menu">
              <Avatar name={admin?.name} size="sm" tone="brand" />
              <span className="user-chip-copy">
                <strong>{admin?.name}</strong>
                <small>{previewAs ? `Previewing ${previewAs.name.split(' ')[0]}` : admin?.isSuperAdmin ? 'Super admin' : admin?.designation}</small>
              </span>
            </button>
          )}
          items={[
            { label: 'My profile & access', icon: UserRound, onClick: () => navigate('/profile') },
            ...(admin?.isSuperAdmin ? ['divider', ...employees.filter((e) => e.isActive).slice(0, 4).map((e) => ({ label: `Preview as ${e.name.split(' ')[0]} (${e.designation})`, icon: Eye, onClick: () => { setPreviewAs(e); navigate('/'); } }))] : []),
            previewAs && { label: 'Stop preview', icon: RotateCcw, onClick: () => setPreviewAs(null) },
            'divider',
            { label: 'Log out', icon: LogOut, tone: 'danger', onClick: logout },
          ]}
        />
      </div>
    </header>
  );
}
