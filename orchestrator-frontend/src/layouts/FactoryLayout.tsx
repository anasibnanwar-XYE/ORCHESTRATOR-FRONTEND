/**
 * FactoryLayout — shell for the Factory portal.
 *
 * Nav groups:
 *  Overview:           Dashboard
 *  Production:         Production Plans, Production Logs, Batches
 *  Packing & Dispatch: Packing, Dispatch
 *  Inventory:          Finished Goods, Raw Materials
 *  Configuration:      Packaging Mappings, Factory Tasks
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
  Factory,
  ClipboardList,
  Layers,
  PackageCheck,
  Truck,
  Box,
  FlaskConical,
  Settings2,
  SquareStack,
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
      { label: 'Dashboard', to: '/factory', icon: LayoutDashboard, end: true },
    ],
  },
  {
    title: 'Production',
    items: [
      { label: 'Plans', to: '/factory/production/plans', icon: Factory, module: MODULE_KEYS.PRODUCTION },
      { label: 'Production Logs', to: '/factory/production/logs', icon: ClipboardList, module: MODULE_KEYS.PRODUCTION },
      { label: 'Batches', to: '/factory/production/batches', icon: Layers, module: MODULE_KEYS.PRODUCTION },
    ],
  },
  {
    title: 'Packing & Dispatch',
    items: [
      { label: 'Packing', to: '/factory/packing', icon: PackageCheck, module: MODULE_KEYS.PACKING },
      { label: 'Dispatch', to: '/factory/dispatch', icon: Truck },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Finished Goods', to: '/factory/inventory/finished-goods', icon: Box },
      { label: 'Raw Materials', to: '/factory/inventory/raw-materials', icon: FlaskConical },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { label: 'Packaging Mappings', to: '/factory/config/packaging', icon: SquareStack },
      { label: 'Factory Tasks', to: '/factory/config/tasks', icon: Settings2 },
      { label: 'Cost Allocation', to: '/factory/cost-allocation', icon: ClipboardList },
    ],
  },
];

/**
 * Map of route path prefixes to their module keys.
 */
const MODULE_ROUTES: Record<string, string> = {
  '/factory/production': MODULE_KEYS.PRODUCTION,
  '/factory/packing': MODULE_KEYS.PACKING,
};

const ROUTE_LABELS: Record<string, string> = {
  '/factory': 'Dashboard',
  '/factory/production': 'Production',
  '/factory/production/plans': 'Plans',
  '/factory/production/logs': 'Production Logs',
  '/factory/production/batches': 'Batches',
  '/factory/packing': 'Packing',
  '/factory/dispatch': 'Dispatch',
  '/factory/inventory': 'Inventory',
  '/factory/inventory/finished-goods': 'Finished Goods',
  '/factory/inventory/raw-materials': 'Raw Materials',
  '/factory/config': 'Configuration',
  '/factory/config/packaging': 'Packaging Mappings',
  '/factory/config/tasks': 'Factory Tasks',
  '/factory/cost-allocation': 'Cost Allocation',
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

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5 border-b border-[var(--color-border-subtle)]">
        <OrchestratorLogo size={20} variant="full" />
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Factory
        </p>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto no-scrollbar">
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
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

export function FactoryLayout() {
  const { user, signOut, enabledModules } = useAuth();
  const { toggle, isDark } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const access = useMemo(() => resolvePortalAccess(user), [user]);
  const showBackToHub = useMemo(() => shouldShowHub(access), [access]);

  const breadcrumbs = useBreadcrumbs('/factory', 'Factory', ROUTE_LABELS);

  // Check if current route belongs to a disabled module
  const currentModuleKey = getModuleForPath(location.pathname, MODULE_ROUTES);
  const isCurrentModuleDisabled =
    currentModuleKey !== null && !isModuleEnabled(enabledModules, currentModuleKey);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-secondary)]">
      <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-surface-primary)]">
        <SidebarContent showBackToHub={showBackToHub} enabledModules={enabledModules} />
      </aside>

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
              {isCurrentModuleDisabled ? (
                <ModuleNotAvailablePage returnPath="/factory" />
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
