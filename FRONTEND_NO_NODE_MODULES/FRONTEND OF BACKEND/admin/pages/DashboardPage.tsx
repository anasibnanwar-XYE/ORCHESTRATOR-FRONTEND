import { useEffect, useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  TruckIcon,
  MapIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getDashboardInsights, getWorkforceInsights } from '../lib/portalApi';
import type { DashboardInsights, WorkforceInsights } from '../types/portal';
import { ResponsiveContainer, ResponsiveGrid } from '../design-system';
import { formatCurrency, formatDate } from '../lib/formatUtils';

/* ── Helpers ──────────────────────────────────────────────────────── */

const formatPercent = (val: number) => `${val.toFixed(1)}%`;

function TrendBadge({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-tertiary">--</span>;
  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
        positive
          ? 'bg-status-success-bg text-status-success-text'
          : 'bg-status-error-bg text-status-error-text'
      }`}
    >
      {positive ? (
        <ArrowTrendingUpIcon className="h-3 w-3" />
      ) : (
        <ArrowTrendingDownIcon className="h-3 w-3" />
      )}
      {formatPercent(Math.abs(value))}
    </span>
  );
}

function AlertIcon({ type }: { type: string }) {
  switch (type) {
    case 'CRITICAL':
      return <XCircleIcon className="h-4 w-4 flex-shrink-0" />;
    case 'WARNING':
      return <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />;
    default:
      return <InformationCircleIcon className="h-4 w-4 flex-shrink-0" />;
  }
}

function alertClasses(type: string) {
  switch (type) {
    case 'CRITICAL':
      return 'border-l-2 border-l-status-error-text bg-status-error-bg text-status-error-text';
    case 'WARNING':
      return 'border-l-2 border-l-status-warning-text bg-status-warning-bg text-status-warning-text';
    default:
      return 'border-l-2 border-l-status-info-text bg-status-info-bg text-status-info-text';
  }
}

/* ── Shimmer Skeleton ─────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <ResponsiveContainer maxWidth="full" className="space-y-10 py-2">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-surface-highlight animate-pulse" />
        <div className="h-8 w-56 rounded bg-surface-highlight animate-pulse" />
        <div className="h-4 w-72 rounded bg-surface-highlight animate-pulse" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-border bg-surface p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-surface-highlight" />
              <div className="h-8 w-8 rounded-lg bg-surface-highlight" />
            </div>
            <div className="h-8 w-28 rounded bg-surface-highlight" />
            <div className="h-3 w-32 rounded bg-surface-highlight" />
          </div>
        ))}
      </div>

      {/* Two-column skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 animate-pulse rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="h-4 w-32 rounded bg-surface-highlight" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-full rounded bg-surface-highlight" />
              <div className="h-2 w-full rounded-full bg-surface-highlight" />
            </div>
          ))}
        </div>
        <div className="animate-pulse rounded-xl border border-border bg-surface p-6 space-y-4">
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

export default function DashboardPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardInsights | null>(null);
  const [workforce, setWorkforce] = useState<WorkforceInsights | null>(null);

  useEffect(() => {
    async function load() {
      if (!session) return;
      try {
        const insights = await getDashboardInsights(session);
        setData(insights);
      } catch {
        setError('Unable to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    async function loadWorkforce() {
      if (!session) return;
      try {
        const wf = await getWorkforceInsights(session);
        setWorkforce(wf);
      } catch {
        // Workforce insights is supplementary — silently ignore failures
      }
    }
    load();
    loadWorkforce();
  }, [session]);

  if (loading) return <DashboardSkeleton />;

  const highlights = data?.highlights || [];
  const pipeline = data?.pipeline || [];
  const hrPulse = data?.hrPulse || [];
  const enterprise = data?.enterprise;

  const findMetric = (part: string) =>
    highlights.find((h) => h.label.toLowerCase().includes(part.toLowerCase()));

  const revenueMetric = findMetric('Revenue') || { value: '--', detail: 'No data' };
  const slaMetric = findMetric('SLA') || { value: '0%', detail: 'No data' };
  const workforceMetric = findMetric('workforce') || { value: '0', detail: 'No data' };
  const dealerMetric = findMetric('Dealer') || { value: '0', detail: 'No data' };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-10 py-2">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-secondary">
          {todayLabel}
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Here is your organization overview at a glance.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          <XCircleIcon className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Key Metrics ───────────────────────────────────────────── */}
      <section>
        <h2 className="sr-only">Key Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Revenue */}
          <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-secondary">Revenue</p>
              <div className="rounded-lg bg-status-success-bg p-2 text-status-success-text">
                <ArrowTrendingUpIcon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {revenueMetric.value}
            </p>
            <p className="mt-1 text-xs text-tertiary">{revenueMetric.detail}</p>
          </div>

          {/* Fulfilment SLA */}
          <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-secondary">Fulfilment SLA</p>
              <div className="rounded-lg bg-status-info-bg p-2 text-status-info-text">
                <TruckIcon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {slaMetric.value}
            </p>
            <p className="mt-1 text-xs text-tertiary">{slaMetric.detail}</p>
          </div>

          {/* Active Workforce */}
          <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-secondary">Workforce</p>
              <div className="rounded-lg bg-surface-highlight p-2 text-secondary">
                <UserGroupIcon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {workforceMetric.value}
            </p>
            <p className="mt-1 text-xs text-tertiary">{workforceMetric.detail}</p>
          </div>

          {/* Dealer Coverage */}
          <div className="group relative overflow-hidden rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-secondary">Dealer Coverage</p>
              <div className="rounded-lg bg-status-warning-bg p-2 text-status-warning-text">
                <MapIcon className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              {dealerMetric.value}
            </p>
            <p className="mt-1 text-xs text-tertiary">{dealerMetric.detail}</p>
          </div>
        </div>
      </section>

      {/* ── Production Pipeline & Organization Health ─────────────── */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Production Pipeline */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-primary sm:text-lg">
                Production Pipeline
              </h3>
              <p className="mt-0.5 text-xs text-tertiary">Current batch progress by stage</p>
            </div>
            <ChartBarIcon className="h-5 w-5 text-tertiary" />
          </div>
          <div className="mt-5 space-y-5">
            {pipeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-tertiary">No active production data.</p>
            ) : (
              pipeline.map((stage, idx) => {
                const pct = Math.min((stage.count / 20) * 100, 100);
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-primary">{stage.label}</span>
                      <span className="font-display text-sm font-semibold text-primary tabular-nums">
                        {stage.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-highlight">
                      <div
                        className="h-full rounded-full bg-action-bg transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Organization Health */}
        <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <div className="border-b border-border pb-4">
            <h3 className="font-display text-base font-semibold text-primary sm:text-lg">
              Organization Health
            </h3>
            <p className="mt-0.5 text-xs text-tertiary">Key people metrics</p>
          </div>
          <div className="mt-5 space-y-3">
            {hrPulse.length === 0 ? (
              <p className="py-6 text-center text-sm text-tertiary">No data available.</p>
            ) : (
              hrPulse.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-primary truncate">{metric.label}</p>
                    <p className="text-xs text-tertiary truncate">{metric.context}</p>
                  </div>
                  <span className="ml-3 flex-shrink-0 font-display text-lg font-semibold text-primary tabular-nums">
                    {metric.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Workforce Insights ────────────────────────────────────── */}
      {workforce && (
        <section>
          <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-secondary">
            Workforce
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Squads */}
            {workforce.squads && workforce.squads.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <h3 className="mb-4 font-display text-sm font-semibold text-primary">Squads</h3>
                <div className="space-y-3">
                  {workforce.squads.map((squad, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">{squad.name}</p>
                        <p className="truncate text-xs text-tertiary">{squad.detail}</p>
                      </div>
                      <span className="ml-3 flex-shrink-0 text-sm font-semibold text-secondary tabular-nums">
                        {squad.capacity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Moments */}
            {workforce.moments && workforce.moments.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <h3 className="mb-4 font-display text-sm font-semibold text-primary">Upcoming</h3>
                <div className="space-y-3">
                  {workforce.moments.map((moment, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface px-4 py-3">
                      <p className="text-sm font-medium text-primary">{moment.title}</p>
                      <p className="mt-0.5 text-xs text-secondary">{moment.schedule}</p>
                      <p className="mt-1 text-xs text-tertiary">{moment.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Performance Leaders */}
            {workforce.leaders && workforce.leaders.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                <h3 className="mb-4 font-display text-sm font-semibold text-primary">Top Performers</h3>
                <div className="space-y-3">
                  {workforce.leaders.map((leader, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-surface-highlight">
                        <UserGroupIcon className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">{leader.name}</p>
                        <p className="truncate text-xs text-secondary">{leader.role}</p>
                        <p className="mt-0.5 text-xs text-tertiary">{leader.highlight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Enterprise Dashboard ──────────────────────────────────── */}
      {enterprise && (
        <>
          {/* Period Header */}
          <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Reporting Period
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-primary">
                  {formatDate(enterprise.window.periodStart)} &mdash; {formatDate(enterprise.window.periodEnd)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-tertiary">Revenue</p>
                  <p className="font-display text-sm font-semibold text-primary tabular-nums">
                    {formatCurrency(enterprise.window.revenue)}
                  </p>
                  <TrendBadge value={enterprise.trends.revenueTrendPercent} />
                </div>
                <div>
                  <p className="text-xs text-tertiary">COGS</p>
                  <p className="font-display text-sm font-semibold text-primary tabular-nums">
                    {formatCurrency(enterprise.window.cogs)}
                  </p>
                  <TrendBadge value={enterprise.trends.cogsTrendPercent} />
                </div>
                <div>
                  <p className="text-xs text-tertiary">Gross Margin</p>
                  <p className="font-display text-sm font-semibold text-primary tabular-nums">
                    {formatCurrency(enterprise.window.grossMargin)}
                  </p>
                  <span className="text-xs text-secondary">{formatPercent(enterprise.ratios.grossMarginPercent)}</span>
                </div>
                <div>
                  <p className="text-xs text-tertiary">Net Profit</p>
                  <p className="font-display text-sm font-semibold text-primary tabular-nums">
                    {formatCurrency(enterprise.window.netProfit)}
                  </p>
                  <TrendBadge value={enterprise.trends.netProfitTrendPercent} />
                </div>
              </div>
            </div>
          </section>

          {/* Financial & Operations KPIs */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-secondary">
              Financial &amp; Operations
            </h2>
            <ResponsiveGrid cols={{ mobile: 2, tablet: 2, desktop: 4 }} gap="sm">
              <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs text-tertiary">Working Capital</p>
                <p className="mt-2 font-display text-xl font-semibold text-primary tabular-nums">
                  {formatCurrency(enterprise.financial.workingCapital)}
                </p>
                <p className="mt-1 text-[11px] text-tertiary">Available liquidity</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs text-tertiary">Current Ratio</p>
                <p className="mt-2 font-display text-xl font-semibold text-primary tabular-nums">
                  {enterprise.financial.currentRatio.toFixed(2)}
                </p>
                <p className="mt-1 text-[11px] text-tertiary">Liquidity health</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs text-tertiary">On-Time Delivery</p>
                <p className="mt-2 font-display text-xl font-semibold text-primary tabular-nums">
                  {formatPercent(enterprise.operations.onTimeDeliveryPercent)}
                </p>
                <p className="mt-1 text-[11px] text-tertiary">SLA compliance</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
                <p className="text-xs text-tertiary">Production Efficiency</p>
                <p className="mt-2 font-display text-xl font-semibold text-primary tabular-nums">
                  {formatPercent(enterprise.operations.productionEfficiencyPercent)}
                </p>
                <p className="mt-1 text-[11px] text-tertiary">Output vs plan</p>
              </div>
            </ResponsiveGrid>
          </section>

          {/* Sales & Financial Ratios */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Sales Performance */}
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <div className="border-b border-border pb-4">
                <h3 className="font-display text-base font-semibold text-primary sm:text-lg">
                  Sales Performance
                </h3>
              </div>
              <div className="mt-5 space-y-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-secondary">Total Sales</span>
                  <span className="font-display text-sm font-semibold text-primary tabular-nums">
                    {formatCurrency(enterprise.sales.totalSales)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-secondary">vs Budget</span>
                  <span className="font-display text-sm font-semibold text-primary tabular-nums">
                    {formatPercent(enterprise.sales.salesVsBudgetPercent)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-secondary">Avg Order Value</span>
                  <span className="font-display text-sm font-semibold text-primary tabular-nums">
                    {formatCurrency(enterprise.sales.averageOrderValue)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-secondary">Top Category</span>
                  <span className="text-sm font-medium text-primary">{enterprise.sales.topCategory}</span>
                </div>

                {enterprise.sales.channelMix.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-secondary">
                      Channel Mix
                    </p>
                    <div className="space-y-2">
                      {enterprise.sales.channelMix.slice(0, 3).map((ch, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm text-secondary">{ch.channel}</span>
                          <div className="flex items-center gap-3">
                            <div className="hidden h-1 w-16 overflow-hidden rounded-full bg-surface-highlight sm:block">
                              <div
                                className="h-full rounded-full bg-action-bg"
                                style={{ width: `${ch.sharePercent}%` }}
                              />
                            </div>
                            <span className="font-display text-xs font-semibold text-primary tabular-nums w-12 text-right">
                              {formatPercent(ch.sharePercent)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Ratios */}
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
              <div className="border-b border-border pb-4">
                <h3 className="font-display text-base font-semibold text-primary sm:text-lg">
                  Financial Ratios
                </h3>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-secondary">Gross Margin</span>
                    <span className="font-display text-sm font-semibold text-primary tabular-nums">
                      {formatPercent(enterprise.ratios.grossMarginPercent)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <TrendBadge value={enterprise.trends.grossMarginTrendPercent} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-secondary">Operating Margin</span>
                    <span className="font-display text-sm font-semibold text-primary tabular-nums">
                      {formatPercent(enterprise.ratios.operatingMarginPercent)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <TrendBadge value={enterprise.trends.operatingExpenseTrendPercent} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-secondary">Net Margin</span>
                    <span className="font-display text-sm font-semibold text-primary tabular-nums">
                      {formatPercent(enterprise.ratios.netMarginPercent)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <TrendBadge value={enterprise.trends.netProfitTrendPercent} />
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-secondary">Debt / Equity</span>
                    <span className="font-display text-sm font-semibold text-primary tabular-nums">
                      {enterprise.ratios.debtToEquity.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-tertiary">Leverage ratio</p>
                </div>
              </div>
            </div>
          </section>

          {/* Alerts */}
          {enterprise.alerts && enterprise.alerts.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-secondary">
                Alerts
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {enterprise.alerts.map((alert, i) => (
                  <div key={i} className={`rounded-lg p-4 ${alertClasses(alert.type)}`}>
                    <div className="flex items-start gap-2">
                      <AlertIcon type={alert.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">
                          {alert.category}
                        </p>
                        <p className="mt-0.5 text-sm font-medium">{alert.message}</p>
                        {alert.value !== undefined && alert.threshold !== undefined && (
                          <p className="mt-1 text-xs opacity-60">
                            {alert.value} / {alert.threshold}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Breakdowns */}
          <section>
            <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-secondary">
              Breakdowns
            </h2>
            <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
              {/* Product Categories */}
              {enterprise.breakdowns.productCategory.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <h3 className="mb-4 font-display text-sm font-semibold text-primary">
                    Product Categories
                  </h3>
                  <div className="space-y-4">
                    {enterprise.breakdowns.productCategory.map((cat, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-medium text-primary">{cat.category}</span>
                          <span className="text-xs text-secondary tabular-nums">
                            {formatPercent(cat.sharePercent)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-tertiary">
                          <span>{formatCurrency(cat.revenue)}</span>
                          <span
                            className={
                              cat.growthPercent >= 0
                                ? 'text-status-success-text'
                                : 'text-status-error-text'
                            }
                          >
                            {cat.growthPercent >= 0 ? '+' : ''}
                            {formatPercent(cat.growthPercent)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-highlight">
                          <div
                            className="h-full rounded-full bg-action-bg transition-all duration-500"
                            style={{ width: `${cat.sharePercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Geographic Regions */}
              {enterprise.breakdowns.geographicRegion.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <h3 className="mb-4 font-display text-sm font-semibold text-primary">
                    Geographic Regions
                  </h3>
                  <div className="space-y-4">
                    {enterprise.breakdowns.geographicRegion.map((reg, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-medium text-primary">{reg.region}</span>
                          <span className="text-xs text-secondary tabular-nums">
                            {formatPercent(reg.sharePercent)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-tertiary">
                          <span>{formatCurrency(reg.revenue)}</span>
                          <span
                            className={
                              reg.growthPercent >= 0
                                ? 'text-status-success-text'
                                : 'text-status-error-text'
                            }
                          >
                            {reg.growthPercent >= 0 ? '+' : ''}
                            {formatPercent(reg.growthPercent)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-highlight">
                          <div
                            className="h-full rounded-full bg-status-info-text/30 transition-all duration-500"
                            style={{ width: `${reg.sharePercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Segments */}
              {enterprise.breakdowns.customerSegment.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <h3 className="mb-4 font-display text-sm font-semibold text-primary">
                    Customer Segments
                  </h3>
                  <div className="space-y-4">
                    {enterprise.breakdowns.customerSegment.map((seg, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-medium text-primary">{seg.segment}</span>
                          <span className="text-xs text-secondary tabular-nums">
                            {formatPercent(seg.sharePercent)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-tertiary">
                          <span>{formatCurrency(seg.revenue)}</span>
                          <span
                            className={
                              seg.growthPercent >= 0
                                ? 'text-status-success-text'
                                : 'text-status-error-text'
                            }
                          >
                            {seg.growthPercent >= 0 ? '+' : ''}
                            {formatPercent(seg.growthPercent)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-highlight">
                          <div
                            className="h-full rounded-full bg-status-warning-text/30 transition-all duration-500"
                            style={{ width: `${seg.sharePercent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ResponsiveGrid>
          </section>
        </>
      )}
    </ResponsiveContainer>
  );
}
