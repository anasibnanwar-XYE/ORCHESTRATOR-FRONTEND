import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminApprovals, type AdminApprovalsResponse, type AdminApprovalItemDto } from '../lib/adminApi';
import clsx from 'clsx';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ResponsiveContainer, PageHeader, ResponsiveCard } from '../design-system';
import { formatDateTime } from '../lib/formatUtils';

export default function ApprovalsPage() {
  const { session, user } = useAuth();
  const [data, setData] = useState<AdminApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.some((r: string) => r.toLowerCase().includes('admin'));

  const loadApprovals = async () => {
    if (!session || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminApprovals(session);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [session]);

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-surface-highlight text-secondary';
    if (status === 'APPROVED' || status === 'POSTED') return 'bg-status-success-bg text-status-success-text';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'bg-status-error-bg text-status-error-text';
    return 'bg-status-warning-bg text-status-warning-text';
  };

  const getStatusIcon = (status?: string) => {
    if (status === 'APPROVED' || status === 'POSTED') {
      return <CheckCircleIcon className="h-5 w-5 text-status-success-text" />;
    }
    if (status === 'REJECTED' || status === 'CANCELLED') {
      return <XCircleIcon className="h-5 w-5 text-status-error-text" />;
    }
    return <ClockIcon className="h-5 w-5 text-status-warning-text" />;
  };

  const totalItems = (data?.creditRequests?.length ?? 0) + (data?.payrollRuns?.length ?? 0);

  const renderItem = (item: AdminApprovalItemDto) => (
    <ResponsiveCard key={`${item.type}-${item.id ?? item.publicId}`} padding="md">
      <div className="flex items-start gap-3">
        {getStatusIcon(item.status)}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-primary truncate">
              {item.reference || `#${item.publicId ?? item.id}`}
            </h3>
            <span
              className={clsx(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                getStatusColor(item.status)
              )}
            >
              {item.status ?? 'UNKNOWN'}
            </span>
          </div>
          {item.summary && (
            <p className="text-sm text-secondary">{item.summary}</p>
          )}
          <p className="text-xs text-tertiary">{formatDateTime(item.createdAt)}</p>
        </div>
      </div>
    </ResponsiveCard>
  );

  const renderSection = (title: string, items?: AdminApprovalItemDto[]) => {
    if (!items || items.length === 0) return null;
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">{title}</h3>
        <div className="space-y-3">
          {items.map(renderItem)}
        </div>
      </section>
    );
  };

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      <PageHeader
        title="Approvals"
        eyebrow="Administration"
        subtitle="Pending credit requests and payroll runs awaiting approval."
      />

      {error && (
        <div className="rounded-lg border border-transparent bg-status-error-bg p-4 text-sm text-status-error-text">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-surface p-6">
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-surface-highlight" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-surface-highlight" />
                  <div className="h-3 w-2/3 rounded bg-surface-highlight" />
                  <div className="h-3 w-1/4 rounded bg-surface-highlight" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : totalItems === 0 ? (
        <ResponsiveCard className="text-center py-12">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-tertiary" />
          <p className="mt-4 font-semibold text-primary">No pending approvals</p>
          <p className="mt-1 text-sm text-secondary">
            All credit requests and payroll runs have been processed.
          </p>
        </ResponsiveCard>
      ) : (
        <div className="space-y-8">
          {renderSection('Credit Requests', data?.creditRequests)}
          {renderSection('Payroll Runs', data?.payrollRuns)}
        </div>
      )}
    </ResponsiveContainer>
  );
}
