import { useEffect, useMemo, useState } from 'react';
import {
  BanknotesIcon,
  BoltIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getOperationsInsights } from '../lib/portalApi';
import type { AutomationRun, OperationsInsights, SupplyAlert } from '../types/portal';
import { ResponsiveContainer, ResponsiveGrid } from '../design-system';

/* ── Default data (development fallback) ──────────────────────────── */

const DEFAULT_SUPPLY: SupplyAlert[] = [
  { material: 'Titanium dioxide', status: 'Healthy', detail: 'Inventory cover 23 days' },
  { material: 'Acrylic resin', status: 'Watch', detail: 'Lead times extended 12%' },
  { material: 'ColourBurst pigments', status: 'Critical', detail: 'Demand spike +28% in East coast' },
];

const DEFAULT_AUTOMATIONS: AutomationRun[] = [
  { name: 'Smart replenishment', state: 'Executed recently', description: 'Balanced stock across DCs using ERP and analytics.' },
  { name: 'Dynamic pricing', state: 'Scheduled for 20:00 UTC', description: 'Refreshing pricing ladders for pro dealers.' },
  { name: 'Shift optimizer', state: 'Completed this morning', description: 'Reduced overtime by aligning workforce demand.' },
];

/* ── Status helpers ───────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { dot: string; text: string; bg: string }> = {
  HEALTHY: {
    dot: 'bg-status-success-text',
    text: 'text-status-success-text',
    bg: 'bg-status-success-bg',
  },
  WATCH: {
    dot: 'bg-status-warning-text',
    text: 'text-status-warning-text',
    bg: 'bg-status-warning-bg',
  },
  CRITICAL: {
    dot: 'bg-status-error-text',
    text: 'text-status-error-text',
    bg: 'bg-status-error-bg',
  },
};

function getStatusConfig(status: string) {
  return STATUS_CONFIG[status?.toUpperCase() ?? ''] ?? STATUS_CONFIG.HEALTHY;
}

function StatusDot({ status }: { status: string }) {
  const cfg = getStatusConfig(status);
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status?.toUpperCase() === 'CRITICAL' && (
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dot} opacity-50`} />
      )}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
    </span>
  );
}

/* ── Shimmer Skeleton ─────────────────────────────────────────────── */

function OperationsSkeleton() {
  return (
    <ResponsiveContainer maxWidth="full" className="space-y-10 py-2">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-surface-highlight animate-pulse" />
        <div className="h-8 w-44 rounded bg-surface-highlight animate-pulse" />
        <div className="h-4 w-64 rounded bg-surface-highlight animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-white dark:bg-[#121214] p-6 space-y-3">
            <div className="h-3 w-20 rounded bg-surface-highlight" />
            <div className="h-9 w-28 rounded bg-surface-highlight" />
            <div className="h-3 w-32 rounded bg-surface-highlight" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 animate-pulse rounded-xl border border-border bg-white dark:bg-[#121214] p-6 space-y-4">
          <div className="h-4 w-28 rounded bg-surface-highlight" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-highlight" />
          ))}
        </div>
        <div className="lg:col-span-2 animate-pulse rounded-xl border border-border bg-white dark:bg-[#121214] p-6 space-y-4">
          <div className="h-4 w-24 rounded bg-surface-highlight" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-highlight" />
          ))}
        </div>
      </div>
    </ResponsiveContainer>
  );
}

/* ── Main Component ───────────────────────────────────────────────── */

