import {
  ChevronRight,
  Eye,
  LogOut,
  Menu as MenuIcon,
  Moon,
  RotateCcw,
  Search,
  Sun,
  UserRound,
} from 'lucide-react';

import { Menu } from '@/components/overlays';
import { Avatar } from '@/components/ui';
import { useAuth } from '@/context';
import { useApi } from '@/hooks';
import { Link, paths, useRouter } from '@/router';
import { employeesApi } from '@/services/api';

import { Notifications } from './notifications-menu';

export function Topbar({ crumbs, onMenu, onOpenSearch, theme, onToggleTheme }) {
  const { admin, logout, previewAs, setPreviewAs } = useAuth();
  const { navigate } = useRouter();
  // Super admins can preview the portal as one of their active employees.
  const team = useApi(
    () => (admin?.isSuperAdmin ? employeesApi.list({ status: 'active', limit: 5 }) : Promise.resolve(null)),
    [admin?._id],
    { key: 'team-preview' },
  );
  const previewable = team.data?.items || [];

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar-menu" aria-label="Open navigation" onClick={onMenu}>
        <MenuIcon size={20} />
      </button>
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) =>
          i === crumbs.length - 1 ? (
            <strong key={c.label}>{c.label}</strong>
          ) : (
            <span key={c.label} className="row" style={{ gap: 6 }}>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
              <ChevronRight size={14} />
            </span>
          ),
        )}
      </nav>

      <div className="topbar-actions">
        <button type="button" className="topbar-search" onClick={onOpenSearch}>
          <Search size={15} />
          <span>Search pages & actions</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          onClick={onToggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Notifications />
        <Menu
          trigger={({ toggle }) => (
            <button type="button" className="user-chip" onClick={toggle} aria-label="Account menu">
              <Avatar name={admin?.name} src={admin?.profileImage || undefined} size="sm" tone="brand" />
              <span className="user-chip-copy">
                <strong>{admin?.name}</strong>
                <small>
                  {previewAs
                    ? `Previewing ${previewAs.name.split(' ')[0]}`
                    : admin?.isSuperAdmin
                      ? 'Super admin'
                      : admin?.designation || 'Employee'}
                </small>
              </span>
            </button>
          )}
          items={[
            { label: 'My profile & access', icon: UserRound, onClick: () => navigate(paths.profile()) },
            ...(previewable.length
              ? [
                  'divider',
                  ...previewable.map((e) => ({
                    label: `Preview as ${e.name.split(' ')[0]}${e.designation ? ` (${e.designation})` : ''}`,
                    icon: Eye,
                    onClick: () => {
                      setPreviewAs(e);
                      navigate(paths.dashboard());
                    },
                  })),
                ]
              : []),
            previewAs && { label: 'Stop preview', icon: RotateCcw, onClick: () => setPreviewAs(null) },
            'divider',
            { label: 'Log out', icon: LogOut, tone: 'danger', onClick: logout },
          ]}
        />
      </div>
    </header>
  );
}
