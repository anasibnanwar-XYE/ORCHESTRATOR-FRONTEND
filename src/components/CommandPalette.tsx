/**
 * CommandPalette — global command palette accessible via Cmd/Ctrl+K.
 *
 * Features:
 *  - Opens as centered modal overlay from any portal
 *  - Search input auto-focused on open
 *  - Lists navigable routes grouped by portal (based on user's access)
 *  - Quick actions: Profile, Toggle theme, Sign out
 *  - Recent commands (up to 5, stored in localStorage)
 *  - Keyboard navigation: ArrowUp/Down to select, Enter to execute, Escape to close
 *  - Click outside / backdrop click to dismiss
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Search,
  LayoutGrid,
  LayoutDashboard,
  CheckSquare,
  Users,
  Shield,
  Building2,
  Settings,
  BarChart3,
  BookOpen,
  Truck,
  Package,
  UserCheck,
  Banknote,
  Calendar,
  ShoppingCart,
  CreditCard,
  ArrowUpCircle,
  Tag,
  FileText,
  Target,
  RotateCcw,
  Factory,
  ClipboardList,
  Layers,
  PackageCheck,
  Box,
  FlaskConical,
  Settings2,
  SquareStack,
  ShoppingBag,
  Clock,
  User,
  LogOut,
  Sun,
  Moon,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { resolvePortalAccess } from '@/lib/portal-routing';
import { KBD } from '@/components/ui/KBD';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  group: string;
  portal?: string;
  path?: string;
  action: () => void;
}

interface RecentCommand {
  id: string;
  label: string;
  path: string;
  portal: string;
  timestamp: number;
}

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const RECENT_KEY = 'bbp-orchestrator-recent-commands';
const MAX_RECENT = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recent command helpers
// ─────────────────────────────────────────────────────────────────────────────

function loadRecent(): RecentCommand[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as RecentCommand[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(item: Omit<RecentCommand, 'timestamp'>): void {
  try {
    const existing = loadRecent().filter((r) => r.id !== item.id);
    const updated: RecentCommand[] = [
      { ...item, timestamp: Date.now() },
      ...existing,
    ].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Portal nav items registry
// ─────────────────────────────────────────────────────────────────────────────

interface PortalNavItem {
  id: string;
  label: string;
  path: string;
  portal: string;
  icon: LucideIcon;
}

const ADMIN_NAV: PortalNavItem[] = [
  { id: 'admin-dashboard', label: 'Dashboard', path: '/admin', portal: 'Admin', icon: LayoutGrid },
  { id: 'admin-operations', label: 'Operations', path: '/admin/operations', portal: 'Admin', icon: BarChart3 },
  { id: 'admin-approvals', label: 'Approvals', path: '/admin/approvals', portal: 'Admin', icon: CheckSquare },
  { id: 'admin-users', label: 'Users', path: '/admin/users', portal: 'Admin', icon: Users },
  { id: 'admin-roles', label: 'Roles', path: '/admin/roles', portal: 'Admin', icon: Shield },
  { id: 'admin-companies', label: 'Companies', path: '/admin/companies', portal: 'Admin', icon: Building2 },
  { id: 'admin-settings', label: 'Settings', path: '/admin/settings', portal: 'Admin', icon: Settings },
];

const ACCOUNTING_NAV: PortalNavItem[] = [
  { id: 'acc-dashboard', label: 'Dashboard', path: '/accounting', portal: 'Accounting', icon: LayoutDashboard },
  { id: 'acc-journal', label: 'Journal', path: '/accounting/journal', portal: 'Accounting', icon: BookOpen },
  { id: 'acc-dealers', label: 'Dealers', path: '/accounting/dealers', portal: 'Accounting', icon: Users },
  { id: 'acc-procurement', label: 'Procurement', path: '/accounting/procurement', portal: 'Accounting', icon: Truck },
  { id: 'acc-inventory', label: 'Products & Materials', path: '/accounting/inventory', portal: 'Accounting', icon: Package },
  { id: 'acc-employees', label: 'Employees', path: '/accounting/employees', portal: 'Accounting', icon: UserCheck },
  { id: 'acc-payroll', label: 'Payroll', path: '/accounting/payroll', portal: 'Accounting', icon: Banknote },
  { id: 'acc-reports', label: 'Reports', path: '/accounting/reports', portal: 'Accounting', icon: BarChart3 },
  { id: 'acc-periods', label: 'Periods', path: '/accounting/periods', portal: 'Accounting', icon: Calendar },
];

const SALES_NAV: PortalNavItem[] = [
  { id: 'sales-dashboard', label: 'Dashboard', path: '/sales', portal: 'Sales', icon: LayoutDashboard },
  { id: 'sales-dealers', label: 'Dealers', path: '/sales/dealers', portal: 'Sales', icon: Users },
  { id: 'sales-orders', label: 'Orders', path: '/sales/orders', portal: 'Sales', icon: ShoppingCart },
  { id: 'sales-credit-requests', label: 'Credit Requests', path: '/sales/credit-requests', portal: 'Sales', icon: CreditCard },
  { id: 'sales-credit-overrides', label: 'Credit Overrides', path: '/sales/credit-overrides', portal: 'Sales', icon: ArrowUpCircle },
  { id: 'sales-promotions', label: 'Promotions', path: '/sales/promotions', portal: 'Sales', icon: Tag },
  { id: 'sales-invoices', label: 'Invoices', path: '/sales/invoices', portal: 'Sales', icon: FileText },
  { id: 'sales-targets', label: 'Sales Targets', path: '/sales/targets', portal: 'Sales', icon: Target },
  { id: 'sales-dispatch', label: 'Dispatch', path: '/sales/dispatch', portal: 'Sales', icon: Truck },
  { id: 'sales-returns', label: 'Returns', path: '/sales/returns', portal: 'Sales', icon: RotateCcw },
];

const FACTORY_NAV: PortalNavItem[] = [
  { id: 'factory-dashboard', label: 'Dashboard', path: '/factory', portal: 'Factory', icon: LayoutDashboard },
  { id: 'factory-plans', label: 'Production Plans', path: '/factory/production/plans', portal: 'Factory', icon: Factory },
  { id: 'factory-logs', label: 'Production Logs', path: '/factory/production/logs', portal: 'Factory', icon: ClipboardList },
  { id: 'factory-batches', label: 'Batches', path: '/factory/production/batches', portal: 'Factory', icon: Layers },
  { id: 'factory-packing', label: 'Packing', path: '/factory/packing', portal: 'Factory', icon: PackageCheck },
  { id: 'factory-dispatch', label: 'Dispatch', path: '/factory/dispatch', portal: 'Factory', icon: Truck },
  { id: 'factory-finished-goods', label: 'Finished Goods', path: '/factory/inventory/finished-goods', portal: 'Factory', icon: Box },
  { id: 'factory-raw-materials', label: 'Raw Materials', path: '/factory/inventory/raw-materials', portal: 'Factory', icon: FlaskConical },
  { id: 'factory-packaging', label: 'Packaging Mappings', path: '/factory/config/packaging', portal: 'Factory', icon: SquareStack },
  { id: 'factory-tasks', label: 'Factory Tasks', path: '/factory/config/tasks', portal: 'Factory', icon: Settings2 },
];

const DEALER_NAV: PortalNavItem[] = [
  { id: 'dealer-dashboard', label: 'Dashboard', path: '/dealer', portal: 'Dealer', icon: LayoutDashboard },
  { id: 'dealer-orders', label: 'My Orders', path: '/dealer/orders', portal: 'Dealer', icon: ShoppingBag },
  { id: 'dealer-invoices', label: 'Invoices', path: '/dealer/invoices', portal: 'Dealer', icon: FileText },
  { id: 'dealer-ledger', label: 'Ledger', path: '/dealer/ledger', portal: 'Dealer', icon: BookOpen },
  { id: 'dealer-aging', label: 'Aging', path: '/dealer/aging', portal: 'Dealer', icon: Clock },
  { id: 'dealer-credit-requests', label: 'Credit Requests', path: '/dealer/credit-requests', portal: 'Dealer', icon: CreditCard },
];

const SUPERADMIN_NAV: PortalNavItem[] = [
  { id: 'super-dashboard', label: 'Dashboard', path: '/superadmin', portal: 'Platform', icon: LayoutDashboard },
  { id: 'super-tenants', label: 'Tenants', path: '/superadmin/tenants', portal: 'Platform', icon: Building2 },
  { id: 'super-roles', label: 'Platform Roles', path: '/superadmin/roles', portal: 'Platform', icon: Shield },
  { id: 'super-audit', label: 'Audit Trail', path: '/superadmin/audit', portal: 'Platform', icon: BarChart3 },
  { id: 'super-tickets', label: 'Support Tickets', path: '/superadmin/tickets', portal: 'Platform', icon: Users },
];

// ─────────────────────────────────────────────────────────────────────────────
// Palette Modal
// ─────────────────────────────────────────────────────────────────────────────

interface PaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandItem[];
}

function PaletteModal({ isOpen, onClose, items }: PaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Filter items by query
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.portal?.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Group filtered items
  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const existing = map.get(item.group) ?? [];
      map.set(item.group, [...existing, item]);
    }
    return map;
  }, [filtered]);

  // Flatten for keyboard navigation
  const flatItems = useMemo(() => filtered, [filtered]);

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view (guard against jsdom missing scrollIntoView)
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-selected="true"]');
    if (el && typeof (el as HTMLElement).scrollIntoView === 'function') {
      (el as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter' && flatItems[selectedIndex]) {
        e.preventDefault();
        flatItems[selectedIndex].action();
      }
    },
    [flatItems, selectedIndex, onClose]
  );

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal,800)] flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
        style={{ animation: 'fadeIn 150ms ease-out forwards' }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-[var(--color-surface-primary)] border border-[var(--color-border-default)]"
        style={{
          boxShadow: '0 24px 80px -16px rgba(0,0,0,0.14), 0 4px 16px -4px rgba(0,0,0,0.06)',
          animation: 'slideUp 300ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border-subtle)]">
          <Search
            size={16}
            className="shrink-0 text-[var(--color-text-tertiary)]"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none"
            autoComplete="off"
            spellCheck={false}
            aria-label="Command palette search"
          />
          <KBD>esc</KBD>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto overscroll-contain py-2"
        >
          {flatItems.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[12px] text-[var(--color-text-tertiary)]">
                No results for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            Array.from(groups.entries()).map(([groupName, groupItems]) => (
              <div key={groupName}>
                {/* Group label */}
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                  {groupName}
                </p>

                {/* Items */}
                {groupItems.map((item) => {
                  const isSelected = globalIndex === selectedIndex;
                  const currentIndex = globalIndex;
                  globalIndex += 1;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75',
                        isSelected
                          ? 'bg-[var(--color-surface-tertiary)]'
                          : 'hover:bg-[var(--color-surface-secondary)]'
                      )}
                    >
                      <div className={clsx(
                        'shrink-0 w-7 h-7 flex items-center justify-center rounded-lg',
                        isSelected
                          ? 'bg-[var(--color-neutral-900)] text-white'
                          : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
                      )}>
                        <item.icon size={14} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-[13px] font-medium truncate',
                          isSelected
                            ? 'text-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-primary)]'
                        )}>
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {item.portal && (
                        <span className="shrink-0 text-[10px] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-surface-secondary)] px-2 py-0.5 rounded-md">
                          {item.portal}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-1.5">
            <KBD>↑</KBD><KBD>↓</KBD>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <KBD>↵</KBD>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">open</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <KBD>⌘K</KBD>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">to open</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toggle: toggleTheme, isDark } = useTheme();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // Register Cmd/Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggle, close, isOpen]);

  // Derive accessible portals based on user role
  const access = useMemo(() => resolvePortalAccess(user), [user]);

  // Build navigation command items from portal access
  const navItems = useMemo((): CommandItem[] => {
    if (!user) return [];

    const allNav: PortalNavItem[] = [
      ...(access.admin ? ADMIN_NAV : []),
      ...(access.accounting ? ACCOUNTING_NAV : []),
      ...(access.sales ? SALES_NAV : []),
      ...(access.factory ? FACTORY_NAV : []),
      ...(access.dealer ? DEALER_NAV : []),
      ...(access.superadmin ? SUPERADMIN_NAV : []),
    ];

    return allNav.map((nav) => ({
      id: nav.id,
      label: nav.label,
      description: nav.portal,
      icon: nav.icon,
      group: 'Navigation',
      portal: nav.portal,
      path: nav.path,
      action: () => {
        saveRecent({ id: nav.id, label: nav.label, path: nav.path, portal: nav.portal });
        navigate(nav.path);
        close();
      },
    }));
  }, [user, access, navigate, close]);

  // Recent command items
  const [recentItems, setRecentItems] = useState<CommandItem[]>([]);

  // Use user ID as a primitive dependency to avoid re-running on every render
  // when the user object reference changes (e.g., in test mocks).
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!isOpen || !userId) {
      // Use functional update to avoid unnecessary re-renders when already empty
      setRecentItems((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const recent = loadRecent();
    if (recent.length === 0) {
      setRecentItems((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    // Find matching nav items for each recent command
    const allNav = [...ADMIN_NAV, ...ACCOUNTING_NAV, ...SALES_NAV, ...FACTORY_NAV, ...DEALER_NAV, ...SUPERADMIN_NAV];
    const items = recent
      .map((r): CommandItem | null => {
        const nav = allNav.find((n) => n.id === r.id);
        if (!nav) return null;
        return {
          id: `recent-${r.id}`,
          label: r.label,
          description: r.portal,
          icon: nav.icon,
          group: 'Recent',
          portal: r.portal,
          path: r.path,
          action: () => {
            saveRecent({ id: r.id, label: r.label, path: r.path, portal: r.portal });
            navigate(r.path);
            close();
          },
        };
      })
      .filter((item): item is CommandItem => item !== null);

    setRecentItems(items);
  }, [isOpen, userId, navigate, close]);

  // Quick action items
  const quickActions = useMemo((): CommandItem[] => {
    const actions: CommandItem[] = [];

    if (user) {
      actions.push({
        id: 'action-profile',
        label: 'Profile',
        description: 'View and edit your profile',
        icon: User,
        group: 'Quick Actions',
        action: () => {
          navigate('/profile');
          close();
        },
      });

      actions.push({
        id: 'action-theme',
        label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        description: 'Toggle the colour theme',
        icon: isDark ? Sun : Moon,
        group: 'Quick Actions',
        action: () => {
          toggleTheme();
          close();
        },
      });

      actions.push({
        id: 'action-signout',
        label: 'Sign out',
        description: 'End your session',
        icon: LogOut,
        group: 'Quick Actions',
        action: async () => {
          close();
          await signOut();
        },
      });
    }

    return actions;
  }, [user, isDark, navigate, close, toggleTheme, signOut]);

  // Combine all items: recent first (only when not searching), then nav, then quick actions
  const allItems = useMemo((): CommandItem[] => {
    return [
      ...recentItems,
      ...navItems,
      ...quickActions,
    ];
  }, [recentItems, navItems, quickActions]);

  // If no user, show minimal actions
  const unauthenticatedItems = useMemo((): CommandItem[] => [
    {
      id: 'action-theme',
      label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
      icon: isDark ? Sun : Moon,
      group: 'Quick Actions',
      action: () => {
        toggleTheme();
        close();
      },
    },
  ], [isDark, toggleTheme, close]);

  const paletteItems = user ? allItems : unauthenticatedItems;

  const ctxValue: CommandPaletteContextValue = { isOpen, open, close, toggle };

  return (
    <CommandPaletteContext.Provider value={ctxValue}>
      {children}
      <PaletteModal
        isOpen={isOpen}
        onClose={close}
        items={paletteItems}
      />
    </CommandPaletteContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience component to show Cmd+K hint in headers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Renders a compact "⌘K" button that opens the command palette.
 * Designed to be placed in portal header bars.
 */
export function CommandPaletteButton() {
  const { open } = useCommandPalette();

  return (
    <button
      type="button"
      onClick={open}
      className={clsx(
        'hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg',
        'text-[12px] text-[var(--color-text-tertiary)]',
        'bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]',
        'hover:bg-[var(--color-surface-tertiary)] hover:text-[var(--color-text-secondary)]',
        'transition-colors duration-100',
      )}
      aria-label="Open command palette"
    >
      <Zap size={12} />
      <span>Search</span>
      <KBD>⌘K</KBD>
    </button>
  );
}
