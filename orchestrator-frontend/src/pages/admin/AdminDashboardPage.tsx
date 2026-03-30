/**
 * AdminDashboardPage
 *
 * Stat cards from GET /api/v1/portal/dashboard (highlights) + quick-access nav links.
 * No tabs. No Operations. No Workforce.
 */

import { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertCircle, RefreshCcw, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sparkline } from '@/components/ui/Sparkline';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { portalInsightsApi } from '@/lib/adminApi';
import type { PortalDashboard } from '@/types';

// Decorative sparkline shapes — visual rhythm only, not real time-series.
const SPARKLINE_SHAPES = [
  [30, 38, 35, 45, 42, 55, 50, 62, 68, 72],
  [20, 28, 24, 32, 30, 38, 42, 40, 46, 50],
  [55, 48, 52, 44, 40, 43, 38, 35, 34, 30],
  [40, 44, 42, 48, 46, 52, 50, 56, 54, 58],
];
const SPARKLINE_COLORS = ['success', 'success', 'danger', 'success'] as const;

const QUICK_ACCESS = [
  { label: 'Users',       description: 'Manage accounts and access',  to: '/admin/users' },
  { label: 'Roles',       description: 'Review role permissions',      to: '/admin/roles' },
  { label: 'Approvals',   description: 'Review pending items',         to: '/admin/approvals' },
  { label: 'Audit Trail', description: 'Review system activity',       to: '/admin/audit-trail' },
  { label: 'Changelog',   description: 'Latest platform updates',      to: '/admin/changelog' },
  { label: 'Settings',    description: 'Platform configuration',       to: '/admin/settings' },
] as const;

// ─────────────────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await portalInsightsApi.getDashboard());
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const highlights = data?.highlights ?? [];
  const hasHighlights = highlights.length > 0;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-8">

      {/* Page header */}
      <PageHeader
        title={greeting}
        description="Platform overview and operational status."
        breadcrumb={
          <p data-testid="dashboard-date" className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        }
      />

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} data-testid="stat-skeleton" className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl space-y-2">
              <Skeleton height={10} width="55%" />
              <Skeleton height={28} width="45%" />
              <Skeleton height={10} width="70%" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div role="alert" className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={15} strokeWidth={1.75} className="shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={load}
            aria-label="Retry loading dashboard"
            className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80"
          >
            <RefreshCcw size={13} strokeWidth={1.75} />
            Retry
          </button>
        </div>
      ) : hasHighlights ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {highlights.slice(0, 4).map((item, idx) => (
            <StatCard
              key={item.label}
              label={item.label}
              value={item.value}
              detail={item.detail}
              sparkline={
                <Sparkline
                  data={SPARKLINE_SHAPES[idx % SPARKLINE_SHAPES.length]}
                  color={SPARKLINE_COLORS[idx % SPARKLINE_COLORS.length]}
                  width={64}
                  height={28}
                  strokeWidth={1.5}
                  smooth
                  fill
                />
              }
            />
          ))}
        </div>
      ) : null}

      {/* ── Quick Access ─────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-tertiary)] mb-3">
          Quick access
        </p>
        <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-[var(--color-border-subtle)] sm:[&>*:nth-child(odd)]:border-r sm:[&>*:nth-child(odd)]:border-[var(--color-border-subtle)]">
            {QUICK_ACCESS.map((item, i) => {
              const isLastRow = i >= QUICK_ACCESS.length - 2;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors duration-100',
                      'hover:bg-[var(--color-surface-secondary)]',
                      isActive && 'bg-[var(--color-surface-secondary)]',
                      !isLastRow && 'sm:border-b sm:border-[var(--color-border-subtle)]',
                    )
                  }
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] truncate mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={13}
                    strokeWidth={1.75}
                    className="shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-all duration-100 group-hover:translate-x-0.5"
                  />
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
