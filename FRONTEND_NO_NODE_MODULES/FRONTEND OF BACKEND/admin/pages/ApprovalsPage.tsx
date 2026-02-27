import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminApprovals, type AdminApprovalsResponse, type AdminApprovalItemDto } from '../lib/adminApi';
import { apiRequest } from '../lib/api';
import { ResponsiveContainer, PageHeader, ResponsiveCard } from '../design-system';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatDateTime } from '../lib/formatUtils';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  CreditCard,
  Banknote,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActionKind = 'approve' | 'reject';

interface PendingAction {
  item: AdminApprovalItemDto;
  kind: ActionKind;
  endpoint: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApprovalsPage() {
  const { session, user } = useAuth();
  const { addToast } = useToast();

  const [data, setData] = useState<AdminApprovalsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin =
    user?.roles?.includes('ROLE_ADMIN') ||
    user?.roles?.some((r: string) => r.toLowerCase().includes('admin'));

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadApprovals = useCallback(async () => {
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
  }, [session, isAdmin]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const initiateAction = (item: AdminApprovalItemDto, kind: ActionKind) => {
    const endpoint = kind === 'approve' ? item.approveEndpoint : item.rejectEndpoint;
    if (!endpoint) return;
    setPendingAction({ item, kind, endpoint });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      await apiRequest(pendingAction.endpoint, { method: 'POST' }, session);
      addToast({
        variant: 'success',
        title: pendingAction.kind === 'approve' ? 'Approved successfully' : 'Rejected successfully',
        description: `${pendingAction.item.reference ?? pendingAction.item.publicId ?? 'Item'} has been ${pendingAction.kind === 'approve' ? 'approved' : 'rejected'}.`,
      });
      setPendingAction(null);
      await loadApprovals();
    } catch (err) {
      addToast({
        variant: 'error',
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (!actionLoading) setPendingAction(null);
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const totalItems =
    (data?.creditRequests?.length ?? 0) + (data?.payrollRuns?.length ?? 0);

  const renderItem = (item: AdminApprovalItemDto) => {
    const key = `${item.type}-${item.id ?? item.publicId}`;
    const approveLabel = item.actionLabel ?? 'Approve';

    return (
      <ResponsiveCard key={key} padding="md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
          {/* Status icon */}
          <div className="flex-shrink-0 mt-0.5">
            {item.status === 'APPROVED' || item.status === 'POSTED' ? (
              <CheckCircle2 className="h-5 w-5 text-status-success-text" />
            ) : item.status === 'REJECTED' || item.status === 'CANCELLED' ? (
              <XCircle className="h-5 w-5 text-status-error-text" />
            ) : (
              <Clock className="h-5 w-5 text-status-warning-text" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-primary font-display truncate">
                {item.reference ?? `#${item.publicId ?? item.id}`}
              </h3>
              {item.status && <StatusBadge status={item.status} />}
              {item.sourcePortal && (
                <span className="text-xs text-tertiary border border-border rounded px-1.5 py-0.5">
                  {item.sourcePortal}
                </span>
              )}
            </div>

            {item.summary && (
              <p className="text-sm text-secondary leading-relaxed">{item.summary}</p>
            )}

            <p className="text-xs text-tertiary">{formatDateTime(item.createdAt)}</p>
          </div>

          {/* Actions */}
          {(item.approveEndpoint || item.rejectEndpoint) && (
            <div className="flex flex-row sm:flex-col gap-2 flex-shrink-0 sm:items-end">
              {item.approveEndpoint && (
                <button
                  type="button"
                  onClick={() => initiateAction(item, 'approve')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-status-success-bg px-3 py-1.5 text-xs font-semibold text-status-success-text transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {approveLabel}
                </button>
              )}
              {item.rejectEndpoint && (
                <button
                  type="button"
                  onClick={() => initiateAction(item, 'reject')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-status-error-bg px-3 py-1.5 text-xs font-semibold text-status-error-text transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      </ResponsiveCard>
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items?: AdminApprovalItemDto[],
  ) => {
    if (!items || items.length === 0) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-secondary">{icon}</span>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">
            {title}
          </h3>
          <span className="ml-auto rounded-full bg-surface-highlight px-2 py-0.5 text-xs font-medium text-secondary">
            {items.length}
          </span>
        </div>
        <div className="space-y-3">{items.map(renderItem)}</div>
      </section>
    );
  };

  // ---------------------------------------------------------------------------
  // Confirm dialog copy
  // ---------------------------------------------------------------------------

  const confirmTitle =
    pendingAction?.kind === 'approve' ? 'Confirm Approval' : 'Confirm Rejection';

  const confirmDescription =
    pendingAction?.kind === 'approve'
      ? `Approve "${pendingAction?.item.reference ?? pendingAction?.item.publicId}"? This action will be recorded.`
      : `Reject "${pendingAction?.item.reference ?? pendingAction?.item.publicId}"? This cannot be undone.`;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <ResponsiveContainer maxWidth="full" className="space-y-6">
      <PageHeader
        title="Approvals"
        eyebrow="Administration"
        subtitle="Pending credit requests and payroll runs awaiting review."
        actions={
          <button
            type="button"
            onClick={loadApprovals}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-highlight disabled:opacity-50"
            aria-label="Refresh approvals"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-transparent bg-status-error-bg p-4 text-sm text-status-error-text">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to load approvals</p>
            <p className="mt-0.5 text-xs opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label="Loading approvals">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-border bg-surface p-6"
            >
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
      )}

      {/* Empty state */}
      {!loading && !error && totalItems === 0 && (
        <EmptyState
          icon={CheckCircle2}
          title="No pending approvals"
          description="All credit requests and payroll runs have been processed."
        />
      )}

      {/* Content */}
      {!loading && totalItems > 0 && (
        <div className="space-y-8">
          {renderSection(
            'Credit Requests',
            <CreditCard className="h-4 w-4" />,
            data?.creditRequests,
          )}
          {renderSection(
            'Payroll Runs',
            <Banknote className="h-4 w-4" />,
            data?.payrollRuns,
          )}
        </div>
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={pendingAction !== null}
        onClose={handleCancelAction}
        onConfirm={handleConfirmAction}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={pendingAction?.kind === 'approve' ? (pendingAction.item.actionLabel ?? 'Approve') : 'Reject'}
        cancelLabel="Cancel"
        variant={pendingAction?.kind === 'reject' ? 'danger' : 'default'}
        loading={actionLoading}
      />
    </ResponsiveContainer>
  );
}
