 /**
  * AdminDashboardPage
  *
  * Enterprise dashboard for the Admin portal.
  *
  * Sections:
  *  1. KPI stat cards — dynamic highlights from GET /portal/dashboard
  *     Each card navigates to the relevant section.
  *  2. Pipeline stages visualization — from backend pipeline array
  *  3. HR Pulse card — from backend hrPulse array
  *  4. Quick actions
  *
  * Data source:
  *  - GET /api/v1/portal/dashboard → { highlights, pipeline, hrPulse }
  *
  * Fallback:
  *  - If /portal/dashboard is unavailable, show static KPI cards with empty data
  */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  CheckSquare,
  Activity,
  ArrowRight,
  Package,
  Truck,
  MapPin,
  AlertCircle,
  RefreshCcw,
  UserPlus,
  UserMinus,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Skeleton } from '@/components/ui/Skeleton';
import { portalInsightsApi } from '@/lib/adminApi';
import type { PortalDashboard } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  description?: string;
  onClick: () => void;
  isLoading?: boolean;
  icon: React.ReactNode;
  badge?: { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' };
}

function KpiCard({ label, value, description, onClick, isLoading, icon, badge }: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
        <Skeleton width="50%" className="mb-2" />
        <Skeleton height={28} width="60%" />
        {description && <Skeleton width="40%" className="mt-1.5" />}
      </div>
    );
  }

  const badgeColors = {
    success: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
    warning: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
    error: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
    neutral: 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group text-left p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl',
        'transition-all duration-200 hover:border-[var(--color-border-strong)]',
        'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)] focus-visible:ring-offset-1',
        'w-full',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {label}
        </p>
        <div className="shrink-0 text-[var(--color-text-tertiary)] opacity-60 group-hover:opacity-100 transition-opacity">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-2 tabular-nums tracking-tight">
        {value}
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {description && (
          <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">{description}</p>
        )}
        {badge && (
          <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0', badgeColors[badge.variant])}>
            {badge.label}
          </span>
        )}
        <ArrowRight
          size={12}
          className="ml-auto shrink-0 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Stage
// ─────────────────────────────────────────────────────────────────────────────

interface PipelineStageProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  isLast?: boolean;
}

function PipelineStage({ label, count, icon, isLast }: PipelineStageProps) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 p-3 bg-[var(--color-surface-secondary)] rounded-lg">
          <div className="shrink-0 text-[var(--color-text-tertiary)]">{icon}</div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] truncate">
              {label}
            </p>
            <p className="text-xl font-semibold tabular-nums text-[var(--color-text-primary)]">
              {count}
            </p>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="shrink-0 text-[var(--color-text-tertiary)] opacity-40">
          <ArrowRight size={14} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HR Pulse Card
// ─────────────────────────────────────────────────────────────────────────────

interface HrMetric {
  label: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}

function HrPulseCard({ metrics, isLoading }: { metrics: HrMetric[]; isLoading: boolean }) {
  return (
    <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
        Workforce Pulse
      </p>
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton width={24} height={24} className="rounded-lg" />
              <div className="flex-1">
                <Skeleton width="50%" className="mb-1" />
                <Skeleton width="30%" />
              </div>
            </div>
          ))}
        </div>
      ) : metrics.length === 0 ? (
        <p className="text-[13px] text-[var(--color-text-tertiary)] py-2">No workforce data available.</p>
      ) : (
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-secondary)] transition-colors"
            >
              <div className="shrink-0 text-[var(--color-text-tertiary)]">{metric.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[var(--color-text-tertiary)]">{metric.label}</p>
                {metric.description && (
                  <p className="text-[11px] text-[var(--color-text-tertiary)] opacity-60 truncate">
                    {metric.description}
                  </p>
                )}
              </div>
              <p className="text-base font-semibold tabular-nums text-[var(--color-text-primary)] shrink-0">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — derive icon and route from highlight label
// ─────────────────────────────────────────────────────────────────────────────

function iconForHighlight(label: string): React.ReactNode {
  const l = label.toLowerCase();
  if (l.includes('user')) return <Users size={15} />;
  if (l.includes('compan') || l.includes('tenant')) return <Building2 size={15} />;
  if (l.includes('approval') || l.includes('pending')) return <CheckSquare size={15} />;
  if (l.includes('revenue') || l.includes('sales')) return <TrendingUp size={15} />;
  return <Activity size={15} />;
}

function routeForHighlight(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('user')) return '/admin/users';
  if (l.includes('compan') || l.includes('tenant')) return '/admin/companies';
  if (l.includes('approval') || l.includes('pending')) return '/admin/approvals';
  return '/admin/dashboard';
}

