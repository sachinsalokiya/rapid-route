import { Bell, Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Navbar({ onMenu, unread = 0 }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-steel-200 bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-ink-800 hover:bg-steel-100 lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-xs uppercase tracking-wide text-steel-500">Operations</p>
          <h1 className="font-display text-lg font-semibold text-ink-900">Command Center</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/app/notifications"
          className="relative rounded-lg p-2 text-ink-800 hover:bg-steel-100"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-accent" />
          ) : null}
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-ink-900">{user?.name}</p>
          <p className="text-xs capitalize text-steel-500">{user?.role}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          <LogOut size={14} />
          Logout
        </Button>
      </div>
    </header>
  );
}
