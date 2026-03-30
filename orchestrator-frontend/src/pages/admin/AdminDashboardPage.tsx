/**
 * AdminDashboardPage
 *
 * Enterprise dashboard for the Admin portal.
 * Design follows DesignSystemBoard.tsx reference — QuickStat pattern.
 *
 * Sections:
 *  1. KPI QuickStat cards — from GET /portal/dashboard highlights, with mini SVG charts
 *  2. Content grid (3-col desktop):
 *     - Left 2-col: Pipeline stages
 *     - Right 1-col: Quick Actions + Activity Feed + Pending Items
 *
 * Data source:
 *  - GET /api/v1/portal/dashboard → { highlights, pipeline }
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCcw,
  UserPlus,
  Settings,
  Shield,
  CheckCircle2,
  Truck,
  Clock,
  MoreHorizontal,
  ArrowUpRight,
  Package,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { portalInsightsApi } from '@/lib/adminApi';
import type { PortalDashboard } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Mini Chart Component (matches DesignSystemBoard)
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
// QuickStat Card (matches DesignSystemBoard pattern)
// ─────────────────────────────────────────────────────────────────────────────

interface QuickStatProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  chartData: number[];
  chartColor: string;
  isLoading?: boolean;
  onClick?: () => void;
}

function QuickStat({ label, value, change, trend, chartData, chartColor, isLoading, onClick }: QuickStatProps) {
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
            <TrendingUp size={12} className="text-emerald-600" />
          ) : (
            <TrendingDown size={12} className="text-red-500" />
          )}
          <span className={`text-[11px] font-medium tabular-nums ${trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
            {change > 0 ? '+' : ''}{change}%
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

// ─────────────────────────────────────────────────────────────────────────────
// Activity Item (matches DesignSystemBoard pattern)
// ─────────────────────────────────────────────────────────────────────────────

function ActivityItem({
  icon,
  iconBg,
  title,
  subtitle,
  time,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex gap-3 py-3">
      <div className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">{title}</p>
        <p className="text-[12px] text-[var(--color-text-tertiary)] truncate">{subtitle}</p>
      </div>
      <span className="text-[11px] text-[var(--color-text-tertiary)] tabular-nums shrink-0 mt-0.5">{time}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pipeline Stage
// ─────────────────────────────────────────────────────────────────────────────

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
// Helpers — chart data per stat slot, routing by label
// ─────────────────────────────────────────────────────────────────────────────

const CHART_CONFIGS = [
  { data: [30, 45, 38, 52, 60, 55, 72, 68, 80], color: '#22c55e' },
  { data: [20, 30, 25, 35, 28, 42, 38, 45, 50], color: '#3b82f6' },
  { data: [50, 45, 48, 42, 38, 40, 35, 32, 30], color: '#ef4444' },
  { data: [40, 42, 45, 43, 48, 50, 52, 55, 58], color: '#8b5cf6' },
];

const TREND_CONFIGS: ('up' | 'down')[] = ['up', 'up', 'down', 'up'];
const CHANGE_VALUES = [12.3, 8.1, -4.2, 5.0];

function routeForHighlight(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('user')) return '/admin/users';
  if (l.includes('compan') || l.includes('tenant')) return '/admin/companies';
  if (l.includes('approval') || l.includes('pending')) return '/admin/approvals';
  return '/admin/portal-insights';
}

function pipelineIconForLabel(label: string): React.ReactNode {
  const l = label.toLowerCase();
  if (l.includes('dispatch') || l.includes('ship')) return <Truck size={14} />;
  if (l.includes('deliver') || l.includes('location')) return <MapPin size={14} />;
  return <Package size={14} />;
}

// Static fallback KPIs when backend is unavailable
const STATIC_KPIS = [
  { label: 'Total Users', value: '—', description: 'Manage accounts', route: '/admin/users' },
  { label: 'Total Companies', value: '—', description: 'Manage tenants', route: '/admin/companies' },
  { label: 'Pending Approvals', value: '—', description: 'Requires action', route: '/admin/approvals' },
  { label: 'System Status', value: 'Operational', description: 'All services running', route: '/admin/settings' },
];

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
  const pipelineStages =
    data?.pipeline && data.pipeline.length > 0
      ? data.pipeline
      : [
          { label: 'Orders', count: 0 },
          { label: 'Dispatch', count: 0 },
          { label: 'Delivery', count: 0 },
        ];

  // Derive KPI cards
  const kpiItems =
    data?.highlights && data.highlights.length > 0
      ? data.highlights.slice(0, 4)
      : STATIC_KPIS.map((k) => ({ label: k.label, value: k.value, detail: k.description }));

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
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

      {/* ── QuickStat Cards ──────────────────────────────────────────── */}
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
            isLoading={isLoading}
            onClick={
              data?.highlights
                ? () => navigate(routeForHighlight(item.label))
                : () => navigate(STATIC_KPIS[idx]?.route ?? '/admin')
            }
          />
        ))}
      </div>

      {/* ── Content Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2-col: Pipeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Pipeline stages */}
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                Order Pipeline
              </h2>
              <button
                type="button"
                onClick={() => navigate('/admin/portal-insights')}
                className="text-[12px] font-medium text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors"
              >
                View insights <ArrowUpRight size={12} />
              </button>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 p-3 rounded-lg bg-[var(--color-surface-secondary)] animate-pulse h-16" />
                    {i < 3 && (
                      <div className="w-3.5 h-3.5 rounded bg-[var(--color-surface-tertiary)] animate-pulse shrink-0" />
                    )}
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
          </div>


        </div>

        {/* Right 1-col */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  label: 'Users',
                  icon: <Users size={15} />,
                  bg: 'bg-blue-50 text-blue-600',
                  route: '/admin/users',
                },
                {
                  label: 'Approvals',
                  icon: <CheckSquare size={15} />,
                  bg: 'bg-emerald-50 text-emerald-600',
                  route: '/admin/approvals',
                },
                {
                  label: 'Roles',
                  icon: <Shield size={15} />,
                  bg: 'bg-purple-50 text-purple-600',
                  route: '/admin/roles',
                },
                {
                  label: 'Settings',
                  icon: <Settings size={15} />,
                  bg: 'bg-amber-50 text-amber-600',
                  route: '/admin/settings',
                },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => navigate(action.route)}
                  className="flex items-center gap-2.5 p-3 rounded-lg border border-[var(--color-border-default)] hover:bg-[var(--color-surface-tertiary)] active:bg-[var(--color-neutral-100)] transition-colors text-left"
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${action.bg}`}
                  >
                    {action.icon}
                  </div>
                  <span className="text-[12px] font-medium text-[var(--color-text-primary)]">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)]">Activity</h3>
              <button className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)] transition-colors">
                <MoreHorizontal size={14} />
              </button>
            </div>
            <div className="divide-y divide-[var(--color-border-subtle)]">
              <ActivityItem
                icon={<CheckCircle2 size={14} className="text-emerald-600" />}
                iconBg="bg-emerald-50"
                title="User created"
                subtitle="New account activated"
                time="2m"
              />
              <ActivityItem
                icon={<Truck size={14} className="text-blue-600" />}
                iconBg="bg-blue-50"
                title="Order dispatched"
                subtitle="Shipment confirmed"
                time="15m"
              />
              <ActivityItem
                icon={<UserPlus size={14} className="text-purple-600" />}
                iconBg="bg-purple-50"
                title="New company onboarded"
                subtitle="Account setup complete"
                time="1h"
              />
              <ActivityItem
                icon={<AlertCircle size={14} className="text-amber-600" />}
                iconBg="bg-amber-50"
                title="Approval pending"
                subtitle="Credit request waiting review"
                time="2h"
              />
              <ActivityItem
                icon={<Clock size={14} className="text-[var(--color-text-tertiary)]" />}
                iconBg="bg-[var(--color-surface-tertiary)]"
                title="Period close requested"
                subtitle="Requires admin action"
                time="3h"
              />
            </div>
          </div>

          {/* Pending Items */}
          <div className="bg-[var(--color-surface-primary)] rounded-xl border border-[var(--color-border-default)] p-4">
            <h3 className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-3">
              Pending Items
            </h3>
            <div className="space-y-2.5">
              {[
                {
                  label: 'Pending approvals',
                  count: data?.highlights?.find((h) =>
                    h.label.toLowerCase().includes('approval')
                  )?.value ?? '—',
                  color: 'bg-amber-500',
                },
                {
                  label: 'Total users',
                  count: data?.highlights?.find((h) =>
                    h.label.toLowerCase().includes('user')
                  )?.value ?? '—',
                  color: 'bg-[var(--color-neutral-400)]',
                },
                {
                  label: 'Companies',
                  count: data?.highlights?.find((h) =>
                    h.label.toLowerCase().includes('compan')
                  )?.value ?? '—',
                  color: 'bg-blue-500',
                },
                {
                  label: 'Export approvals',
                  count: '—',
                  color: 'bg-red-500',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-[12px] text-[var(--color-text-secondary)]">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[12px] font-semibold text-[var(--color-text-primary)] tabular-nums">
                    {isLoading ? '—' : item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
