import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, FolderKanban, CalendarDays, Image as ImageIcon, Users, HandCoins, MessageSquare, Settings, LogOut, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const adminLinks = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Projects', path: '/admin/projects', icon: FolderKanban },
  { name: 'Events', path: '/admin/events', icon: CalendarDays },
  { name: 'Gallery', path: '/admin/gallery', icon: ImageIcon },
  { name: 'Volunteers', path: '/admin/volunteers', icon: Users },
  { name: 'Donations', path: '/admin/donations', icon: HandCoins },
  { name: 'Messages', path: '/admin/messages', icon: MessageSquare },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white/40 dark:bg-zinc-950/45 backdrop-blur-[2px] flex flex-col md:flex-row pt-20 transition-colors">
      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2 overflow-x-auto flex items-center gap-2 sticky top-20 z-30 shadow-xs">
        {adminLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100/90 dark:bg-zinc-800/90'
              )}
            >
              <Icon size={14} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border-r border-zinc-200/80 dark:border-zinc-800/80 hidden md:flex flex-col fixed inset-y-0 pt-20 z-40 transition-colors shadow-sm">
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="px-3 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Admin Navigation
            </span>
          </div>

          <nav className="space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all',
                    isActive 
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-semibold shadow-xs' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-50'
                  )}
                >
                  <Icon size={18} className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-zinc-400 dark:text-zinc-500'} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/60">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-white/90 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/80 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-fuchsia-600 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shadow-xs">
              <Shield size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {user?.displayName || 'Administrator'}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                {user?.email || 'admin@heafoundation.org'}
              </p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200/60 dark:border-red-900/50 rounded-xl w-full transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
