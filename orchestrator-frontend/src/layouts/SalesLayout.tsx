/**
 * SalesLayout — unified text-first shell for the Sales portal.
 *
 * Canonical nav entries (no icons, no emojis, no orchestrator branding):
 *  Dashboard, Dealers, Orders, Credit, Promotions, Targets
 */

import { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { ProfileMenu } from '@/components/ui/ProfileMenu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { MobileSidebar } from '@/components/ui/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { resolvePortalAccess, shouldShowHub, isModuleEnabled } from '@/lib/portal-routing';
import { useBreadcrumbs } from './useBreadcrumbs';
import { AdminCompanySwitcher } from '@/components/CompanySwitcher';
import { CommandPaletteButton } from '@/components/CommandPalette';

interface NavItem {
  label: string;
  to: string;
  end?: boolean;
  /** Optional module key — item is hidden if this module is disabled */
  module?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/sales', end: true },
  { label: 'Dealers', to: '/sales/dealers' },
  { label: 'Orders', to: '/sales/orders' },
  { label: 'Credit', to: '/sales/credit' },
  { label: 'Promotions', to: '/sales/promotions' },
  { label: 'Targets', to: '/sales/targets' },
];

const ROUTE_LABELS: Record<string, string> = {
  '/sales': 'Dashboard',
  '/sales/dealers': 'Dealers',
  '/sales/orders': 'Orders',
  '/sales/credit': 'Credit',
  '/sales/promotions': 'Promotions',
  '/sales/targets': 'Targets',
  new: 'New',
  edit: 'Edit',
};

function SidebarContent({
  showBackToHub,
  enabledModules,
  onNavClick,
}: {
  showBackToHub: boolean;
  enabledModules: string[];
  onNavClick?: () => void;
}) {
  const navigate = useNavigate();

  // Filter out nav items whose module is disabled
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.module || isModuleEnabled(enabledModules, item.module)
  );
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5 border-b border-[var(--color-border-subtle)]">
        <p className="text-[13px] font-semibold tracking-tight text-[var(--color-text-primary)]">
          Sales
        </p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar" aria-label="Sales navigation">
        {showBackToHub && (
          <button
            type="button"
            onClick={() => {
              onNavClick?.();
              navigate('/hub');
            }}
            className="w-full flex items-center gap-2.5 px-3 h-11 sm:h-8 rounded-lg text-[13px] font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors mb-3"
          >
            All portals
          </button>
        )}

        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavClick}
            className={({ isActive }) =>
              clsx(
                'flex items-center px-3 h-11 sm:h-8 rounded-lg text-[13px] font-medium transition-colors duration-100',
                isActive
                 ? 'bg-[var(--color-neutral-900)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function SalesLayout() {
  const { user, signOut, enabledModules } = useAuth();
  const { toggle, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const access = useMemo(() => resolvePortalAccess(user), [user]);
  const showBackToHub = useMemo(() => shouldShowHub(access), [access]);

  const breadcrumbs = useBreadcrumbs('/sales', 'Sales', ROUTE_LABELS);

  // Close mobile drawer on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)]">
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
        <SidebarContent showBackToHub={showBackToHub} enabledModules={enabledModules} />
      </aside>

      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
        <div className="flex flex-col w-[min(280px,80vw)] h-full bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)]">
          <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border-subtle)]">
            <p className="text-[13px] font-semibold tracking-tight text-[var(--color-text-primary)]">
              Sales
            </p>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="px-2.5 py-1 rounded-md text-[12px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
              aria-label="Close menu"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarContent
              showBackToHub={showBackToHub}
              enabledModules={enabledModules}
              onNavClick={() => setMobileOpen(false)}
            />
          </div>
        </div>
      </MobileSidebar>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="shrink-0 h-12 flex items-center justify-between px-4 gap-3 bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden px-2.5 py-1 rounded-md text-[12px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
              aria-label="Open menu"
            >
              Menu
            </button>
            <Breadcrumb items={breadcrumbs} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Command palette button */}
            <CommandPaletteButton />

            {/* Company switcher — hidden on mobile to reduce header crowding */}
            <span className="hidden sm:block">
              <AdminCompanySwitcher />
            </span>

            <button
              type="button"
              onClick={toggle}
              className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? 'Light' : 'Dark'}
            </button>

            {user && (
              <ProfileMenu
                user={{
                  displayName: user.displayName,
                  email: user.email,
                  role: user.roles[0] ?? '',
                }}
                onLogout={signOut}
                onProfile={() => navigate('/profile')}
              />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
