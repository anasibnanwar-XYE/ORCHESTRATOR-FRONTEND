/**
 * AccountingLayout — shell for the Accounting portal.
 *
 * Nav groups (per AGENTS.md workflow-first grouping):
 *  Overview:   Dashboard
 *  Core:       Journal, Dealers, Procurement, Products & Materials
 *  Controls:   Reports, Periods
 *  HR & Payroll: Employees, Payroll
 *
 * Features:
 *  - Collapsible sidebar (220px desktop, drawer on mobile < lg)
 *  - Top header: hamburger | breadcrumb | theme toggle | profile menu
 *  - ErrorBoundary wraps <Outlet />
 *  - "Back to hub" button for ROLE_ADMIN users
 */

import { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  LayoutDashboard,
  BookOpen,
  Users,
  Truck,
  Package,
  BarChart3,
  Calendar,
  UserCheck,
  Banknote,
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
import { resolvePortalAccess, shouldShowHub, MODULE_KEYS, isModuleEnabled, getModuleForPath } from '@/lib/portal-routing';
import { useBreadcrumbs } from './useBreadcrumbs';
import { AdminCompanySwitcher } from '@/components/CompanySwitcher';
import { CommandPaletteButton } from '@/components/CommandPalette';
import { ModuleNotAvailablePage } from '@/pages/ModuleNotAvailablePage';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Optional module key — item is hidden if this module is disabled */
  module?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/accounting', icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: 'Core',
    items: [
      { label: 'Journal', to: '/accounting/journal', icon: BookOpen },
      { label: 'Dealers', to: '/accounting/dealers', icon: Users },
      { label: 'Procurement', to: '/accounting/procurement', icon: Truck },
      { label: 'Products & Materials', to: '/accounting/inventory', icon: Package },
    ],
  },
  {
    title: 'HR & Payroll',
    items: [
      { label: 'Employees', to: '/accounting/employees', icon: UserCheck, module: MODULE_KEYS.HR },
      { label: 'Payroll', to: '/accounting/payroll', icon: Banknote, module: MODULE_KEYS.PAYROLL },
    ],
  },
  {
    title: 'Controls',
    items: [
      { label: 'Reports', to: '/accounting/reports', icon: BarChart3 },
      { label: 'Periods', to: '/accounting/periods', icon: Calendar },
    ],
  },
];

/**
 * Map of route path prefixes to their module keys.
 * Routes that start with these prefixes belong to gated modules.
 */
const MODULE_ROUTES: Record<string, string> = {
  '/accounting/employees': MODULE_KEYS.HR,
  '/accounting/payroll': MODULE_KEYS.PAYROLL,
};

const ROUTE_LABELS: Record<string, string> = {
  '/accounting': 'Dashboard',
  '/accounting/journal': 'Journal',
  '/accounting/dealers': 'Dealers',
  '/accounting/procurement': 'Procurement',
  '/accounting/inventory': 'Products & Materials',
  '/accounting/employees': 'Employees',
  '/accounting/payroll': 'Payroll',
  '/accounting/reports': 'Reports',
  '/accounting/periods': 'Periods',
  new: 'New',
  edit: 'Edit',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar content
// ─────────────────────────────────────────────────────────────────────────────

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

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-[var(--color-border-subtle)]">
        <OrchestratorLogo size={20} variant="full" />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Accounting
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto no-scrollbar">
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

        {NAV_GROUPS.map((group) => {
          // Filter out nav items whose module is disabled
          const visibleItems = group.items.filter(
            (item) => !item.module || isModuleEnabled(enabledModules, item.module)
          );
          // Omit group entirely if it has no visible items
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="mb-4">
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                {group.title}
              </p>
              <div className="space-y-0.5">
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
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

export function AccountingLayout() {
  const { user, signOut, enabledModules } = useAuth();
  const { toggle, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const access = useMemo(() => resolvePortalAccess(user), [user]);
  const showBackToHub = useMemo(() => shouldShowHub(access), [access]);

  const breadcrumbs = useBreadcrumbs('/accounting', 'Accounting', ROUTE_LABELS);

  // Check if current route belongs to a disabled module
  const currentModuleKey = getModuleForPath(location.pathname, MODULE_ROUTES);
  const isCurrentModuleDisabled =
    currentModuleKey !== null && !isModuleEnabled(enabledModules, currentModuleKey);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
        <SidebarContent showBackToHub={showBackToHub} enabledModules={enabledModules} />
      </aside>

      {/* Mobile Drawer */}
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

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
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
                  firstName: user.firstName,
                  lastName: user.lastName,
                  email: user.email,
                  role: user.role,
                }}
                onLogout={signOut}
                onProfile={() => navigate('/profile')}
              />
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl p-4 sm:p-6">
            <ErrorBoundary>
              {isCurrentModuleDisabled ? (
                <ModuleNotAvailablePage returnPath="/accounting" />
              ) : (
                <Outlet />
              )}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
