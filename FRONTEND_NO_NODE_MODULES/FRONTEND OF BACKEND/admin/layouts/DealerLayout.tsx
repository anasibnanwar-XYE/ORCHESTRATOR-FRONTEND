import React, { useEffect, Fragment, useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  Menu as MenuIcon,
  X,
  Search,
  Moon,
  Sun,
  ChevronLeft,
  HelpCircle
} from 'lucide-react';
import TutorialGuide from '../components/TutorialGuide';
import { getStepsForPath } from '../lib/tutorialSteps';
import UserMenuDropdown from '../components/layout/UserMenuDropdown';
import SidebarUserFooter from '../components/layout/SidebarUserFooter';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { resolvePortalAccess, shouldShowPortalSelection } from '../types/portal-routing';

interface DealerLayoutProps {
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}

function CommandPalette({ open, onClose, closeMobileNav = undefined }: { open: boolean; onClose: () => void; closeMobileNav?: () => void }) {
  const navigate = useNavigate();
  const items = useMemo(
    () => [
      { label: 'Dashboard', to: '/dealer' },
      { label: 'My Orders', to: '/dealer/orders' },
      { label: 'Invoices', to: '/dealer/invoices' },
      { label: 'Ledger', to: '/dealer/ledger' },
      { label: 'Aging', to: '/dealer/aging' },
      { label: 'Credit Requests', to: '/dealer/credit-requests' },
      { label: 'Promotions', to: '/dealer/promotions' },
      { label: 'Profile', to: '/dealer/profile' },
    ],
    []
  );
  const [q, setQ] = useState('');
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));

  const handleClick = (to: string) => {
    closeMobileNav?.();
    navigate(to);
    onClose();
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-start justify-center p-6 pt-20">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-4" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-4">
            <Dialog.Panel className="w-full max-w-xl rounded-xl border border-border bg-surface p-2 text-primary shadow-2xl">
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
                        handleClick(target.to);
                      }
                    }
                  }}
                />
              </div>
              <ul className="mt-2 max-h-64 overflow-y-auto py-1">
                {filtered.map((item) => (
                  <li key={item.to}>
                    <button
                      type="button"
                      onClick={() => handleClick(item.to)}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-highlight"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && <li className="px-3 py-2 text-sm text-secondary">No results</li>}
              </ul>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function DealerLayout({ theme, onThemeChange }: DealerLayoutProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const portalAccess = useMemo(() => resolvePortalAccess(user), [user]);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const tutorialSteps = useMemo(() => getStepsForPath(location.pathname), [location.pathname]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(true);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    // Close palette on route change
    setPaletteOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Dashboard', to: '/dealer' },
    { name: 'My Orders', to: '/dealer/orders' },
    { name: 'Invoices', to: '/dealer/invoices' },
    { name: 'Ledger', to: '/dealer/ledger' },
    { name: 'Aging', to: '/dealer/aging' },
    { name: 'Credit Requests', to: '/dealer/credit-requests' },
    { name: 'Promotions', to: '/dealer/promotions' },
    { name: 'Profile', to: '/dealer/profile' },
  ];

  return (
    <div className="h-screen overflow-hidden bg-background text-primary">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} closeMobileNav={() => setMobileOpen(false)} />
      <div className="flex h-full">
        {/* Sidebar */}
        <aside className={clsx(
          'fixed inset-y-0 left-0 z-40 w-72 transform border-r border-border bg-surface transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-border">
              <span className="text-lg font-semibold tracking-tight text-primary">Dealer Portal</span>
              <button
                type="button"
                className="md:hidden text-secondary hover:text-primary transition-colors"
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
                    end={item.to === '/dealer'}
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
              displayName={user?.displayName ?? 'User'}
              email={user?.email ?? ''}
            />
          </div>
        </aside>

        {/* Mobile overlay - closes when clicking backdrop or sidebar */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 py-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-border bg-surface p-2 text-secondary hover:bg-surface-highlight md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setPaletteOpen(true); setMobileOpen(false); }}
                className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-secondary hover:bg-surface-highlight"
                title="Search (Ctrl+K)"
              >
                <Search className="h-4 w-4" />
                <span className="text-xs">Search...</span>
                <kbd className="rounded bg-surface-highlight px-1.5 py-0.5 text-[10px] font-medium text-secondary">⌘K</kbd>
              </button>
              <button
                type="button"
                onClick={() => { setPaletteOpen(true); setMobileOpen(false); }}
                className="md:hidden rounded-lg p-2 text-secondary hover:bg-surface-highlight"
                title="Search (Ctrl+K)"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-lg p-2 text-secondary hover:bg-surface-highlight transition-colors"
                title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                className="rounded-lg p-2 text-secondary hover:bg-surface-highlight transition-colors"
                title="Start Tutorial"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <div className="h-6 w-px bg-border mx-1" />
              <UserMenuDropdown
                displayName={user?.displayName ?? 'User'}
                email={user?.email ?? ''}
                profilePath="/dealer/profile"
                onSignOut={signOut}
              />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="mx-auto max-w-lg sm:max-w-2xl lg:max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Tutorial Guide */}
      <TutorialGuide
        steps={tutorialSteps}
        enabled={tutorialOpen}
        onExit={() => setTutorialOpen(false)}
      />
    </div>
  );
}
