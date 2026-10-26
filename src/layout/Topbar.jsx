import { useCallback, useRef, useState } from 'react';
import { AlertTriangle, Bell, Bike, CheckCheck, ChevronRight, Copy, Eye, LogOut, Menu as MenuIcon, Moon, RotateCcw, Search, Store, Sun, UserRound } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { useApi, useClickOutside } from '../lib/hooks';
import { timeAgo } from '../lib/format';
import { employeesApi, notificationsApi } from '../services/api';
import { useSocketEvent } from '../services/socket';
import { Avatar } from '../ui/primitives';
import { copyText } from '../lib/clipboard';
import { Menu } from '../ui/overlays';

// Admin alerts sent today (handbook 18): vendor/rider documents uploaded,
// rider search failed, delivery failed. Pick an icon and a page for each.
function describe(n) {
  const text = `${n.title} ${n.message}`.toLowerCase();
  const orderId = n.data?.orderId;
  if (text.includes('vendor')) return { icon: Store, tone: 'tone-amber', to: n.data?.vendorId ? `/vendors/${n.data.vendorId}` : '/vendors?status=pending' };
  if (text.includes('rider document')) return { icon: Bike, tone: 'tone-blue', to: n.data?.riderId ? `/riders/${n.data.riderId}` : '/riders?status=pending' };
  if (text.includes('delivery') || text.includes('rider search')) return { icon: AlertTriangle, tone: 'tone-danger', to: orderId ? `/orders/${orderId}` : '/orders?status=delivery_failed' };
  return { icon: Bell, tone: 'tone-brand', to: orderId ? `/orders/${orderId}` : null };
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const { navigate } = useRouter();
  const { data, setData } = useApi(() => notificationsApi.list({ limit: 15 }), [], { key: 'notifications' });
  const list = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  // New alerts arrive over the socket; put them on top and bump the counter.
  useSocketEvent('notification:new', (n) => setData((d) => ({
    ...d,
    notifications: [n, ...(d?.notifications || [])].slice(0, 15),
    unreadCount: (d?.unreadCount || 0) + 1,
  })));

  const markRead = (n) => {
    if (n.isRead) return;
    setData((d) => ({ ...d, unreadCount: Math.max(0, d.unreadCount - 1), notifications: d.notifications.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)) }));
    notificationsApi.markRead(n._id).catch(() => {});
  };
  const markAll = () => {
    setData((d) => ({ ...d, unreadCount: 0, notifications: d.notifications.map((x) => ({ ...x, isRead: true })) }));
    notificationsApi.markAllRead().catch(() => {});
  };

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="icon-btn" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`} onClick={() => setOpen((o) => !o)}>
        <Bell size={18} />
        {unread > 0 && <span className="notif-dot" />}
      </button>
      {open && (
        <div className="popover">
          <div className="popover-head">
            <strong>Notifications</strong>
            {unread > 0
              ? <button type="button" className="link-btn row" style={{ gap: 4 }} onClick={markAll}><CheckCheck size={14} /> Mark all read</button>
              : <span className="badge badge-neutral">{list.length}</span>}
          </div>
          {list.length === 0 && <div className="empty"><strong>You&apos;re all caught up</strong><p>New alerts show up here as they happen.</p></div>}
          {list.map((n) => {
            const { icon: Icon, tone, to } = describe(n);
            return (
              <button type="button" key={n._id} className="notif" style={n.isRead ? { opacity: 0.65 } : undefined} onClick={() => { markRead(n); setOpen(false); if (to) navigate(to); }}>
                <span className={`notif-icon ${tone}`}><Icon size={16} /></span>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.message}</p>
                  <time>{timeAgo(n.createdAt)}</time>
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
  const myId = admin?.adminId || admin?.employeeId; // ADM… or EMP…
  const { navigate } = useRouter();
  // Super admins can preview the portal as one of their active employees.
  const team = useApi(() => (admin?.isSuperAdmin ? employeesApi.list({ status: 'active', limit: 5 }) : Promise.resolve(null)), [admin?._id], { key: 'team-preview' });
  const previewable = team.data?.items || [];

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
              <Avatar name={admin?.name} src={admin?.profileImage || undefined} size="sm" tone="brand" />
              <span className="user-chip-copy">
                <strong>{admin?.name}</strong>
                <small>{previewAs ? `Previewing ${previewAs.name.split(' ')[0]}` : admin?.isSuperAdmin ? 'Super admin' : admin?.designation || 'Employee'}</small>
              </span>
            </button>
          )}
          items={[
            myId && { label: `My id: ${myId}`, icon: Copy, onClick: () => copyText(myId) },
            { label: 'My profile & access', icon: UserRound, onClick: () => navigate('/profile') },
            ...(previewable.length ? ['divider', ...previewable.map((e) => ({ label: `Preview as ${e.name.split(' ')[0]}${e.designation ? ` (${e.designation})` : ''}`, icon: Eye, onClick: () => { setPreviewAs(e); navigate('/'); } }))] : []),
            previewAs && { label: 'Stop preview', icon: RotateCcw, onClick: () => setPreviewAs(null) },
            'divider',
            { label: 'Log out', icon: LogOut, tone: 'danger', onClick: logout },
          ]}
        />
      </div>
    </header>
  );
}
