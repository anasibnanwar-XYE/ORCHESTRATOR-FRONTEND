import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  X,
  Search,
  Moon,
  Sun,
  ChevronLeft,
  Shield,
} from 'lucide-react';
import UserMenuDropdown from '../components/layout/UserMenuDropdown';
import SidebarUserFooter from '../components/layout/SidebarUserFooter';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { resolvePortalAccess, shouldShowPortalSelection } from '../types/portal-routing';

interface SuperadminLayoutProps {
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const items = useMemo(
    () => [
      { label: 'Dashboard', to: '/superadmin' },
      { label: 'Tenants', to: '/superadmin/tenants' },
      { label: 'Platform Roles', to: '/superadmin/roles' },
      { label: 'Audit Trail', to: '/superadmin/audit' },
    ],
    []
  );
  const [q, setQ] = useState('');
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
      <div className="fixed inset-0 flex items-start justify-center p-6 pt-20">
        <div
          className="w-full max-w-xl rounded-xl border border-border bg-surface p-2 text-primary shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-secondary" />
            <input
              autoFocus
              className="h-8 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
              placeholder="Type to jump..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const target = filtered[0];
                  if (target) {
                    navigate(target.to);
                    onClose();
                  }
                }
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
            />
          </div>
          <ul className="mt-2 max-h-64 overflow-y-auto py-1">
            {filtered.map((item) => (
              <li key={item.to}>
                <button
                  type="button"
                  onClick={() => {
                    navigate(item.to);
                    onClose();
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-primary hover:bg-surface-highlight"
                >
                  {item.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-3 py-2 text-sm text-secondary">No results</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function SuperadminLayout({ theme, onThemeChange }: SuperadminLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const portalAccess = useMemo(() => resolvePortalAccess(user), [user]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navigation = [
    { name: 'Dashboard', to: '/superadmin', end: true },
    { name: 'Tenants', to: '/superadmin/tenants' },
    { name: 'Platform Roles', to: '/superadmin/roles' },
    { name: 'Audit Trail', to: '/superadmin/audit' },
  ];

  return (
    <div className={clsx('h-screen overflow-hidden bg-background text-primary', theme === 'dark' ? 'dark' : '')}>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <div className="flex h-full">
        {/* Mobile sidebar backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border bg-surface transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-status-error-text" />
                <span className="text-lg font-semibold tracking-tight text-primary">Control Plane</span>
              </div>
              <button
                type="button"
                className="lg:hidden text-secondary hover:text-primary transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
              {shouldShowPortalSelection(portalAccess) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      navigate('/portals');
                    }}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition hover:bg-surface-highlight hover:text-primary"
                  >
                    <ChevronLeft className="h-4 w-4 text-tertiary group-hover:text-secondary" />
                    Back to Portals
                  </button>
                  <div className="my-4 h-px bg-border" />
                </>
              )}
              <div className="space-y-0.5">
                {navigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={'end' in item ? item.end : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => clsx(
                      'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-surface-highlight text-primary shadow-sm ring-1 ring-border'
                        : 'text-secondary hover:bg-surface-highlight/50 hover:text-primary'
                    )}
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </nav>

            {/* User Info Footer */}
            <SidebarUserFooter
              displayName={user?.displayName ?? 'Platform'}
              email={user?.email ?? ''}
            />
          </div>
        </aside>

        {/* Content */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <header className={clsx('sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-4 backdrop-blur-md border-border bg-surface/80')}>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-secondary hover:bg-surface-highlight lg:hidden" aria-label="Open navigation">
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className={clsx('hidden rounded-lg border px-4 py-2 text-sm transition md:flex md:items-center md:gap-2',
                  'border-border bg-surface text-secondary hover:bg-surface-highlight'
                )}
                title="Command palette (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span className="text-xs">Search...</span>
                <kbd className="rounded bg-surface-highlight px-1.5 py-0.5 text-[10px] font-medium text-secondary">⌘K</kbd>
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className={clsx('rounded-lg p-2 transition-colors md:hidden', 'text-secondary hover:bg-surface-highlight')}
                title="Command palette (Ctrl+K)"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                className={clsx('rounded-lg p-2 transition-colors', 'text-secondary hover:bg-surface-highlight')}
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <div className="h-6 w-px bg-border mx-1" />
              <UserMenuDropdown
                displayName={user?.displayName ?? 'Platform'}
                email={user?.email ?? ''}
                profilePath="/superadmin"
                onSignOut={signOut}
              />
            </div>
          </header>
          <main className="flex-1 overflow-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
