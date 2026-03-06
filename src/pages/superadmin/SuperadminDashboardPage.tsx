/**
 * SuperadminDashboardPage
 *
 * Platform governance dashboard showing high-level tenant metrics.
 *
 * Sections:
 *  1. KPI stat cards: Total Tenants, Active, Suspended, Deactivated, Platform Users, Storage
 *  2. Quick actions to navigate to tenant management, roles, audit, tickets
 *
 * Data source:
 *  - superadminDashboardApi.getMetrics() → GET /api/v1/superadmin/dashboard
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  HardDrive,
  ArrowRight,
  AlertCircle,
  RefreshCcw,
  CheckCircle,
  PauseCircle,
  Globe,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Skeleton } from '@/components/ui/Skeleton';
import { superadminDashboardApi } from '@/lib/superadminApi';
import type { SuperAdminDashboardDto } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatStorage(bytes: number): string {
  const tb = bytes / (1024 * 1024 * 1024 * 1024);
  const gb = bytes / (1024 * 1024 * 1024);
  const mb = bytes / (1024 * 1024);
  if (tb >= 1) return `${tb.toFixed(1)} TB`;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${bytes} B`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric Card
// ─────────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  accent?: 'default' | 'success' | 'warning' | 'error';
}

function MetricCard({
  label,
  value,
  description,
  icon,
  onClick,
  isLoading,
  accent = 'default',
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl animate-pulse">
        <Skeleton width="55%" className="mb-2" />
        <Skeleton height={28} width="45%" />
        {description !== undefined && <Skeleton width="35%" className="mt-1.5" />}
      </div>
    );
  }

  const accentMap = {
    default: '',
    success: 'text-[var(--color-success)]',
    warning: 'text-[var(--color-warning)]',
    error: 'text-[var(--color-error)]',
  };

  const el = (
    <div
      className={clsx(
        'group p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {label}
        </p>
        <div className="shrink-0 text-[var(--color-text-tertiary)] opacity-50 group-hover:opacity-80 transition-opacity">
          {icon}
        </div>
      </div>
      <p className={clsx(
        'text-2xl font-semibold tabular-nums tracking-tight',
        accent !== 'default' ? accentMap[accent] : 'text-[var(--color-text-primary)]',
      )}>
        {value}
      </p>
      {description && (
        <p className="mt-1.5 text-[11px] text-[var(--color-text-tertiary)] truncate">
          {description}
        </p>
      )}
      {onClick && (
        <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[11px] text-[var(--color-text-tertiary)]">View details</span>
          <ArrowRight size={10} className="text-[var(--color-text-tertiary)]" />
        </div>
      )}
    </div>
  );

  return onClick ? <button type="button" className="text-left w-full" onClick={onClick}>{el}</button> : el;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function SuperadminDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SuperAdminDashboardDto | null>(null);

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await superadminDashboardApi.getMetrics();
      setMetrics(data);
    } catch {
      setError("Couldn't load platform metrics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const quickActions = [
    {
      label: 'Manage Tenants',
      description: 'Onboard, edit, and manage tenant lifecycle.',
      to: '/superadmin/tenants',
      icon: <Building2 size={15} />,
    },
    {
      label: 'Platform Roles',
      description: 'Define and manage platform-level roles.',
      to: '/superadmin/roles',
      icon: <Users size={15} />,
    },
    {
      label: 'Audit Trail',
      description: 'Platform-level event log and change history.',
      to: '/superadmin/audit',
      icon: <Globe size={15} />,
    },
    {
      label: 'Support Tickets',
      description: 'View and respond to tenant support requests.',
      to: '/superadmin/tickets',
      icon: <HardDrive size={15} />,
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
          {greeting}
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
          Platform governance overview
        </p>
      </div>

      {/* ── Error State ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={loadMetrics}
            className="flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-2 hover:no-underline"
          >
            <RefreshCcw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* ── KPI Stat Cards ──────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <MetricCard
                key={i}
                label=""
                value=""
                icon={null}
                isLoading
              />
            ))
          ) : (
            <>
              <MetricCard
                label="Total Tenants"
                value={metrics?.totalTenants ?? 0}
                description={
                  (metrics?.deactivatedTenants ?? 0) > 0
                    ? `${metrics!.deactivatedTenants} deactivated`
                    : 'All registered tenants'
                }
                icon={<Building2 size={15} />}
                onClick={() => navigate('/superadmin/tenants')}
              />
              <MetricCard
                label="Active Tenants"
                value={metrics?.activeTenants ?? 0}
                description="Currently operational"
                icon={<CheckCircle size={15} />}
                onClick={() => navigate('/superadmin/tenants')}
                accent="success"
              />
              <MetricCard
                label="Suspended"
                value={metrics?.suspendedTenants ?? 0}
                description={metrics?.suspendedTenants ? 'User access restricted' : 'None suspended'}
                icon={<PauseCircle size={15} />}
                onClick={() => navigate('/superadmin/tenants')}
                accent={metrics?.suspendedTenants ? 'warning' : 'default'}
              />
              <MetricCard
                label="Platform Users"
                value={metrics?.totalUsers ?? 0}
                description="Across all tenants"
                icon={<Users size={15} />}
                onClick={() => navigate('/superadmin/tenants')}
              />
              <MetricCard
                label="Storage Used"
                value={formatStorage(metrics?.totalStorageBytes ?? 0)}
                description="Combined usage"
                icon={<HardDrive size={15} />}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <section>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate(action.to)}
              className={clsx(
                'group text-left p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
                'transition-all duration-200 hover:border-[var(--color-border-strong)]',
                'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]',
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="shrink-0 text-[var(--color-text-tertiary)] opacity-60 group-hover:opacity-100 transition-opacity mt-0.5">
                  {action.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
                    {action.label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)] leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[11px] text-[var(--color-text-tertiary)]">Open</span>
                <ArrowRight size={10} className="text-[var(--color-text-tertiary)]" />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
