import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  Menu as MenuIcon,
  X,
  Search,
  Moon,
  Sun,
  ChevronLeft,
  HelpCircle,
  LayoutDashboard,
  BookOpen,
  Users,
  Truck,
  Package,
  BarChart3,
  Calendar,
  ArrowRight,
  Zap,
} from 'lucide-react';
import TutorialGuide from '../components/TutorialGuide';
import { getStepsForPath } from '../lib/tutorialSteps';
import UserMenuDropdown from '../components/layout/UserMenuDropdown';
import SidebarUserFooter from '../components/layout/SidebarUserFooter';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { searchDealers, type DealerLookup } from '../lib/accountingApi';
import SearchableCombobox from '../components/SearchableCombobox';
import { resolvePortalAccess, shouldShowPortalSelection } from '../types/portal-routing';

// ─── Hotkeys ────────────────────────────────────────────────────────────────

function useHotkeys(handlers: { onOpenPalette: () => void; onFocusDealer: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K → command palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        handlers.onOpenPalette();
      }
      // Ctrl+D / Cmd+D → focus dealer switcher
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        handlers.onFocusDealer();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlers]);
}

function focusDealerInput() {
  const el = document.querySelector<HTMLInputElement>('#dealer-switcher input');
  if (el) {
    el.focus();
    el.select();
  }
}

// ─── Recent Dealers Storage ─────────────────────────────────────────────────

const RECENT_DEALERS_KEY = 'accounting.recentDealers';
const MAX_RECENT_DEALERS = 5;

