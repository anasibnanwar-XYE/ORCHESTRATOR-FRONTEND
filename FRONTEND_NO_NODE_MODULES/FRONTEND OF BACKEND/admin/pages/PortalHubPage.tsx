import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Settings,
  Calculator,
  Factory,
  ShoppingCart,
  Store,
  Shield,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { PortalAccessState } from '../types/auth';

interface PortalHubPageProps {
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
  portalAccess: PortalAccessState;
  onSignOut: () => void;
}

type PortalCard = {
  key: keyof PortalAccessState;
  title: string;
  description: string;
  to: string;
  enabled: boolean;
  icon: React.ReactNode;
};

export default function PortalHubPage({ theme, onThemeChange, portalAccess, onSignOut }: PortalHubPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDark = theme === 'dark';

  const cards = useMemo<PortalCard[]>(
    () => [
      {
        key: 'admin',
        title: 'Administration',
        description: 'User management, system configuration, and reports.',
        to: '/dashboard',
        enabled: portalAccess.admin,
        icon: <Settings className="h-6 w-6" />,
      },
      {
        key: 'accounting',
        title: 'Accounting',
        description: 'General ledger, accounts payable/receivable, and financial reports.',
        to: '/accounting',
        enabled: portalAccess.accounting,
        icon: <Calculator className="h-6 w-6" />,
      },
      {
        key: 'sales',
        title: 'Sales',
        description: 'Sales orders, customer management, and pricing.',
        to: '/sales',
        enabled: portalAccess.sales,
        icon: <ShoppingCart className="h-6 w-6" />,
      },
      {
        key: 'dealer',
        title: 'Dealer',
        description: 'Order placement, account ledger, and dealer statements.',
        to: '/dealer',
        enabled: portalAccess.dealer,
        icon: <Store className="h-6 w-6" />,
      },
      {
        key: 'factory',
        title: 'Manufacturing',
        description: 'Production planning, batch tracking, and inventory management.',
        to: '/factory',
        enabled: portalAccess.factory,
        icon: <Factory className="h-6 w-6" />,
      },
    ],
    [portalAccess]
  );

  const availableCards = cards.filter((card) => card.enabled);
  const totalModules = availableCards.length + (portalAccess.superadmin ? 1 : 0);

  return (
    <div
      className={clsx(
        'min-h-screen bg-background transition-colors',
        theme === 'dark' && 'dark'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <header className="mb-8 sm:mb-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-tertiary sm:text-sm">Module Selection</p>
              <h1 className="mt-2 text-2xl font-semibold text-primary sm:text-3xl lg:text-4xl">Select Module</h1>
              <p className="mt-2 text-sm text-secondary sm:text-base">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {user?.displayName ?? 'User'}
                </span>
                <span className="mx-2 text-tertiary">·</span>
                {totalModules} module{totalModules !== 1 ? 's' : ''} available
              </p>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-status-error-text bg-status-error-bg text-status-error-text hover:opacity-80"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
              <span className="sm:hidden">Out</span>
            </button>
          </div>
        </header>

        <div className="mb-6 border-b border-border pb-4 sm:mb-8 sm:pb-6">
          <p className="text-sm text-secondary sm:text-base">
            Select a module to access its features and functionality.
          </p>
        </div>

        <div id="portal-hub-grid" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableCards.map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => navigate(card.to)}
              className={clsx(
                'group flex flex-col rounded-xl border border-border',
                'bg-surface',
                'px-5 py-6 text-left transition-colors',
                'sm:px-6 sm:py-7',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--action-primary-bg)]',
                'hover:bg-surface-highlight hover:border-border'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-highlight text-secondary group-hover:text-primary transition-colors">
                  {card.icon}
                </div>
                <h2 className="text-base font-semibold text-primary sm:text-lg">{card.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-secondary sm:text-base flex-1">{card.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-secondary sm:mt-6 group-hover:text-primary transition-colors">
                Open Module
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>

        {availableCards.length === 0 && !portalAccess.superadmin && (
          <div className="rounded-lg border border-status-warning-text/20 bg-status-warning-bg px-4 py-3 sm:px-6 sm:py-4">
            <p className="text-sm text-status-warning-text sm:text-base">
              No modules assigned to this user account.
            </p>
          </div>
        )}

        {/* Superadmin control-plane — isolated section, only visible to platform team */}
        {portalAccess.superadmin && (
          <div className="mt-8 sm:mt-10">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary">Control Plane</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <button
              type="button"
              onClick={() => navigate('/superadmin')}
              className={clsx(
                'group flex w-full flex-col rounded-xl border border-status-error-text/20',
                'bg-surface',
                'px-5 py-6 text-left transition-colors',
                'sm:px-6 sm:py-7',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-status-error-text',
                'hover:bg-status-error-bg/30'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-error-bg">
                  <Shield className="h-6 w-6 text-status-error-text" />
                </div>
                <h2 className="text-base font-semibold text-primary sm:text-lg">Platform Control Plane</h2>
              </div>
              <p className="text-sm leading-relaxed text-secondary sm:text-base">
                Tenant lifecycle, platform RBAC governance, and control-plane audit trail.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-secondary sm:mt-6 group-hover:text-primary transition-colors">
                Open Control Plane
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        )}

        {/* Footer with theme toggle */}
        <div className="mt-12 pt-8 border-t border-border sm:mt-16 flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary">
              Theme
            </span>
            <div className="flex rounded-lg border border-border bg-surface-highlight p-1">
              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={clsx(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200',
                  !isDark
                    ? 'bg-surface text-primary shadow-sm ring-1 ring-border'
                    : 'text-tertiary hover:text-secondary'
                )}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={clsx(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all duration-200',
                  isDark
                    ? 'bg-surface text-primary shadow-sm ring-1 ring-border'
                    : 'text-tertiary hover:text-secondary'
                )}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>
          <p className="text-[10px] font-medium tracking-widest text-tertiary uppercase">
            Orchestrator ERP
          </p>
        </div>
      </div>
    </div>
  );
}
