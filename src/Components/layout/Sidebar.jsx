import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PackageSearch,
  Store,
  Bike,
  Users,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Orders", icon: PackageSearch },
  { to: "/vendors", label: "Vendors", icon: Store },
  { to: "/riders", label: "Riders", icon: Bike },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-brand-dark text-white lg:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-brand-darker">
          <Zap size={18} fill="currentColor" />
        </div>
        <div>
          <p className="font-semibold leading-none">Furan</p>
          <p className="text-xs text-white/50">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-white/10 font-medium text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? "text-accent" : ""} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 text-xs text-white/40">Furan Delivery App &copy; {new Date().getFullYear()}</div>
    </aside>
  );
}
