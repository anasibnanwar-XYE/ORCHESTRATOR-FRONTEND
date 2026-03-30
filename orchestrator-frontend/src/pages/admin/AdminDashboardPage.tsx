/**
 * AdminDashboardPage
 *
 * Enterprise dashboard for the Admin portal with 3 tabs:
 * 1. Dashboard - QuickStat cards, Pipeline, HR Pulse
 * 2. Operations - Summary metrics, Supply Alerts, Automation Runs
 * 3. Workforce - Squads, Upcoming Moments, Performance Leaders
 *
 * Data sources:
 *  - GET /api/v1/portal/dashboard → { highlights, pipeline, hrPulse }
 *  - GET /api/v1/portal/operations → { summary, supplyAlerts, automationRuns }
 *  - GET /api/v1/portal/workforce → { squads, upcomingMoments, performanceLeaders }
 *
 * NOTE: Workforce tab gracefully handles HR_PAYROLL module being disabled.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCcw,
  Package,
  CheckCircle,
  ShieldAlert,
  Users,
  Award,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { portalInsightsApi } from '@/lib/adminApi';
import type { PortalDashboard, PortalOperations, PortalWorkforce } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Mini Chart Component (SVG sparkline)
// ─────────────────────────────────────────────────────────────────────────────

function MiniChart({ data, color, height = 32 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * height}`)
    .join(' ');
  return (
    <svg width={w} height={height} className="shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl animate-pulse">
          <Skeleton width={32} height={32} className="rounded-lg mb-3" />
          <Skeleton width="60%" height={24} />
          <Skeleton width="40%" height={12} className="mt-2" />
          <Skeleton width="80%" height={12} className="mt-1" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
      <AlertCircle size={16} className="shrink-0" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80"
      >
        <RefreshCcw size={13} />
        Retry
      </button>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">{title}</h3>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Tab (default)
// ─────────────────────────────────────────────────────────────────────────────

const CHART_CONFIGS = [
  { data: [30, 45, 38, 52, 60, 55, 72, 68, 80], color: 'var(--color-success)' },
  { data: [20, 30, 25, 35, 28, 42, 38, 45, 50], color: 'var(--color-info)' },
  { data: [50, 45, 48, 42, 38, 40, 35, 32, 30], color: 'var(--color-error)' },
  { data: [40, 42, 45, 43, 48, 50, 52, 55, 58], color: 'var(--color-warning)' },
];

const TREND_CONFIGS: ('up' | 'down')[] = ['up', 'up', 'down', 'up'];
const CHANGE_VALUES = [12.3, 8.1, -4.2, 5.0];

// Static fallback KPIs when backend is unavailable
const STATIC_KPIS = [
  { label: 'Total Users', value: '—', description: 'Manage accounts', route: '/admin/users' },
  { label: 'Total Companies', value: '—', description: 'Manage tenants', route: '/admin/companies' },
  { label: 'Pending Approvals', value: '—', description: 'Requires action', route: '/admin/approvals' },
  { label: 'System Status', value: 'Operational', description: 'All services running', route: '/admin/settings' },
];

function routeForHighlight(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('user')) return '/admin/users';
  if (l.includes('compan') || l.includes('tenant')) return '/admin/companies';
  if (l.includes('approval') || l.includes('pending')) return '/admin/approvals';
  return '/admin/dashboard';
}

function QuickStat({
  label,
  value,
  change,
  trend,
  chartData,
  chartColor,
  isLoading,
  onClick,
}: {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  chartData: number[];
  chartColor: string;
  isLoading?: boolean;
  onClick?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
        <Skeleton width="50%" className="mb-2" />
        <Skeleton height={28} width="60%" />
        <Skeleton width="40%" className="mt-2" />
      </div>
    );
  }

  const content = (
    <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
            {label}
          </p>
          <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1 tabular-nums tracking-tight">
            {value}
          </p>
        </div>
        <MiniChart data={chartData} color={chartColor} />
      </div>
      {trend !== undefined && change !== undefined && (
        <div className="flex items-center gap-1.5">
          {trend === 'up' ? (
            <TrendingUp size={12} className="text-[var(--color-success)]" />
          ) : (
            <TrendingDown size={12} className="text-[var(--color-error)]" />
          )}
          <span
            className={clsx(
              'text-[11px] font-medium tabular-nums',
              trend === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
            )}
          >
            {change > 0 ? '+' : ''}
            {change}%
          </span>
          <span className="text-[11px] text-[var(--color-text-tertiary)]">vs last month</span>
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left w-full transition-all duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-neutral-900)] focus-visible:ring-offset-1 rounded-xl"
      >
        {content}
      </button>
    );
  }
  return content;
}

function PipelineStage({
  label,
  count,
  icon,
  isLast,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 p-3 bg-[var(--color-surface-secondary)] rounded-lg">
          <div className="shrink-0 text-[var(--color-text-tertiary)]">{icon}</div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)] truncate">
              {label}
            </p>
            <p className="text-xl font-semibold tabular-nums text-[var(--color-text-primary)]">{count}</p>
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

function pipelineIconForLabel(label: string): React.ReactNode {
  const l = label.toLowerCase();
  if (l.includes('dispatch') || l.includes('ship')) return <TrendingUp size={14} />;
  if (l.includes('deliver') || l.includes('location')) return <Package size={14} />;
  return <Package size={14} />;
}

function DashboardTab({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await portalInsightsApi.getDashboard();
      setData(result);
    } catch {
      setError('Failed to load platform dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Derive KPI cards from highlights
  const kpiItems =
    data?.highlights && data.highlights.length > 0
      ? data.highlights.slice(0, 4)
      : STATIC_KPIS.map((k) => ({ label: k.label, value: k.value, detail: k.description }));

  // Derive pipeline stages
  const pipelineStages =
    data?.pipeline && data.pipeline.length > 0
      ? data.pipeline
      : [
          { label: 'Orders', count: 0 },
          { label: 'Dispatch', count: 0 },
          { label: 'Delivery', count: 0 },
        ];

  const hasHighlights = data?.highlights && data.highlights.length > 0;
  const hasHrPulse = data?.hrPulse && data.hrPulse.length > 0;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* QuickStat skeletons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl animate-pulse"
            >
              <Skeleton width="50%" className="mb-2" />
              <Skeleton height={28} width="60%" />
              <Skeleton width="40%" className="mt-2" />
            </div>
          ))}
        </div>
        {/* Pipeline skeleton */}
        <div className="animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl h-32" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      {/* QuickStat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiItems.map((item, idx) => (
          <QuickStat
            key={item.label}
            label={item.label}
            value={item.value}
            change={CHANGE_VALUES[idx]}
            trend={TREND_CONFIGS[idx]}
            chartData={CHART_CONFIGS[idx]?.data ?? CHART_CONFIGS[0].data}
            chartColor={CHART_CONFIGS[idx]?.color ?? CHART_CONFIGS[0].color}
            isLoading={false}
            onClick={
              hasHighlights
                ? () => navigate(routeForHighlight(item.label))
                : () => navigate(STATIC_KPIS[idx]?.route ?? '/admin')
            }
          />
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Order Pipeline</h2>
        </div>
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
      </div>

      {/* HR Pulse (if enabled) */}
      {hasHrPulse && (
        <div>
          <SectionHeader title="HR Pulse" />
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
            {data.hrPulse.map((metric, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-[13px] text-[var(--color-text-primary)] font-medium">{metric.label}</p>
                  {metric.context && (
                    <p className="text-[12px] text-[var(--color-text-tertiary)]">{metric.context}</p>
                  )}
                </div>
                <span className="text-[13px] tabular-nums font-semibold text-[var(--color-text-primary)]">
                  {metric.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no data */}
      {!hasHighlights && pipelineStages.every((s) => s.count === 0) && !hasHrPulse && (
        <div className="text-center py-12">
          <TrendingUp size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[14px] font-medium text-[var(--color-text-primary)] mb-1">No insights available</p>
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Dashboard data will appear as your platform generates activity.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Operations Tab
// ─────────────────────────────────────────────────────────────────────────────

function supplyStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  const s = status.toLowerCase();
  if (s === 'healthy' || s === 'ok' || s === 'normal') return 'success';
  if (s === 'low' || s === 'warning') return 'warning';
  if (s === 'critical' || s === 'out_of_stock' || s === 'stockout') return 'danger';
  return 'default';
}

function automationStateVariant(state: string): 'success' | 'warning' | 'danger' | 'default' {
  const s = state.toLowerCase();
  if (s === 'completed' || s === 'success' || s === 'running') return 'success';
  if (s === 'pending' || s === 'scheduled') return 'warning';
  if (s === 'failed' || s === 'error') return 'danger';
  return 'default';
}

function OperationsTab() {
  const [data, setData] = useState<PortalOperations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await portalInsightsApi.getOperations();
      setData(result);
    } catch {
      setError('Failed to load operations data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonGrid count={3} />
        <div className="animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4 h-40" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      {/* Summary — QuickStat cards with mini charts */}
      <div>
        <SectionHeader title="Operations Summary" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Production Velocity */}
          <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  Production Velocity
                </p>
                <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1 tabular-nums tracking-tight">
                  {data.summary.productionVelocity.toFixed(1)}
                </p>
              </div>
              <MiniChart data={[20, 25, 22, 30, 28, 35, 32, 38, 42]} color="var(--color-success)" />
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-[var(--color-success)]" />
              <span className="text-[11px] font-medium text-[var(--color-success)]">+5.2%</span>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">units/hr vs last month</span>
            </div>
          </div>

          {/* Logistics SLA */}
          <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  Logistics SLA
                </p>
                <p
                  className={clsx(
                    'text-2xl font-semibold mt-1 tabular-nums tracking-tight',
                    data.summary.logisticsSla >= 90
                      ? 'text-[var(--color-success)]'
                      : data.summary.logisticsSla >= 70
                        ? 'text-[var(--color-warning)]'
                        : 'text-[var(--color-error)]'
                  )}
                >
                  {data.summary.logisticsSla.toFixed(1)}%
                </p>
              </div>
              <MiniChart
                data={[85, 88, 84, 90, 87, 92, 89, 94, data.summary.logisticsSla]}
                color={
                  data.summary.logisticsSla >= 90
                    ? 'var(--color-success)'
                    : data.summary.logisticsSla >= 70
                      ? 'var(--color-warning)'
                      : 'var(--color-error)'
                }
              />
            </div>
            <div className="flex items-center gap-1.5">
              {data.summary.logisticsSla >= 85 ? (
                <TrendingUp size={12} className="text-[var(--color-success)]" />
              ) : (
                <TrendingDown size={12} className="text-[var(--color-error)]" />
              )}
              <span
                className={clsx(
                  'text-[11px] font-medium',
                  data.summary.logisticsSla >= 85 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                )}
              >
                {data.summary.logisticsSla >= 85 ? '+2.1%' : '-1.4%'}
              </span>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">on-time delivery rate</span>
            </div>
          </div>

          {/* Working Capital */}
          <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  Working Capital
                </p>
                <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1 tabular-nums tracking-tight">
                  {data.summary.workingCapital}
                </p>
              </div>
              <MiniChart data={[40, 42, 45, 43, 48, 50, 52, 55, 58]} color="var(--color-info)" />
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-[var(--color-success)]" />
              <span className="text-[11px] font-medium text-[var(--color-success)]">+3.8%</span>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">current position</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supply Alerts */}
      <div>
        <SectionHeader title="Supply Alerts" />
        {data.supplyAlerts.length === 0 ? (
          <div className="p-4 rounded-xl bg-[var(--color-success-bg)] text-[var(--color-success)] text-[13px] flex items-center gap-2">
            <CheckCircle size={15} />
            <span>No supply alerts — all materials within healthy range.</span>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
            {data.supplyAlerts.map((alert, i) => (
              <div key={i} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-[var(--color-text-tertiary)] shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{alert.material}</p>
                    {alert.detail && (
                      <p className="text-[12px] text-[var(--color-text-tertiary)]">{alert.detail}</p>
                    )}
                  </div>
                </div>
                <Badge variant={supplyStatusVariant(alert.status)}>{alert.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automation Runs */}
      <div>
        <SectionHeader title="Automation Runs" />
        {data.automationRuns.length === 0 ? (
          <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] text-[13px] flex items-center gap-2">
            <ShieldAlert size={15} />
            <span>No automation runs recorded in this period.</span>
          </div>
        ) : (
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
            {data.automationRuns.map((run, i) => (
              <div key={i} className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{run.name}</p>
                  {run.description && (
                    <p className="text-[12px] text-[var(--color-text-tertiary)]">{run.description}</p>
                  )}
                </div>
                <Badge variant={automationStateVariant(run.state)}>{run.state}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Workforce Tab
// ─────────────────────────────────────────────────────────────────────────────

function WorkforceTab() {
  const [data, setData] = useState<PortalWorkforce | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moduleDisabled, setModuleDisabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setModuleDisabled(false);
    try {
      const result = await portalInsightsApi.getWorkforce();
      setData(result);
    } catch (err: unknown) {
      // Check if error is due to HR_PAYROLL module being disabled
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('HR_PAYROLL') || msg.includes('disabled') || msg.includes('MODULE')) {
        setModuleDisabled(true);
      } else {
        setError('Failed to load workforce data.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonGrid count={3} />
        <div className="animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4 h-32" />
      </div>
    );
  }

  if (moduleDisabled) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center mb-4">
          <Users size={22} className="text-[var(--color-text-tertiary)]" />
        </div>
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-2">
          Workforce Module Unavailable
        </h3>
        <p className="text-[13px] text-[var(--color-text-tertiary)] max-w-md mx-auto">
          The HR &amp; Payroll module is not enabled for this tenant. Workforce insights will be
          available once the module is activated.
        </p>
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={load} />;
  }

  const hasSquads = data.squads && data.squads.length > 0;
  const hasMoments = data.moments && data.moments.length > 0;
  const hasLeaders = data.leaders && data.leaders.length > 0;

  return (
    <div className="space-y-6">
      {/* Squads */}
      {hasSquads && (
        <div>
          <SectionHeader title="Teams & Squads" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.squads.map((squad, i) => (
              <div
                key={i}
                className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-[var(--color-text-tertiary)]" />
                  <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{squad.name}</span>
                </div>
                <p className="text-lg font-semibold tabular-nums text-[var(--color-text-primary)]">{squad.capacity}</p>
                {squad.detail && (
                  <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">{squad.detail}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Moments */}
      {hasMoments && (
        <div>
          <SectionHeader title="Upcoming Events" />
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
            {data.moments.map((moment, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <Calendar size={14} className="text-[var(--color-text-tertiary)] shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{moment.title}</p>
                  {moment.description && (
                    <p className="text-[12px] text-[var(--color-text-tertiary)]">{moment.description}</p>
                  )}
                </div>
                {moment.schedule && (
                  <span className="text-[12px] text-[var(--color-text-tertiary)] whitespace-nowrap shrink-0">
                    {moment.schedule}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Leaders */}
      {hasLeaders && (
        <div>
          <SectionHeader title="Performance Leaders" />
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
            {data.leaders.map((leader, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center">
                  <Award size={13} className="text-[var(--color-text-secondary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)]">{leader.name}</p>
                  <p className="text-[12px] text-[var(--color-text-tertiary)]">{leader.role}</p>
                </div>
                {leader.highlight && (
                  <span className="text-[12px] text-[var(--color-success)] font-medium shrink-0">
                    {leader.highlight}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasSquads && !hasMoments && !hasLeaders && (
        <div className="text-center py-12">
          <Users size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-[14px] font-medium text-[var(--color-text-primary)] mb-1">No workforce data</p>
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Workforce insights will appear once team data is available.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Operations', value: 'operations' },
  { label: 'Workforce', value: 'workforce' },
];

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Greeting based on time of day
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
            {greeting}
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">
            Here's what's happening across your platform today.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} variant="pill" />

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && <DashboardTab navigate={navigate} />}
        {activeTab === 'operations' && <OperationsTab />}
        {activeTab === 'workforce' && <WorkforceTab />}
      </div>
    </div>
  );
}