export default function OperationsControlPage() {
  const { session } = useAuth();
  const [data, setData] = useState<OperationsInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOperationsInsights(session)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load operations data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const supplyAlerts = useMemo<SupplyAlert[]>(
    () => (data?.supplyAlerts?.length ? data.supplyAlerts : DEFAULT_SUPPLY),
    [data],
  );
  const automationRuns = useMemo<AutomationRun[]>(
    () => (data?.automationRuns?.length ? data.automationRuns : DEFAULT_AUTOMATIONS),
    [data],
  );
  const summary = data?.summary;

  if (loading) return <OperationsSkeleton />;

  const kpis = [
    {
      label: 'Production Velocity',
      value: summary ? `${summary.productionVelocity.toFixed(1)}%` : '--',
      detail: '7-day throughput vs plan',
      icon: BoltIcon,
    },
    {
      label: 'Working Capital',
      value: summary ? summary.workingCapital : '--',
      detail: 'Inventory + cash position',
      icon: BanknotesIcon,
    },
    {
      label: 'Logistics SLA',
      value: summary ? `${summary.logisticsSla.toFixed(1)}%` : '--',
      detail: 'Dispatch success rate',
      icon: TruckIcon,
    },
  ];

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-10 py-2">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          Operations
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
          Live Performance
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Real-time KPIs across production, inventory, and logistics.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <section>
        <h2 className="sr-only">Key Performance Indicators</h2>
        <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="relative overflow-hidden rounded-xl border border-border bg-white p-5 transition-shadow hover:shadow-md dark:bg-[#121214] sm:p-6"
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-secondary">
                  {kpi.label}
                </p>
                <kpi.icon className="h-5 w-5 text-tertiary" />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-primary tabular-nums">
                {kpi.value}
              </p>
              <p className="mt-2 text-xs text-tertiary">{kpi.detail}</p>
            </div>
          ))}
        </ResponsiveGrid>
      </section>

      {/* ── Supply Chain & Automation ─────────────────────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Supply Chain Status */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-border bg-white p-5 dark:bg-[#121214] sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-primary sm:text-lg">
                  Supply Chain Status
                </h3>
                <p className="mt-0.5 text-xs text-tertiary">Material availability and lead times</p>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {supplyAlerts.map((item, idx) => {
                const cfg = getStatusConfig(item.status);
                return (
                  <li
                    key={`${item.material}-${idx}`}
                    className="flex items-start gap-4 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors hover:bg-surface-highlight"
                  >
                    <div className="mt-1.5">
                      <StatusDot status={item.status} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-primary truncate">{item.material}</p>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-tertiary">{item.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Automation Activity */}
          <div className="rounded-xl border border-border bg-white p-5 dark:bg-[#121214] sm:p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-primary sm:text-lg">
                  Automation Activity
                </h3>
                <p className="mt-0.5 text-xs text-tertiary">Recent and scheduled automation runs</p>
              </div>
            </div>
            <div className="mt-4 space-y-0">
              {automationRuns.map((run, idx) => (
                <div
                  key={`${run.name}-${idx}`}
                  className="relative flex gap-4 py-4"
                >
                  {/* Timeline connector */}
                  {idx < automationRuns.length - 1 && (
                    <div className="absolute left-[11px] top-10 bottom-0 w-px bg-border" />
                  )}
                  {/* Timeline dot */}
                  <div className="relative flex-shrink-0">
                    {run.state.toLowerCase().includes('completed') || run.state.toLowerCase().includes('executed') ? (
                      <CheckCircleIcon className="h-6 w-6 text-status-success-text" />
                    ) : (
                      <ClockIcon className="h-6 w-6 text-secondary" />
                    )}
                  </div>
                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                      <p className="text-sm font-medium text-primary">{run.name}</p>
                      <p className="text-[11px] font-medium text-tertiary">{run.state}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-secondary leading-relaxed">{run.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-white p-5 dark:bg-[#121214] sm:p-6">
            <div className="border-b border-border pb-4">
              <h3 className="font-display text-base font-semibold text-primary sm:text-lg">
                Recommended Actions
              </h3>
              <p className="mt-0.5 text-xs text-tertiary">Suggested next steps based on current data</p>
            </div>
            <ul className="mt-4 space-y-3">
              <li className="rounded-lg border border-border bg-surface px-4 py-3.5">
                <p className="text-sm text-primary leading-relaxed">
                  Review materials with low inventory cover and initiate replenishment workflows where needed.
                </p>
              </li>
              <li className="rounded-lg border border-border bg-surface px-4 py-3.5">
                <p className="text-sm text-primary leading-relaxed">
                  Monitor automation runs that are behind schedule and reassign resources if necessary.
                </p>
              </li>
              <li className="rounded-lg border border-border bg-surface px-4 py-3.5">
                <p className="text-sm text-primary leading-relaxed">
                  Use the working capital snapshot to review and adjust dealer credit policies.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </ResponsiveContainer>
  );
}
