/**
 * SuperadminLayout — isolated shell for the Platform Governance (Superadmin) portal.
 *
 * Nav items (governance-only):
 *  Dashboard, Tenants, Platform Roles, Audit Trail, Support Tickets
 *
 * Design note: Shield icon in sidebar header indicates isolation / elevated access.
 * This layout is NEVER accessible to non-superadmin users. The routing layer
 * enforces this via RequireSuperadmin guard.
 *
 * No "Back to hub" — superadmins are isolated to this portal.
 */

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  Shield,
  LayoutDashboard,
  Building2,
  Users,
  ScrollText,
  LifeBuoy,
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
import { MODULE_KEYS, isModuleEnabled } from '@/lib/portal-routing';
import { useBreadcrumbs } from './useBreadcrumbs';
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
  { label: 'Dashboard', to: '/superadmin', icon: LayoutDashboard, end: true },
  { label: 'Tenants', to: '/superadmin/tenants', icon: Building2, module: MODULE_KEYS.SUPERADMIN_TENANTS },
  { label: 'Platform Roles', to: '/superadmin/roles', icon: Users, module: MODULE_KEYS.SUPERADMIN_ROLES },
  { label: 'Audit Trail', to: '/superadmin/audit', icon: ScrollText, module: MODULE_KEYS.SUPERADMIN_AUDIT },
  { label: 'Support Tickets', to: '/superadmin/tickets', icon: LifeBuoy, module: MODULE_KEYS.SUPERADMIN_TICKETS },
];

const ROUTE_LABELS: Record<string, string> = {
  '/superadmin': 'Dashboard',
  '/superadmin/tenants': 'Tenants',
  '/superadmin/roles': 'Platform Roles',
  '/superadmin/audit': 'Audit Trail',
  '/superadmin/tickets': 'Support Tickets',
  new: 'New',
  edit: 'Edit',
};

function SidebarContent({
  enabledModules,
  onNavClick,
}: {
  enabledModules: string[];
  onNavClick?: () => void;
}) {
  // Filter out nav items whose module is disabled
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.module || isModuleEnabled(enabledModules, item.module)
  );

  return (
    <div className="flex h-full flex-col">
      {/* Brand with Shield indicator */}
      <div className="px-4 py-5 border-b border-[var(--color-border-subtle)]">
        <OrchestratorLogo size={20} variant="full" />
        <div className="mt-2 flex items-center gap-1.5">
          <Shield
            size={11}
            className="text-[var(--color-text-tertiary)] shrink-0"
            strokeWidth={2}
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
            Platform
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
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
                  ? 'bg-[var(--color-neutral-900)] text-[var(--color-text-inverse)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-primary)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={15}
                  className={isActive ? 'opacity-70' : 'text-[var(--color-text-tertiary)]'}
                  style={isActive ? { color: 'var(--color-text-inverse)' } : undefined}
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

export function SuperadminLayout() {
  const { user, signOut, enabledModules } = useAuth();
  const { toggle, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const breadcrumbs = useBreadcrumbs('/superadmin', 'Platform', ROUTE_LABELS);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
        <SidebarContent enabledModules={enabledModules} />
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
            <SidebarContent enabledModules={enabledModules} onNavClick={() => setMobileOpen(false)} />
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
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
