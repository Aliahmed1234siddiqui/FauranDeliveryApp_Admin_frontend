import { NavLink } from "react-router-dom";
import { X, LayoutDashboard, PackageSearch, Store, Bike, Users, BarChart3, Settings, Zap } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: PackageSearch },
  { to: "/vendors", label: "Vendors", icon: Store },
  { to: "/riders", label: "Riders", icon: Bike },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function MobileSidebar({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <aside className="relative flex h-full w-64 flex-col bg-brand-dark text-white">
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-brand-darker">
              <Zap size={18} fill="currentColor" />
            </div>
            <p className="font-semibold">Furan</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  isActive ? "bg-white/10 font-medium text-white" : "text-white/60 hover:bg-white/5"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}