function getRecentDealers(): DealerLookup[] {
  try {
    const raw = sessionStorage.getItem(RECENT_DEALERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DealerLookup[];
  } catch {
    return [];
  }
}

function addRecentDealer(dealer: DealerLookup) {
  const existing = getRecentDealers().filter((d) => d.id !== dealer.id);
  const updated = [dealer, ...existing].slice(0, MAX_RECENT_DEALERS);
  sessionStorage.setItem(RECENT_DEALERS_KEY, JSON.stringify(updated));
}

// ─── Dealer Switcher ────────────────────────────────────────────────────────

function DealerSwitcher({
  selectedDealer,
  onDealerChange,
  session,
  companyCode,
}: {
  selectedDealer: DealerLookup | null;
  onDealerChange: (dealer: DealerLookup | null) => void;
  session: unknown;
  companyCode?: string;
}) {
  const loadDealers = async (query: string) => {
    if (!session) return [];

    // When query is empty, show recent dealers
    if (!query || query.trim().length < 2) {
      const recent = getRecentDealers();
      if (recent.length === 0) return [];
      return recent.map((d) => ({
        id: d.id,
        label: d.name,
        subLabel: d.code,
        original: d,
      }));
    }

    try {
      const results = await searchDealers(query.trim(), session as Parameters<typeof searchDealers>[1], companyCode);
      return results.map((d) => ({
        id: d.id,
        label: d.name,
        subLabel: d.code,
        original: d,
      }));
    } catch {
      return [];
    }
  };

  return (
    <div className="flex items-center gap-2" id="dealer-switcher">
      <div className="w-full sm:w-48 md:w-64">
        <SearchableCombobox
          label=""
          placeholder="Filter by dealer..."
          loadOptions={loadDealers}
          value={selectedDealer ? { id: selectedDealer.id, label: selectedDealer.name, subLabel: selectedDealer.code, original: selectedDealer } : null}
          onChange={(opt) => {
            const dealer = opt ? (opt as { original: DealerLookup }).original : null;
            if (dealer) addRecentDealer(dealer);
            onDealerChange(dealer);
          }}
          nullable
        />
      </div>
    </div>
  );
}

// ─── Command Palette ────────────────────────────────────────────────────────

interface PaletteItem {
  label: string;
  to: string;
  category: 'page' | 'subpage' | 'action';
  breadcrumb?: string;
  keywords?: string;
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const items = useMemo<PaletteItem[]>(
    () => [
      // Pages
      { label: 'Dashboard', to: '/accounting', category: 'page', keywords: 'home overview' },
      { label: 'Journal', to: '/accounting/journal', category: 'page', keywords: 'entries debit credit transactions' },
      { label: 'Chart of Accounts', to: '/accounting/accounts', category: 'page', keywords: 'coa gl general ledger' },
      { label: 'Invoices', to: '/accounting/invoices', category: 'page', keywords: 'bills receivables' },
      { label: 'Dealers', to: '/accounting/dealers', category: 'page', keywords: 'customers clients receivables' },
      { label: 'Suppliers & Procurement', to: '/accounting/procurement', category: 'page', keywords: 'vendors payables' },
      { label: 'Products & Materials', to: '/accounting/inventory', category: 'page', keywords: 'stock items' },
      { label: 'Payroll', to: '/accounting/payroll', category: 'page', keywords: 'salary wages compensation' },
      { label: 'Employees', to: '/accounting/employees', category: 'page', keywords: 'staff hr human resources' },
      { label: 'Reports', to: '/accounting/reports', category: 'page', keywords: 'audit trial balance p&l' },
      { label: 'Period Management', to: '/accounting/periods', category: 'page', keywords: 'month end close lock' },

      // Sub-pages (tab jumps)
      { label: 'Ledger', to: '/accounting/journal?tab=ledger', category: 'subpage', breadcrumb: 'Journal', keywords: 'account balances' },
      { label: 'Payments', to: '/accounting/journal?tab=payments', category: 'subpage', breadcrumb: 'Journal', keywords: 'settlements collections' },
      { label: 'Suppliers', to: '/accounting/procurement?tab=suppliers', category: 'subpage', breadcrumb: 'Procurement', keywords: 'vendors' },
      { label: 'Purchase Orders', to: '/accounting/procurement?tab=purchase-orders', category: 'subpage', breadcrumb: 'Procurement', keywords: 'PO buying' },
      { label: 'Goods Receipts', to: '/accounting/procurement?tab=goods-receipts', category: 'subpage', breadcrumb: 'Procurement', keywords: 'GRN receiving' },
      { label: 'SKU Catalog', to: '/accounting/inventory?tab=catalog', category: 'subpage', breadcrumb: 'Products & Materials', keywords: 'products items' },
      { label: 'Raw Materials', to: '/accounting/inventory?tab=raw-materials', category: 'subpage', breadcrumb: 'Products & Materials', keywords: 'ingredients inputs' },
      { label: 'Finished Goods', to: '/accounting/inventory?tab=finished-goods', category: 'subpage', breadcrumb: 'Products & Materials', keywords: 'manufactured output' },
      { label: 'Adjustments', to: '/accounting/inventory?tab=adjustments', category: 'subpage', breadcrumb: 'Products & Materials', keywords: 'stock correction write-off' },
      { label: 'Attendance', to: '/accounting/employees?tab=attendance', category: 'subpage', breadcrumb: 'Employees', keywords: 'check-in present absent' },
      { label: 'Leave', to: '/accounting/employees?tab=leave', category: 'subpage', breadcrumb: 'Employees', keywords: 'vacation time-off absence' },
      { label: 'Audit Digest', to: '/accounting/reports?tab=audit', category: 'subpage', breadcrumb: 'Reports', keywords: 'compliance review' },
      { label: 'Config Health', to: '/accounting/config-health', category: 'subpage', breadcrumb: 'System', keywords: 'health check setup diagnostics' },

      // Actions
      { label: 'Create Journal Entry', to: '/accounting/journal', category: 'action', keywords: 'new entry debit credit' },
      { label: 'Create Purchase Order', to: '/accounting/procurement?tab=purchase-orders', category: 'action', keywords: 'new PO buy order' },
      { label: 'Run Payroll', to: '/accounting/payroll', category: 'action', keywords: 'process salary wages' },

      // User pages
      { label: 'Profile', to: '/accounting/profile', category: 'page', keywords: 'account my' },
      { label: 'Settings', to: '/accounting/settings', category: 'page', keywords: 'preferences configuration' },
    ],
    []
  );

  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQ('');
      setActiveIndex(0);
      // Focus input after transition
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const lower = q.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(lower) ||
        (i.breadcrumb && i.breadcrumb.toLowerCase().includes(lower)) ||
        (i.keywords && i.keywords.toLowerCase().includes(lower))
    );
  }, [q, items]);

  // Group by category
  const grouped = useMemo(() => {
    const pages = filtered.filter((i) => i.category === 'page');
    const subpages = filtered.filter((i) => i.category === 'subpage');
    const actions = filtered.filter((i) => i.category === 'action');
    return { pages, subpages, actions };
  }, [filtered]);

  const flatFiltered = useMemo(
    () => [...grouped.pages, ...grouped.subpages, ...grouped.actions],
    [grouped]
  );

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIndex(0);
  }, [q]);

  const handleSelect = (item: PaletteItem) => {
    onClose();
    navigate(item.to);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatFiltered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatFiltered.length) % flatFiltered.length);
    } else if (e.key === 'Enter' && flatFiltered[activeIndex]) {
      e.preventDefault();
      handleSelect(flatFiltered[activeIndex]);
    }
  };

  const categoryIcon = (category: PaletteItem['category']) => {
    switch (category) {
      case 'page':
        return <ArrowRight className="h-3.5 w-3.5 text-tertiary" />;
      case 'subpage':
        return <ArrowRight className="h-3.5 w-3.5 text-tertiary" />;
      case 'action':
        return <Zap className="h-3.5 w-3.5 text-status-warning-text" />;
    }
  };

  const renderGroup = (label: string, groupItems: PaletteItem[], startIndex: number) => {
    if (groupItems.length === 0) return null;
    return (
      <li key={label}>
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-tertiary">{label}</p>
        <ul>
          {groupItems.map((item, i) => {
            const globalIndex = startIndex + i;
            return (
              <li key={item.to}>
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setActiveIndex(globalIndex)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    globalIndex === activeIndex
                      ? 'bg-surface-highlight text-primary'
                      : 'text-secondary hover:bg-surface-highlight/50 hover:text-primary'
                  )}
                >
                  {categoryIcon(item.category)}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.breadcrumb && (
                    <span className="text-xs text-tertiary">{item.breadcrumb}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </li>
    );
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-start justify-center p-2 sm:p-4 md:p-6 pt-16 sm:pt-20">
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 translate-y-4" enterTo="opacity-100 translate-y-0" leave="ease-in duration-100" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-4">
            <Dialog.Panel className="w-full max-w-full sm:max-w-xl md:max-w-2xl rounded-xl border border-border bg-surface p-2 sm:p-3 text-primary shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-4 w-4 text-secondary" />
                <input
                  ref={inputRef}
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, tabs, actions..."
                  className="h-8 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-tertiary"
                />
                <kbd className="hidden sm:inline rounded bg-surface-highlight px-1.5 py-0.5 text-[10px] font-medium text-tertiary">ESC</kbd>
              </div>
              <ul ref={listRef} className="max-h-80 overflow-y-auto py-1">
                {renderGroup('Pages', grouped.pages, 0)}
                {renderGroup('Tabs', grouped.subpages, grouped.pages.length)}
                {renderGroup('Actions', grouped.actions, grouped.pages.length + grouped.subpages.length)}
                {flatFiltered.length === 0 && (
                  <li className="px-3 py-4 text-center text-sm text-secondary">No results found</li>
                )}
              </ul>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

// ─── Navigation Config ──────────────────────────────────────────────────────

interface NavSection {
  label: string;
  items: NavItem[];
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { to: '/accounting', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Core',
    items: [
      { to: '/accounting/journal', label: 'Journal', icon: BookOpen },
      { to: '/accounting/dealers', label: 'Dealers', icon: Users },
      { to: '/accounting/procurement', label: 'Procurement', icon: Truck },
      { to: '/accounting/inventory', label: 'Products & Materials', icon: Package },
    ],
  },
  {
    label: 'Controls',
    items: [
      { to: '/accounting/reports', label: 'Reports', icon: BarChart3 },
      { to: '/accounting/periods', label: 'Periods', icon: Calendar },
    ],
  },
];

// ─── Layout ─────────────────────────────────────────────────────────────────

interface AccountingLayoutProps {
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}

export default function AccountingLayout({ theme, onThemeChange }: AccountingLayoutProps) {
  const { session, user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [companyCode] = useState(session?.companyCode ?? '');
  const [selectedDealer, setSelectedDealer] = useState<DealerLookup | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const portalAccess = useMemo(() => resolvePortalAccess(user), [user]);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const tutorialSteps = useMemo(() => getStepsForPath(location.pathname), [location.pathname]);

  useHotkeys(
    useMemo(
      () => ({
        onOpenPalette: () => setPaletteOpen(true),
        onFocusDealer: focusDealerInput,
      }),
      []
    )
  );

  // Close palette on navigation
  useEffect(() => {
    setPaletteOpen(false);
  }, [location.pathname]);

  // Store selected dealer in sessionStorage so it persists across page navigations
  useEffect(() => {
    if (selectedDealer) {
      sessionStorage.setItem('accounting.selectedDealer', JSON.stringify(selectedDealer));
      const params = new URLSearchParams(location.search);
      const currentDealerId = params.get('dealerId');
      if (currentDealerId !== String(selectedDealer.id)) {
        params.set('dealerId', String(selectedDealer.id));
        navigate({ search: params.toString() }, { replace: true });
      }
    } else {
      sessionStorage.removeItem('accounting.selectedDealer');
      const params = new URLSearchParams(location.search);
      if (params.has('dealerId')) {
        params.delete('dealerId');
        navigate({ search: params.toString() }, { replace: true });
      }
    }
  }, [selectedDealer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load selected dealer from sessionStorage or URL params on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const dealerIdFromUrl = params.get('dealerId');

      if (dealerIdFromUrl) {
        const stored = sessionStorage.getItem('accounting.selectedDealer');
        if (stored) {
          const dealer = JSON.parse(stored) as DealerLookup;
          if (dealer.id === Number(dealerIdFromUrl)) {
            setSelectedDealer(dealer);
            return;
          }
        }
        setSelectedDealer(null);
      } else {
        const stored = sessionStorage.getItem('accounting.selectedDealer');
        if (stored) {
          const dealer = JSON.parse(stored) as DealerLookup;
          setSelectedDealer(dealer);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [location.search]);

  // ── Sidebar Nav Renderer ────────────────────────────────────────────────

  const renderNav = (onClickItem?: () => void) => (
    <nav className="flex-1 px-4 py-4 overflow-y-auto">
      {shouldShowPortalSelection(portalAccess) && (
        <>
          <button
            type="button"
            onClick={() => {
              onClickItem?.();
              navigate('/portals');
            }}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition hover:bg-surface-highlight hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4 text-tertiary group-hover:text-secondary" />
            Change Workspace
          </button>
          <div className="my-3 h-px bg-border" />
        </>
      )}

      {navSections.map((section) => (
        <div key={section.label} className="mb-4">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-tertiary">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClickItem}
                className={({ isActive }) =>
                  clsx(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-surface-highlight text-primary shadow-sm ring-1 ring-border'
                      : 'text-secondary hover:bg-surface-highlight/50 hover:text-primary'
                  )
                }
              >
                <item.icon className="h-4 w-4 text-tertiary group-hover:text-secondary" />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background text-primary">
      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden w-72 shrink-0 border-r border-border bg-surface md:flex md:flex-col md:sticky md:top-0 md:h-screen">
        {/* Header */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Accounting</p>
            <p className="text-base font-bold text-primary">Portal</p>
          </div>
        </div>

        {/* Navigation */}
        {renderNav()}

        {/* User Footer */}
        <SidebarUserFooter
          displayName={user?.displayName ?? ''}
          email={user?.email ?? ''}
        />
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border bg-surface/80 px-2 sm:px-4 py-3 sm:py-4 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary hover:bg-surface-highlight md:hidden"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            {/* Dealer switcher */}
            <div className="flex-1 min-w-0">
              <DealerSwitcher
                selectedDealer={selectedDealer}
                onDealerChange={setSelectedDealer}
                session={session}
                companyCode={companyCode}
              />
            </div>

            {/* Command palette trigger — desktop */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-secondary hover:bg-surface-highlight transition-colors"
              title="Command Palette (Ctrl+K)"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">Search...</span>
              <kbd className="rounded bg-surface-highlight px-1.5 py-0.5 text-[10px] font-medium text-secondary">⌘K</kbd>
            </button>

            {/* Command palette trigger — mobile */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-secondary hover:bg-surface-highlight"
              title="Search (Ctrl+K)"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <div className="hidden sm:block h-6 w-px bg-border" />

            {/* Theme toggle */}
            <button
              type="button"
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className={clsx(
                'rounded-full p-2 transition-colors hover:bg-surface-highlight',
                theme === 'dark' ? 'text-yellow-400' : 'text-secondary'
              )}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Tutorial */}
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="hidden sm:inline-flex rounded-full p-2 text-secondary transition-colors hover:bg-surface-highlight"
              title="Start Tutorial"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            {/* User menu */}
            <UserMenuDropdown
              displayName={user?.displayName ?? ''}
              email={user?.email ?? ''}
              profilePath="/accounting/profile"
              settingsPath="/accounting/settings"
              onSignOut={signOut}
            />
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────── */}
      <Transition show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0">
            <Transition.Child as={Fragment} enter="transform transition ease-in-out duration-300" enterFrom="-translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in-out duration-300" leaveFrom="translate-x-0" leaveTo="-translate-x-full">
              <Dialog.Panel className="absolute left-0 top-0 h-full w-72 overflow-y-auto border-r border-border bg-surface text-primary shadow-xl">
                <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                  <span className="text-lg font-semibold tracking-tight text-primary">Accounting</span>
                  <button type="button" onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-secondary hover:bg-surface-highlight">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {renderNav(() => setSidebarOpen(false))}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* ── Command Palette ──────────────────────────────────────────── */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* ── Tutorial ─────────────────────────────────────────────────── */}
      <TutorialGuide
        steps={tutorialSteps}
        enabled={tutorialOpen}
        onExit={() => setTutorialOpen(false)}
      />
    </div>
  );
}
