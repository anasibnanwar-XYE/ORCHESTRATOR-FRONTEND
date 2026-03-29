/**
 * AdminLayout — shell for the Admin portal.
 *
 * Nav items:
 *  Dashboard, Operations, Approvals, Users, Roles, Companies,
 *  Notifications, Changelog, Settings
 *
 * Features:
 *  - Collapsible sidebar (220px desktop, drawer on mobile < lg)
 *  - Top header: hamburger | breadcrumb | theme toggle | profile menu
 *  - ErrorBoundary wraps <Outlet /> content area
 *  - "Back to hub" button for multi-portal users (ROLE_ADMIN)
 */

import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  LayoutGrid,
  CheckSquare,
  Users,
  Shield,
  Building2,
  Settings,
  BarChart3,
  Bell,
  BookOpen,
  FileDown,
  GitBranch,
  ClipboardList,
  LineChart,
  Server,
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
  label?: string;
  items: NavItem[];
}

/** Primary nav groups — rendered in order with optional section labels */
const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutGrid, end: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Users', to: '/admin/users', icon: Users },
      { label: 'Roles', to: '/admin/roles', icon: Shield },
      { label: 'Companies', to: '/admin/companies', icon: Building2 },
    ],
  },
  {
    label: 'Workflows',
    items: [
      { label: 'Approvals', to: '/admin/approvals', icon: CheckSquare },
      { label: 'Export Approvals', to: '/admin/export-approvals', icon: FileDown },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
      { label: 'Changelog', to: '/admin/changelog', icon: BookOpen },
    ],
  },
  {
    label: 'Analytics & Ops',
    items: [
      { label: 'Orchestrator', to: '/admin/orchestrator', icon: GitBranch },
      { label: 'Portal Insights', to: '/admin/portal-insights', icon: LineChart },
      { label: 'Audit Trail', to: '/admin/audit-trail', icon: ClipboardList },
      { label: 'Tenant Runtime', to: '/admin/tenant-runtime', icon: Server },
      { label: 'Operations', to: '/admin/operations', icon: BarChart3 },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ],
  },
];

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/operations': 'Operations',
  '/admin/approvals': 'Approvals',
  '/admin/export-approvals': 'Export Approvals',
  '/admin/users': 'Users',
  '/admin/roles': 'Roles',
  '/admin/companies': 'Companies',
  '/admin/notifications': 'Notifications',
  '/admin/changelog': 'Changelog',
  '/admin/settings': 'Settings',
  '/admin/orchestrator': 'Orchestrator',
  '/admin/portal-insights': 'Portal Insights',
  '/admin/insights': 'Portal Insights',
  '/admin/audit-trail': 'Audit Trail',
  '/admin/tenant-runtime': 'Tenant Runtime',
  new: 'New',
  edit: 'Edit',
};

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar content (shared between desktop and mobile drawer)
// ─────────────────────────────────────────────────────────────────────────────

function NavItemLink({
  item,
  onNavClick,
}: {
  item: NavItem;
  onNavClick?: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 px-3 h-11 sm:h-8 rounded-lg text-[13px] font-medium transition-colors duration-100',
          isActive
            ? 'bg-[var(--color-primary-600)] text-white'
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
  );
}

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
          Admin
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto no-scrollbar" aria-label="Admin navigation">
        {/* Back to hub */}
        {showBackToHub && (
          <button
            type="button"
            onClick={() => {
              onNavClick?.();
              navigate('/hub');
            }}
            className="w-full flex items-center gap-2.5 px-3 h-11 sm:h-8 rounded-lg text-[13px] font-medium text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors mb-3"
          >
            <ChevronLeft size={14} />
            All portals
          </button>
        )}

        {NAV_GROUPS.map((group, groupIdx) => {
          // Filter out items whose module is disabled
          const visibleItems = group.items.filter(
            (item) => !item.module || isModuleEnabled(enabledModules, item.module)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div
              key={groupIdx}
              className={clsx(
                'space-y-0.5',
                groupIdx > 0 && 'mt-4 pt-3 border-t border-[var(--color-border-subtle)]',
              )}
            >
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  {group.label}
                </p>
              )}
              {visibleItems.map((item) => (
                <NavItemLink key={item.to} item={item} onNavClick={onNavClick} />
              ))}
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

export function AdminLayout() {
  const { user, signOut, enabledModules } = useAuth();
  const { toggle, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const access = useMemo(() => resolvePortalAccess(user), [user]);
  const showBackToHub = useMemo(() => shouldShowHub(access), [access]);

  const breadcrumbs = useBreadcrumbs('/admin', 'Admin', ROUTE_LABELS);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)]">
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
        <SidebarContent showBackToHub={showBackToHub} enabledModules={enabledModules} />
      </aside>

      {/* ── Mobile Drawer ────────────────────────────────────────────── */}
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
        <div className="flex flex-col w-[min(280px,80vw)] h-full bg-[var(--color-surface-primary)] border-r border-[var(--color-border-default)]">
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

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="shrink-0 h-12 flex items-center justify-between px-4 gap-3 bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
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

          <div className="flex items-center gap-2 shrink-0">
            {/* Command palette button */}
            <CommandPaletteButton />

            {/* Company switcher — hidden on mobile to reduce header crowding */}
            <span className="hidden sm:block">
              <AdminCompanySwitcher />
            </span>

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Profile menu */}
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
