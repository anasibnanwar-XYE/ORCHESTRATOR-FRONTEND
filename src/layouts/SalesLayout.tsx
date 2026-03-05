/**
 * SalesLayout — shell for the Sales portal.
 *
 * Nav items:
 *  Dashboard, Dealers, Orders, Credit Requests, Credit Overrides,
 *  Promotions, Invoices, Sales Targets, Dispatch, Returns
 */

import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  ArrowUpCircle,
  Tag,
  FileText,
  Target,
  Truck,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { ProfileMenu } from '@/components/ui/ProfileMenu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';
import { MobileSidebar } from '@/components/ui/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { resolvePortalAccess, shouldShowHub, isModuleEnabled } from '@/lib/portal-routing';
import { useBreadcrumbs } from './useBreadcrumbs';
import { AdminCompanySwitcher } from '@/components/CompanySwitcher';
import { CommandPaletteButton } from '@/components/CommandPalette';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Optional module key — item is hidden if this module is disabled */
  module?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/sales', icon: LayoutDashboard, end: true },
  { label: 'Dealers', to: '/sales/dealers', icon: Users },
  { label: 'Orders', to: '/sales/orders', icon: ShoppingCart },
  { label: 'Credit Requests', to: '/sales/credit-requests', icon: CreditCard },
  { label: 'Credit Overrides', to: '/sales/credit-overrides', icon: ArrowUpCircle },
  { label: 'Promotions', to: '/sales/promotions', icon: Tag },
  { label: 'Invoices', to: '/sales/invoices', icon: FileText },
  { label: 'Sales Targets', to: '/sales/targets', icon: Target },
  { label: 'Dispatch', to: '/sales/dispatch', icon: Truck },
  { label: 'Returns', to: '/sales/returns', icon: RotateCcw },
];

const ROUTE_LABELS: Record<string, string> = {
  '/sales': 'Dashboard',
  '/sales/dealers': 'Dealers',
  '/sales/orders': 'Orders',
  '/sales/credit-requests': 'Credit Requests',
  '/sales/credit-overrides': 'Credit Overrides',
  '/sales/promotions': 'Promotions',
  '/sales/invoices': 'Invoices',
  '/sales/targets': 'Sales Targets',
  '/sales/dispatch': 'Dispatch',
  '/sales/returns': 'Returns',
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
        <OrchestratorLogo size={20} variant="full" />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Sales
        </p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {showBackToHub && (
          <button
            type="button"
            onClick={() => {
              onNavClick?.();
              navigate('/hub');
            }}
            className="w-full flex items-center gap-2.5 px-3 h-8 rounded-lg text-[13px] font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors mb-3"
          >
            <ChevronLeft size={14} />
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
                'flex items-center gap-2.5 px-3 h-8 rounded-lg text-[13px] font-medium transition-colors duration-100',
                isActive
                  ? 'bg-[var(--color-neutral-900)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={15}
                  className={isActive ? 'text-white/70' : 'text-[var(--color-text-tertiary)]'}
                />
                {item.label}
              </>
            )}
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

  const access = useMemo(() => resolvePortalAccess(user), [user]);
  const showBackToHub = useMemo(() => shouldShowHub(access), [access]);

  const breadcrumbs = useBreadcrumbs('/sales', 'Sales', ROUTE_LABELS);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)]">
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
        <SidebarContent showBackToHub={showBackToHub} enabledModules={enabledModules} />
      </aside>

      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
        <div className="flex flex-col w-[220px] h-full bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)]">
          <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border-subtle)]">
            <OrchestratorLogo size={18} variant="full" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
              aria-label="Close menu"
            >
              <X size={16} />
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
              className="lg:hidden p-1.5 rounded-md text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <Breadcrumb items={breadcrumbs} />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Command palette button */}
            <CommandPaletteButton />

            {/* Company switcher */}
            <AdminCompanySwitcher />

            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
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
