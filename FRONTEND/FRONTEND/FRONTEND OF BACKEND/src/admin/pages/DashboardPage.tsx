import { useEffect, useState } from 'react';
import { adminApi } from '../lib/adminApi';
import { PageSkeleton } from '../components/ui/PageSkeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { ApprovalItem } from '@/shared/types';

interface DashboardStats {
  totalUsers: number;
  totalCompanies: number;
  pendingApprovals: number;
  recentApprovals: ApprovalItem[];
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="card p-5">
      <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-tertiary)]">
        {label}
      </p>
      <p className={`text-2xl font-semibold tabular-nums tracking-tight mt-1.5 ${accent || 'text-[var(--color-text-primary)]'}`}>
        {value}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const [users, companies, approvals] = await Promise.all([
          adminApi.getUsers(),
          adminApi.getCompanies(),
          adminApi.getApprovals(),
        ]);
        setStats({
          totalUsers: users.length,
          totalCompanies: companies.length,
          pendingApprovals: approvals.pending,
          recentApprovals: approvals.items.slice(0, 5),
        });
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="p-6"><PageSkeleton /></div>;
  }

  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Dashboard
        </h1>
        <p className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
          Overview of your workspace
        </p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="Users" value={stats?.totalUsers || 0} />
        <Stat label="Companies" value={stats?.totalCompanies || 0} />
        <Stat label="Pending" value={stats?.pendingApprovals || 0} />
        <Stat label="Status" value="Active" accent="text-emerald-600" />
      </div>

      {stats?.recentApprovals && stats.recentApprovals.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-[var(--color-border-default)]">
            <h2 className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              Recent approvals
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-border-subtle)]">
            {stats.recentApprovals.map((approval) => (
              <div key={`${approval.type}-${approval.id}`} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--color-text-primary)] truncate">
                    {approval.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-tertiary)] truncate mt-0.5">
                    {approval.reference} &mdash; {approval.summary}
                  </p>
                </div>
                <StatusBadge status={approval.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
