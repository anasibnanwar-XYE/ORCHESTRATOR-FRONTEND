 /**
  * AccountingLayout — shell for the Accounting portal.
  *
  * Nav groups (workflow-first, per AGENTS.md):
  *  Overview:      Dashboard
  *  Transactions:  Journals, Periods, Default Accounts
  *  Partners:      Dealers, Suppliers, Settlements
  *  Inventory:     Catalog, Raw Materials, Finished Goods, Adjustments
  *  HR & Payroll:  Employees, Attendance, Leave, Payroll
  *  Reports:       Trial Balance, P&L, Balance Sheet, Cash Flow,
  *                 Aged Debtors, GST, Inventory Valuation, Audit
  *  Settings:      Config Health, Month-End
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
  Clock,
  SlidersHorizontal,
  Users,
  Building2,
  ArrowLeftRight,
  Package,
  FlaskConical,
  Boxes,
  ClipboardEdit,
  Scale,
  TrendingUp,
  PieChart,
  Activity,
  UserX,
  Receipt,
  Warehouse,
  ClipboardList,
  ShieldCheck,
  CheckSquare,
  FileText,
  ShoppingCart,
  PackageCheck,
  ReceiptText,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import {
  ListChecks,
  FileBarChart2,
  Landmark,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { ProfileMenu } from '@/components/ui/ProfileMenu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { OrchestratorLogo } from '@/components/ui/OrchestratorLogo';
import { MobileSidebar } from '@/components/ui/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { resolvePortalAccess, shouldShowHub, isModuleEnabled, getModuleForPath } from '@/lib/portal-routing';
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
    title: 'Transactions',
    items: [
      { label: 'Journals', to: '/accounting/journals', icon: BookOpen },
      { label: 'Chart of Accounts', to: '/accounting/chart-of-accounts', icon: Scale },
      { label: 'Periods', to: '/accounting/periods', icon: Clock },
      { label: 'Default Accounts', to: '/accounting/default-accounts', icon: SlidersHorizontal },
    ],
  },
  {
    title: 'Partners',
    items: [
      { label: 'Dealers', to: '/accounting/dealers', icon: Users },
      { label: 'Suppliers', to: '/accounting/suppliers', icon: Building2 },
      { label: 'Settlements', to: '/accounting/settlements', icon: ArrowLeftRight },
      { label: 'Invoices', to: '/accounting/invoices', icon: FileText },
    ],
  },
  {
    title: 'Purchasing',
    items: [
      { label: 'Purchase Orders', to: '/accounting/purchasing/purchase-orders', icon: ShoppingCart },
      { label: 'Goods Receipts', to: '/accounting/purchasing/goods-receipts', icon: PackageCheck },
      { label: 'Purchase Invoices', to: '/accounting/purchasing/raw-material-purchases', icon: ReceiptText },
      { label: 'Purchase Returns', to: '/accounting/purchasing/returns', icon: Undo2 },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Catalog', to: '/accounting/catalog', icon: Package },
      { label: 'Raw Materials', to: '/accounting/raw-materials', icon: FlaskConical },
      { label: 'Finished Goods', to: '/accounting/finished-goods', icon: Boxes },
      { label: 'Adjustments', to: '/accounting/adjustments', icon: ClipboardEdit },
      { label: 'Opening Stock', to: '/accounting/opening-stock', icon: CheckSquare },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Trial Balance', to: '/accounting/reports/trial-balance', icon: Scale },
      { label: 'P&L', to: '/accounting/reports/pl', icon: TrendingUp },
      { label: 'Balance Sheet', to: '/accounting/reports/balance-sheet', icon: PieChart },
      { label: 'Cash Flow', to: '/accounting/reports/cash-flow', icon: Activity },
      { label: 'Aged Debtors', to: '/accounting/reports/aged-debtors', icon: UserX },
      { label: 'GST Return', to: '/accounting/reports/gst', icon: Receipt },
      { label: 'GST Reconciliation', to: '/accounting/reports/gst-reconciliation', icon: FileText },
      { label: 'Inventory Valuation', to: '/accounting/reports/inventory', icon: Warehouse },
      { label: 'Reconciliation Audit', to: '/accounting/reports/audit', icon: ClipboardList },
    ],
  },
  {
    title: 'Audit & Operations',
    items: [
      { label: 'Audit Digest', to: '/accounting/audit-digest', icon: FileBarChart2 },
      { label: 'Transaction Audit', to: '/accounting/transaction-audit', icon: ListChecks },
    ],
  },
  {
    title: 'Reconciliation',
    items: [
      { label: 'Bank Reconciliation', to: '/accounting/bank-reconciliation', icon: Landmark },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Config Health', to: '/accounting/config-health', icon: ShieldCheck },
      { label: 'Month-End', to: '/accounting/month-end', icon: CheckSquare },
    ],
  },
];

/**
 * Map of route path prefixes to their module keys.
 * Routes that start with these prefixes belong to gated modules.
 */
const MODULE_ROUTES: Record<string, string> = {};

const ROUTE_LABELS: Record<string, string> = {
  '/accounting': 'Dashboard',
  '/accounting/journals': 'Journals',
  '/accounting/journals/new': 'New Journal',
  '/accounting/chart-of-accounts': 'Chart of Accounts',
  '/accounting/periods': 'Periods',
  '/accounting/default-accounts': 'Default Accounts',
  '/accounting/dealers': 'Dealers',
  '/accounting/suppliers': 'Suppliers',
  '/accounting/settlements': 'Settlements',
  '/accounting/invoices': 'Invoices',
  '/accounting/catalog': 'Catalog',
  '/accounting/purchasing/purchase-orders': 'Purchase Orders',
  '/accounting/purchasing/goods-receipts': 'Goods Receipts',
  '/accounting/purchasing/raw-material-purchases': 'Purchase Invoices',
  '/accounting/purchasing/returns': 'Purchase Returns',
  '/accounting/raw-materials': 'Raw Materials',
  '/accounting/finished-goods': 'Finished Goods',
  '/accounting/adjustments': 'Adjustments',
  '/accounting/opening-stock': 'Opening Stock',
  '/accounting/reports/trial-balance': 'Trial Balance',
  '/accounting/reports/pl': 'P&L',
  '/accounting/reports/balance-sheet': 'Balance Sheet',
  '/accounting/reports/cash-flow': 'Cash Flow',
  '/accounting/reports/aged-debtors': 'Aged Debtors',
  '/accounting/reports/gst': 'GST Return',
  '/accounting/reports/gst-reconciliation': 'GST Reconciliation',
  '/accounting/reports/inventory': 'Inventory Valuation',
  '/accounting/reports/audit': 'Reconciliation Audit',
  '/accounting/reports': 'Reports',
  '/accounting/config-health': 'Config Health',
  '/accounting/month-end': 'Month-End',
  '/accounting/bank-reconciliation': 'Bank Reconciliation',
  '/accounting/audit-digest': 'Audit Digest',
  '/accounting/transaction-audit': 'Transaction Audit',
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