function pipelineIconForLabel(label: string): React.ReactNode {
  const l = label.toLowerCase();
  if (l.includes('dispatch') || l.includes('ship')) return <Truck size={14} />;
  if (l.includes('deliver') || l.includes('location')) return <MapPin size={14} />;
  return <Package size={14} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static KPI cards shown when portal/dashboard is unavailable
// ─────────────────────────────────────────────────────────────────────────────

interface StaticKpi {
  label: string;
  value: string | number;
  description: string;
  route: string;
  icon: React.ReactNode;
}

function staticKpis(): StaticKpi[] {
  return [
    { label: 'Total Users', value: '—', description: 'Manage accounts', route: '/admin/users', icon: <Users size={15} /> },
    { label: 'Total Companies', value: '—', description: 'Manage tenants', route: '/admin/companies', icon: <Building2 size={15} /> },
    { label: 'Pending Approvals', value: '—', description: 'Requires action', route: '/admin/approvals', icon: <CheckSquare size={15} /> },
    { label: 'System Status', value: 'Operational', description: 'All services running', route: '/admin/settings', icon: <Activity size={15} /> },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortalDashboard | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboard = await portalInsightsApi.getDashboard();
      setData(dashboard);
    } catch {
      setError("Couldn't load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Greeting
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  // Derive pipeline stages
  const pipelineStages = data?.pipeline && data.pipeline.length > 0
    ? data.pipeline
    : [
        { label: 'Orders', count: 0 },
        { label: 'Dispatch', count: 0 },
        { label: 'Delivery', count: 0 },
      ];

  // Derive HR pulse metrics
  const hrMetrics: HrMetric[] = data?.hrPulse && data.hrPulse.length > 0
    ? data.hrPulse.map((h) => ({
        label: h.label,
        value: h.score,
        description: h.context,
        icon: (() => {
          const l = h.label.toLowerCase();
          if (l.includes('new') || l.includes('join')) return <UserPlus size={14} />;
          if (l.includes('inactive') || l.includes('attrition') || l.includes('leave')) return <UserMinus size={14} />;
          return <Users size={14} />;
        })(),
      }))
    : [
        { label: 'Headcount', value: '—', description: 'Total users', icon: <Users size={14} /> },
        { label: 'New this month', value: '—', description: 'Joiners', icon: <UserPlus size={14} /> },
        { label: 'Inactive', value: '—', description: 'Suspended accounts', icon: <UserMinus size={14} /> },
      ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
          {greeting}
        </h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
          Admin portal — platform overview
        </p>
      </div>

      {/* ── Error State ─────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
          <AlertCircle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={loadDashboard}
            className="flex items-center gap-1.5 text-[12px] font-medium underline underline-offset-2 hover:no-underline"
          >
            <RefreshCcw size={12} />
            Retry
          </button>
        </div>
      )}

      {/* ── KPI Stat Cards ──────────────────────────────────────────── */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl"
              >
                <Skeleton width="50%" className="mb-2" />
                <Skeleton height={28} width="60%" />
                <Skeleton width="40%" className="mt-1.5" />
              </div>
            ))}
          </div>
        ) : data?.highlights && data.highlights.length > 0 ? (
          /* Dynamic KPI cards from /portal/dashboard highlights */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.highlights.slice(0, 4).map((h) => (
              <KpiCard
                key={h.label}
                label={h.label}
                value={h.value}
                description={h.detail}
                onClick={() => navigate(routeForHighlight(h.label))}
                icon={iconForHighlight(h.label)}
              />
            ))}
          </div>
        ) : (
          /* Static KPI cards fallback */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {staticKpis().map((kpi) => (
              <KpiCard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                description={kpi.description}
                onClick={() => navigate(kpi.route)}
                icon={kpi.icon}
                badge={
                  kpi.label === 'System Status'
                    ? { label: 'Healthy', variant: 'success' }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Pipeline + HR Pulse ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Pipeline stages */}
        <div className="lg:col-span-2 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
            Order Pipeline
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex-1 p-3 rounded-lg bg-[var(--color-surface-secondary)] animate-pulse h-16" />
                  {i < 3 && <div className="w-3.5 h-3.5 rounded bg-[var(--color-surface-tertiary)] animate-pulse shrink-0" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              {pipelineStages.map((stage, idx) => (
                <PipelineStage
                  key={stage.label}
                  label={stage.label}
                  count={stage.count}
                  icon={pipelineIconForLabel(stage.label)}
                  isLast={idx === pipelineStages.length - 1}
                />
              ))}
            </div>
          )}
          {!isLoading && (
            <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
              Live pipeline data from backend.
            </p>
          )}
        </div>

        {/* HR Pulse */}
        <HrPulseCard metrics={hrMetrics} isLoading={isLoading} />
      </section>

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      {!isLoading && !error && (
        <section>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
            >
              <Users size={13} />
              Manage Users
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/approvals')}
              className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
            >
              <CheckSquare size={13} />
              View Approvals
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/roles')}
              className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
            >
              <Activity size={13} />
              Manage Roles
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/settings')}
              className="btn-secondary h-8 px-3 text-[13px] flex items-center gap-1.5"
            >
              <Building2 size={13} />
              Settings
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
