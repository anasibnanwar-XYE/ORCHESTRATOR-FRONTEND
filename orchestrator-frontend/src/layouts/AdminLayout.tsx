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
import { Outlet, useNavigate } from 'react-router-dom';
import {
  Menu,
  Sun,
  Moon,
  LayoutDashboard,
  CheckCircle2,
  Users,
  KeyRound,
  SlidersHorizontal,
  Bell,
  History,
  FileSearch,
  HelpCircle,
  Landmark,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { ProfileMenu } from '@/components/ui/ProfileMenu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Sidebar, MobileSidebar, type SidebarNavGroup } from '@/components/ui/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { resolvePortalAccess, shouldShowHub, isModuleEnabled } from '@/lib/portal-routing';
import { useBreadcrumbs } from './useBreadcrumbs';
import { AdminCompanySwitcher } from '@/components/CompanySwitcher';
import { CommandPaletteButton } from '@/components/CommandPalette';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────────────────────────────────────────

const NAV_GROUPS: SidebarNavGroup[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Management',
    items: [
      { id: 'users', label: 'Users', to: '/admin/users', icon: Users },
      { id: 'roles', label: 'Roles', to: '/admin/roles', icon: KeyRound },
    ],
  },
  {
    label: 'Workflows',
    items: [
      { id: 'approvals', label: 'Approvals', to: '/admin/approvals', icon: CheckCircle2 },
      { id: 'notifications', label: 'Notifications', to: '/admin/notifications', icon: Bell },
      { id: 'changelog', label: 'Changelog', to: '/admin/changelog', icon: History },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { id: 'audit-trail', label: 'Audit Trail', to: '/admin/audit-trail', icon: FileSearch },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'finance', label: 'Dealer Finance', to: '/admin/finance', icon: Landmark },
    ],
  },
  {
    label: 'Support',
    items: [
      { id: 'support', label: 'Tickets', to: '/admin/support', icon: HelpCircle },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', to: '/admin/settings', icon: SlidersHorizontal },
    ],
  },
];

const ROUTE_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/approvals': 'Approvals',
  '/admin/users': 'Users',
  '/admin/roles': 'Roles',
  '/admin/notifications': 'Notifications',
  '/admin/changelog': 'Changelog',
  '/admin/audit-trail': 'Audit Trail',
  '/admin/settings': 'Settings',
  '/admin/finance': 'Dealer Finance',
  '/admin/support': 'Support Tickets',
  new: 'New',
  edit: 'Edit',
};

// ─────────────────────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────────────────────

const COLLAPSED_KEY = 'orchestrator-admin-sidebar-collapsed';

export function AdminLayout() {
  const { user, signOut, enabledModules } = useAuth();
  const { toggle, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true'
  );
  const navigate = useNavigate();

  const access = useMemo(() => resolvePortalAccess(user), [user]);
  const showBackToHub = useMemo(() => shouldShowHub(access), [access]);
  const breadcrumbs = useBreadcrumbs('/admin', 'Admin', ROUTE_LABELS);

  const handleCollapse = (v: boolean) => {
    setCollapsed(v);
    localStorage.setItem(COLLAPSED_KEY, String(v));
  };

  // Filter out items whose module is disabled
  const visibleGroups: SidebarNavGroup[] = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter(
          (item) => !('module' in item) || isModuleEnabled(enabledModules, (item as { module?: string }).module ?? '')
        ),
      })).filter((g) => g.items.length > 0),
    [enabledModules]
  );

  return (
    <div className="flex h-screen bg-[var(--color-surface-secondary)]" style={{ overflow: 'clip' }}>

      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <div className="hidden lg:block shrink-0 h-full">
        <Sidebar
          portalName="Admin"
          groups={visibleGroups}
          collapsed={collapsed}
          onCollapsedChange={handleCollapse}
          showBackToHub={showBackToHub}
          onBackToHub={() => navigate('/hub')}
          onSignOut={signOut}
        />
      </div>

      {/* ── Mobile Drawer ─────────────────────────────────────────── */}
      <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
        <div className="h-full" style={{ width: 'min(260px, 82vw)' }}>
          <Sidebar
            portalName="Admin"
            groups={visibleGroups}
            collapsed={false}
            onCollapsedChange={() => {}}
            showBackToHub={showBackToHub}
            onBackToHub={() => { navigate('/hub'); setMobileOpen(false); }}
            onSignOut={() => { signOut(); setMobileOpen(false); }}
            onNavClick={() => setMobileOpen(false)}
          />
        </div>
      </MobileSidebar>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header
          className="shrink-0 h-12 flex items-center justify-between gap-3 bg-[var(--color-surface-primary)] border-b border-[var(--color-border-default)]"
          style={{
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
        >
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
            <CommandPaletteButton />
            <span className="hidden sm:block">
              <AdminCompanySwitcher />
            </span>
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {user && (
              <ProfileMenu
                user={{ displayName: user.displayName, email: user.email, role: user.roles[0] ?? '' }}
                onLogout={signOut}
                onProfile={() => navigate('/profile')}
              />
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div
            className="mx-auto max-w-[1600px]"
            style={{ padding: 'clamp(16px, 2.08vw, 24px) max(clamp(16px, 2.08vw, 24px), env(safe-area-inset-right)) max(clamp(16px, 2.08vw, 24px), env(safe-area-inset-bottom))' }}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
