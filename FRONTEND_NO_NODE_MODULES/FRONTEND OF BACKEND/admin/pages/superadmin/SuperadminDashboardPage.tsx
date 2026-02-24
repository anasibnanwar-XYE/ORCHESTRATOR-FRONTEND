import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Building2, ShieldCheck, Users, Activity, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../design-system/PageHeader';
import { listTenants, listPlatformRoles, listPlatformUsers } from '../../lib/superadminApi';
import type { CompanyDto } from '../../lib/superadminApi';
import type { RoleDto } from '../../lib/superadminApi';

interface PlatformMetric {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}

function MetricSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface p-5 animate-pulse">
      <div className="h-3 w-20 rounded bg-surface-highlight mb-3" />
      <div className="h-7 w-16 rounded bg-surface-highlight mb-2" />
      <div className="h-3 w-32 rounded bg-surface-highlight" />
    </div>
  );
}

export default function SuperadminDashboardPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<CompanyDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tenantData, roleData, userData] = await Promise.allSettled([
          listTenants(session),
          listPlatformRoles(session),
          listPlatformUsers(session),
        ]);
        if (cancelled) return;
        if (tenantData.status === 'fulfilled') setTenants(Array.isArray(tenantData.value) ? tenantData.value : []);
        if (roleData.status === 'fulfilled') setRoles(Array.isArray(roleData.value) ? roleData.value : []);
        if (userData.status === 'fulfilled') {
          const users = userData.value;
          setUserCount(Array.isArray(users) ? users.length : 0);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load platform data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [session]);

  const metrics = useMemo<PlatformMetric[]>(() => [
    {
      label: 'Tenants',
      value: String(tenants.length),
      detail: tenants.length === 1 ? '1 registered tenant' : `${tenants.length} registered tenants`,
      icon: <Building2 className="h-5 w-5" />,
    },
    {
      label: 'Platform Roles',
      value: String(roles.length),
      detail: 'Defined across all tenants',
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      label: 'Total Users',
      value: String(userCount),
      detail: 'Across all tenant orgs',
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Platform Status',
      value: 'Healthy',
      detail: 'All systems operational',
      icon: <Activity className="h-5 w-5" />,
    },
  ], [tenants.length, roles.length, userCount]);

  const quickActions = [
    { label: 'Manage Tenants', to: '/superadmin/tenants', description: 'Tenant registry, lifecycle, and policy.' },
    { label: 'Platform Roles', to: '/superadmin/roles', description: 'Role definitions and permission governance.' },
    { label: 'Audit Trail', to: '/superadmin/audit', description: 'Control-plane event log and history.' },
  ];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Control Plane"
        title={`${greeting}, Platform`}
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      />

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-transparent bg-status-error-bg px-4 py-3">
          <p className="text-sm text-status-error-text">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-border bg-surface p-5 transition-colors hover:bg-surface-highlight"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-secondary">{m.label}</span>
                <span className="text-secondary">{m.icon}</span>
              </div>
              <p className="text-2xl font-semibold tracking-tight text-primary">{m.value}</p>
              <p className="mt-1 text-xs text-tertiary">{m.detail}</p>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wider text-secondary mb-4">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.to}
              type="button"
              onClick={() => navigate(action.to)}
              className={clsx(
                'group flex flex-col border border-border bg-surface',
                'px-5 py-6 text-left transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                'hover:bg-surface-highlight'
              )}
            >
              <h3 className="text-base font-semibold text-primary">{action.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary">{action.description}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-secondary group-hover:text-primary">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Tenants */}
      {!loading && tenants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium uppercase tracking-wider text-secondary">Recent Tenants</h2>
            <button
              type="button"
              onClick={() => navigate('/superadmin/tenants')}
              className="text-xs font-medium text-secondary hover:text-primary transition-colors"
            >
              View all
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {/* Desktop table */}
            <div className="hidden lg:block">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-surface-highlight">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tenants.slice(0, 5).map((t: any) => (
                    <tr key={t.id ?? t.companyCode} className="hover:bg-surface-highlight/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-primary">{t.name ?? t.companyName ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-surface-highlight px-2.5 py-1 text-xs font-medium text-primary">
                          {t.companyCode ?? t.code ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary">{t.id ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-border">
              {tenants.slice(0, 5).map((t: any) => (
                <div key={t.id ?? t.companyCode} className="px-4 py-4">
                  <p className="text-sm font-medium text-primary">{t.name ?? t.companyName ?? '—'}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-surface-highlight px-2.5 py-0.5 text-xs font-medium text-primary">
                      {t.companyCode ?? t.code ?? '—'}
                    </span>
                    <span className="text-xs text-secondary">ID: {t.id ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
