import { Search, Zap } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { USE_MOCK } from '../services/adminApi';
import { NAV, isActivePath } from './nav';

export default function Sidebar({ badges = {}, onNavigate, onOpenSearch }) {
  const { pathname } = useRouter();
  const { can } = useAuth();

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">
        <span className="logo-mark"><Zap size={19} fill="currentColor" /></span>
        <div className="logo-text">
          <strong>Fauran</strong>
          <small>Admin portal</small>
        </div>
      </div>

      <button type="button" className="sidebar-search" onClick={onOpenSearch}>
        <Search size={15} /> Jump to… <kbd>Ctrl K</kbd>
      </button>

      <nav className="sidebar-nav">
        {NAV.map((group) => {
          const items = group.items.filter((i) => can(i.perm));
          if (!items.length) return null;
          return (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {items.map(({ to, label, icon: Icon, badge, live }) => (
                <Link key={to} to={to} className={`nav-link ${isActivePath(to, pathname) ? 'is-active' : ''}`} onClick={onNavigate}>
                  <Icon size={18} />
                  <span>{label}</span>
                  {badge && badges[badge] > 0 && <span className="nav-badge" title="Waiting for approval">{badges[badge]}</span>}
                  {live && <span className="nav-live" title="Live" />}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-foot">
        <div className={`env-pill ${USE_MOCK ? '' : 'is-live'}`}>
          <i />
          <span>{USE_MOCK ? 'Demo data' : 'Live API'}</span>
          <small>{USE_MOCK ? 'mock mode' : '/api/admin'}</small>
        </div>
      </div>
    </aside>
  );
}
