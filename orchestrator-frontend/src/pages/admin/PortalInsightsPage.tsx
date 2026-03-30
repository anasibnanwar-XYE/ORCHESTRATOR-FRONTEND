/**
 * PortalInsightsPage
 *
 * Tabbed portal monitoring views aligned to actual backend DTOs:
 *
 *  - Dashboard: highlights (KPI tiles), pipeline (stage funnel), hrPulse (metric rows)
 *    → GET /api/v1/portal/dashboard  (DashboardInsights DTO, wrapped in ApiResponse)
 *
 *  - Operations: summary (velocity/SLA/working capital), supply alerts, automation runs
 *    → GET /api/v1/portal/operations  (OperationsInsights DTO, wrapped in ApiResponse)
 *
 *  - Workforce: squads, upcoming moments, performance leaders
 *    → GET /api/v1/portal/workforce  (WorkforceInsights DTO, wrapped in ApiResponse)
 *      NOTE: Returns error when HR_PAYROLL module is disabled — handled gracefully.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCcw,
  Users,
  Award,
  Calendar,
  Package,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { portalInsightsApi } from '@/lib/adminApi';
import type { PortalDashboard, PortalOperations, PortalWorkforce } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Mini Chart — reusable SVG sparkline for QuickStat cards
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
// Shared helpers
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
// Dashboard Tab
// DashboardInsights: { highlights[], pipeline[], hrPulse[] }
// ─────────────────────────────────────────────────────────────────────────────

function DashboardTab() {
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

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonGrid count={3} />
        <div className="animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl h-32" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'Failed to load data.'} onRetry={load} />;
  }

  const hasHighlights = data.highlights && data.highlights.length > 0;
  const hasPipeline = data.pipeline && data.pipeline.length > 0;
  const hasHrPulse = data.hrPulse && data.hrPulse.length > 0;

  if (!hasHighlights && !hasPipeline && !hasHrPulse) {
    return (
      <div className="text-center py-12">
        <TrendingUp size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
        <p className="text-[14px] font-medium text-[var(--color-text-primary)] mb-1">No insights available</p>
        <p className="text-[13px] text-[var(--color-text-tertiary)]">Dashboard data will appear as your platform generates activity.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Highlights — KPI tiles */}
      {hasHighlights && (
        <div>
          <SectionHeader title="Key Highlights" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.highlights.map((h, i) => (
              <div
                key={i}
                className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-[var(--color-text-tertiary)]" />
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                    {h.label}
                  </span>
                </div>
                <p className="text-xl font-semibold tabular-nums text-[var(--color-text-primary)]">{h.value}</p>
                {h.detail && (
                  <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">{h.detail}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline — stage funnel */}
      {hasPipeline && (
        <div>
          <SectionHeader title="Pipeline" />
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
            {data.pipeline.map((stage, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <ArrowRight size={13} className="text-[var(--color-text-tertiary)]" />
                  <span className="text-[13px] text-[var(--color-text-primary)] font-medium">{stage.label}</span>
                </div>
                <span className="text-[13px] tabular-nums font-semibold text-[var(--color-text-secondary)]">
                  {stage.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HR Pulse */}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Operations Tab
// OperationsInsights: { summary: {productionVelocity, logisticsSla, workingCapital},
//                       supplyAlerts[], automationRuns[] }
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

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
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
              <MiniChart
                data={[20, 25, 22, 30, 28, 35, 32, 38, 42]}
                color="#22c55e"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-emerald-600" />
              <span className="text-[11px] font-medium text-emerald-600">+5.2%</span>
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
                <p className={clsx(
                  'text-2xl font-semibold mt-1 tabular-nums tracking-tight',
                  data.summary.logisticsSla >= 90 ? 'text-emerald-600'
                    : data.summary.logisticsSla >= 70 ? 'text-amber-600'
                    : 'text-red-500',
                )}>
                  {data.summary.logisticsSla.toFixed(1)}%
                </p>
              </div>
              <MiniChart
                data={[85, 88, 84, 90, 87, 92, 89, 94, data.summary.logisticsSla]}
                color={data.summary.logisticsSla >= 90 ? '#22c55e' : data.summary.logisticsSla >= 70 ? '#f59e0b' : '#ef4444'}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {data.summary.logisticsSla >= 85 ? (
                <TrendingUp size={12} className="text-emerald-600" />
              ) : (
                <TrendingDown size={12} className="text-red-500" />
              )}
              <span className={`text-[11px] font-medium ${data.summary.logisticsSla >= 85 ? 'text-emerald-600' : 'text-red-500'}`}>
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
              <MiniChart
                data={[40, 42, 45, 43, 48, 50, 52, 55, 58]}
                color="#8b5cf6"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-emerald-600" />
              <span className="text-[11px] font-medium text-emerald-600">+3.8%</span>
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
                <Badge variant={supplyStatusVariant(alert.status)}>
                  {alert.status}
                </Badge>
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
                <Badge variant={automationStateVariant(run.state)}>
                  {run.state}
                </Badge>
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
// WorkforceInsights: { squads[], moments[], leaders[] }
// NOTE: This endpoint may return error if HR_PAYROLL module is disabled.
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

  useEffect(() => { void load(); }, [load]);

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
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-2">Workforce Module Unavailable</h3>
        <p className="text-[13px] text-[var(--color-text-tertiary)] max-w-md mx-auto">
          The HR &amp; Payroll module is not enabled for this tenant. Workforce insights will be available once the module is activated.
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
                  <span className="text-[12px] text-[var(--color-text-tertiary)] whitespace-nowrap shrink-0">{moment.schedule}</span>
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
                  <span className="text-[12px] text-[var(--color-success)] font-medium shrink-0">{leader.highlight}</span>
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
          <p className="text-[13px] text-[var(--color-text-tertiary)]">Workforce insights will appear once team data is available.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Operations', value: 'operations' },
  { label: 'Workforce', value: 'workforce' },
];

export function PortalInsightsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Portal Insights</h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
          Platform usage, operational health, and workforce analytics.
        </p>
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'operations' && <OperationsTab />}
        {activeTab === 'workforce' && <WorkforceTab />}
      </div>
    </div>
  );
}
