import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Map,
  Route,
  Radio,
  Bell,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'dispatcher', 'driver'] },
  { to: '/app/shipments', label: 'Shipments', icon: Package, roles: ['admin', 'dispatcher', 'driver'] },
  { to: '/app/vehicles', label: 'Vehicles', icon: Truck, roles: ['admin', 'dispatcher', 'driver'] },
  { to: '/app/drivers', label: 'Drivers', icon: Users, roles: ['admin', 'dispatcher'] },
  { to: '/app/map', label: 'Map', icon: Map, roles: ['admin', 'dispatcher', 'driver'] },
  { to: '/app/optimize', label: 'Optimize', icon: Route, roles: ['admin', 'dispatcher'] },
  { to: '/app/live-tracking', label: 'Live Tracking', icon: Radio, roles: ['admin', 'dispatcher', 'driver'] },
  { to: '/app/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'dispatcher', 'driver'] },
  { to: '/app/users', label: 'Users', icon: UserCog, roles: ['admin'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-steel-200 bg-ink-950 text-white transition-transform lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-xl font-bold tracking-tight">Rapid Route</p>
          <p className="mt-1 text-xs text-white/60">Logistics operations console</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {links
            .filter((l) => l.roles.includes(user?.role))
            .map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      isActive ? 'bg-signal text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon size={18} />
                  {link.label}
                </NavLink>
              );
            })}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-white/50">
          Signed in as {user?.name} · {user?.role}
        </div>
      </aside>
    </>
  );
}
