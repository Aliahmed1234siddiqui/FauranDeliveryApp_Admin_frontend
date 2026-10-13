import { Bell, LogOut, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { initials } from "../../utils/formatters";

export default function Topbar({ title, onMenuClick }) {
  const { admin, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-surface-border bg-white px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button className="rounded-md p-1.5 hover:bg-surface lg:hidden" onClick={onMenuClick} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-full p-2 text-ink-muted hover:bg-surface" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-status-danger" />
        </button>

        <div className="flex items-center gap-2 border-l border-surface-border pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand">
            {initials(admin?.name || "Admin")}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none text-ink">{admin?.name}</p>
            <p className="text-xs text-ink-muted">Administrator</p>
          </div>
          <button
            onClick={logout}
            className="ml-1 rounded-md p-1.5 text-ink-muted hover:bg-surface hover:text-status-danger"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
