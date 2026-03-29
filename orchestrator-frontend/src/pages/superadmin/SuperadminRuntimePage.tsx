 /**
  * SuperadminRuntimePage
  *
  * Platform runtime metrics and rate-limit policy management for superadmin.
  *
  * Sections:
  *  1. Runtime Metrics: API calls, storage, active sessions
  *  2. Runtime Policy: Rate-limit and concurrency limits, company-scoped
  *
  * Data sources:
  *  - GET /api/v1/admin/tenant-runtime/metrics  → TenantRuntimeMetrics (canonical read path)
  *  - GET /api/v1/superadmin/tenants            → company list for selector
  *  - PUT /api/v1/companies/{id}/tenant-runtime/policy → company-scoped policy update (canonical write path)
  */

import { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Server,
  HardDrive,
  Users,
  RefreshCcw,
  AlertCircle,
  Save,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { superadminRuntimeApi, superadminTenantsApi } from '@/lib/superadminApi';
import type { TenantRuntimeMetrics, TenantRuntimePolicyUpdateRequest } from '@/types';
import type { SuperAdminTenantDto } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

function formatMb(n: number): string {
  if (n >= 1024) return `${(n / 1024).toFixed(1)} GB`;
  return `${n} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric Card
// ─────────────────────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  usage?: number; // 0-100 percent bar
  accent?: 'default' | 'success' | 'warning' | 'error';
}

function MetricCard({ label, value, sublabel, icon, usage, accent = 'default' }: MetricCardProps) {
  const accentMap = {
    default: 'text-[var(--color-text-tertiary)] bg-[var(--color-surface-tertiary)]',
    success: 'text-[var(--color-success)] bg-[var(--color-success-bg)]',
    warning: 'text-[var(--color-warning)] bg-[var(--color-warning-bg)]',
    error: 'text-[var(--color-error)] bg-[var(--color-error-bg)]',
  };
  const barAccent = {
    default: 'bg-[var(--color-neutral-900)]',
    success: 'bg-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]',
    error: 'bg-[var(--color-error)]',
  };

  return (
    <div className="p-4 bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <span className={clsx('p-2 rounded-lg', accentMap[accent])}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-[var(--color-text-primary)]">{value}</p>
      {sublabel && (
        <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">{sublabel}</p>
      )}
      {usage !== undefined && (
        <div className="mt-3 h-1.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-500', barAccent[accent])}
            style={{ width: `${Math.min(usage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Runtime Metrics Section
// ─────────────────────────────────────────────────────────────────────────────

function MetricsSection() {
  const [data, setData] = useState<TenantRuntimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Canonical read path: GET /api/v1/admin/tenant-runtime/metrics
      const result = await superadminRuntimeApi.getRuntimeMetrics();
      setData(result);
    } catch {
      setError('Failed to load runtime metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 animate-pulse bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl">
            <Skeleton width={32} height={32} className="rounded-lg mb-3" />
            <Skeleton width="60%" height={28} />
            <Skeleton width="40%" height={12} className="mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
        <AlertCircle size={16} className="shrink-0" />
        <span>{error || 'Failed to load runtime metrics.'}</span>
        <button type="button" onClick={load} className="ml-auto flex items-center gap-1.5 text-[12px] hover:opacity-80">
          <RefreshCcw size={13} /> Retry
        </button>
      </div>
    );
  }

  const apiUsagePct = data.apiCallsLimit
    ? (data.apiCalls / data.apiCallsLimit) * 100
    : undefined;
  const storageUsagePct = data.storageLimit
    ? (data.storageUsedMb / data.storageLimit) * 100
    : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard
        label="API Calls"
        value={formatNumber(data.apiCalls)}
        sublabel={data.apiCallsLimit ? `of ${formatNumber(data.apiCallsLimit)} allowed` : data.period}
        icon={<Activity size={16} />}
        usage={apiUsagePct}
        accent={apiUsagePct !== undefined && apiUsagePct > 85 ? 'warning' : 'default'}
      />
      <MetricCard
        label="Storage Used"
        value={formatMb(data.storageUsedMb)}
        sublabel={data.storageLimit ? `of ${formatMb(data.storageLimit)} total` : undefined}
        icon={<HardDrive size={16} />}
        usage={storageUsagePct}
        accent={storageUsagePct !== undefined && storageUsagePct > 85 ? 'warning' : 'default'}
      />
      <MetricCard
        label="Active Sessions"
        value={formatNumber(data.activeSessions)}
        sublabel="Currently active"
        icon={<Users size={16} />}
        accent="default"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Runtime Policy Section (company-scoped)
// ─────────────────────────────────────────────────────────────────────────────

function RuntimePolicySection() {
  const { toast } = useToast();

  // Company list
  const [companies, setCompanies] = useState<SuperAdminTenantDto[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  // Policy for selected company
  const [metrics, setMetrics] = useState<TenantRuntimeMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Draft policy form
  const [draft, setDraft] = useState<TenantRuntimePolicyUpdateRequest>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load company list on mount
  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const list = await superadminTenantsApi.listTenants();
      setCompanies(list);
      if (list.length > 0) {
        setSelectedCompanyId(list[0].companyId);
      }
    } catch {
      // Companies list load failure is non-blocking; show empty state
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  useEffect(() => { void loadCompanies(); }, [loadCompanies]);

  // Load company-specific policy when selected company changes
  const loadMetrics = useCallback(async () => {
    if (!selectedCompanyId) return;
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      // Company-specific read: GET /api/v1/companies/{id}/tenant-runtime/policy
      const result = await superadminRuntimeApi.getCompanyRuntimePolicy(selectedCompanyId);
      setMetrics(result);
      setDraft({
        maxActiveUsers: result.maxActiveUsers,
        maxRequestsPerMinute: result.maxRequestsPerMinute,
        maxConcurrentRequests: result.maxConcurrentRequests,
      });
    } catch {
      setMetrics(null);
      setMetricsError('Failed to load policy for this company.');
    } finally {
      setMetricsLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { void loadMetrics(); }, [loadMetrics]);

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Canonical write path: PUT /api/v1/companies/{id}/tenant-runtime/policy
      const updated = await superadminRuntimeApi.updateRuntimePolicy(selectedCompanyId, draft);
      setMetrics(updated);
      setDraft({
        maxActiveUsers: updated.maxActiveUsers,
        maxRequestsPerMinute: updated.maxRequestsPerMinute,
        maxConcurrentRequests: updated.maxConcurrentRequests,
      });
      toast({ title: 'Runtime policy updated', type: 'success' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update policy';
      setSaveError(msg);
      toast({ title: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const selectedTenant = companies.find((c) => c.companyId === selectedCompanyId);

  return (
    <div className="space-y-4">
      {/* Company selector */}
      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium text-[var(--color-text-primary)]">
          Target Company
        </label>
        {companiesLoading ? (
          <Skeleton width="100%" height={36} className="rounded-lg" />
        ) : (
          <select
            value={selectedCompanyId ?? ''}
            onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
            className={clsx(
              'w-full h-9 rounded-lg border border-[var(--color-border-default)] px-3',
              'text-[13px] text-[var(--color-text-primary)] bg-[var(--color-surface-primary)]',
              'focus:outline-none focus:ring-1 focus:ring-[var(--color-neutral-900)]',
            )}
          >
            {companies.map((c) => (
              <option key={c.companyId} value={c.companyId}>
                {c.companyName} ({c.companyCode})
              </option>
            ))}
          </select>
        )}
        {selectedTenant && (
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            Status: {selectedTenant.status}
          </p>
        )}
      </div>

      {/* Policy fields */}
      <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-default)] rounded-xl divide-y divide-[var(--color-border-subtle)]">
        {metricsLoading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton width="40%" height={14} />
                <Skeleton width={80} height={36} className="rounded-lg" />
              </div>
            ))}
          </div>
        ) : metricsError ? (
          <div className="flex items-center gap-3 p-4 bg-[var(--color-error-bg)] text-[var(--color-error)] text-[13px]">
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1">{metricsError}</span>
            <button
              type="button"
              onClick={() => void loadMetrics()}
              className="flex items-center gap-1 text-[12px] hover:opacity-80"
            >
              <RefreshCcw size={12} /> Retry
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3.5 gap-4">
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  Max Active Users
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  Maximum number of concurrently active user accounts
                  {metrics ? ` (current: ${metrics.enabledUsers})` : ''}
                </p>
              </div>
              <div className="shrink-0 w-28">
                <Input
                  type="number"
                  value={String(draft.maxActiveUsers ?? '')}
                  onChange={(e) => setDraft({ ...draft, maxActiveUsers: e.target.value ? Number(e.target.value) : undefined })}
                  min="1"
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3.5 gap-4">
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  Max Requests per Minute
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  API rate limit per minute
                  {metrics ? ` (current: ${metrics.requestsThisMinute})` : ''}
                </p>
              </div>
              <div className="shrink-0 w-28">
                <Input
                  type="number"
                  value={String(draft.maxRequestsPerMinute ?? '')}
                  onChange={(e) => setDraft({ ...draft, maxRequestsPerMinute: e.target.value ? Number(e.target.value) : undefined })}
                  min="1"
                  placeholder="e.g. 1000"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3.5 gap-4">
              <div>
                <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  Max Concurrent Requests
                </p>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  Maximum in-flight requests at any instant
                  {metrics ? ` (current: ${metrics.inFlightRequests})` : ''}
                </p>
              </div>
              <div className="shrink-0 w-28">
                <Input
                  type="number"
                  value={String(draft.maxConcurrentRequests ?? '')}
                  onChange={(e) => setDraft({ ...draft, maxConcurrentRequests: e.target.value ? Number(e.target.value) : undefined })}
                  min="1"
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            {saveError && (
              <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-error-bg)] text-[var(--color-error)]">
                <AlertCircle size={14} className="shrink-0" />
                <p className="text-[12px]">{saveError}</p>
              </div>
            )}

            <div className="flex justify-end px-4 py-3.5">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={saving}
                disabled={!selectedCompanyId}
                leftIcon={<Save size={14} />}
              >
                Save Runtime Policy
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export function SuperadminRuntimePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">Platform Runtime</h1>
        <p className="mt-0.5 text-[13px] text-[var(--color-text-tertiary)]">
          Platform-wide usage metrics and company runtime policy configuration.
        </p>
      </div>

      {/* Runtime Metrics */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Server size={15} className="text-[var(--color-text-tertiary)]" />
          <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">Runtime Metrics</h2>
        </div>
        <MetricsSection />
      </section>

      {/* Runtime Policy */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={15} className="text-[var(--color-text-tertiary)]" />
          <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">Runtime Policy</h2>
        </div>
        <p className="text-[12px] text-[var(--color-text-tertiary)] mb-4">
          Configure rate-limit and concurrency settings for a specific company.
        </p>
        <RuntimePolicySection />
      </section>
    </div>
  );
}
