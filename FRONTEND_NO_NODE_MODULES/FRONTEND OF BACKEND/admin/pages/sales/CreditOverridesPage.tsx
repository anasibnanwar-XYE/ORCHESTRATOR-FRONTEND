import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  createCreditOverrideRequest,
  listCreditOverrideRequests,
  approveCreditOverride,
  rejectCreditOverride,
  type CreditLimitOverrideRequestDto,
  type CreditLimitOverrideRequestCreateRequest,
  type CreditLimitOverrideDecisionRequest,
} from '../../lib/salesApi';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  History,
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function formatAmount(value?: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

/**
 * Sales portal credit override request page.
 *
 * ROLE_SALES can only CREATE override requests.
 * Listing / approving / rejecting is restricted to ROLE_ADMIN | ROLE_ACCOUNTING.
 */
export default function CreditOverridesPage() {
  const { session, user } = useAuth();

  const canApproveReject =
    user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_ACCOUNTING');

  // History list state
  const [overrides, setOverrides] = useState<CreditLimitOverrideRequestDto[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreditLimitOverrideRequestCreateRequest>({
    dispatchAmount: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Approve/Reject dialog state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    item: CreditLimitOverrideRequestDto;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');

  const loadOverrides = useCallback(async () => {
    if (!session) return;
    setLoadingList(true);
    setListError(null);
    try {
      const list = await listCreditOverrideRequests(session);
      setOverrides(list);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to load override requests');
    } finally {
      setLoadingList(false);
    }
  }, [session]);

  useEffect(() => {
    loadOverrides();
  }, [loadOverrides]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((formData.dispatchAmount ?? 0) <= 0) {
      setFormError('Dispatch amount is required and must be greater than zero.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      await createCreditOverrideRequest(formData, session);
      setFormSuccess('Override request submitted. It will be reviewed by the accounting team.');
      setFormData({ dispatchAmount: 0 });
      setShowForm(false);
      loadOverrides();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !session) return;
    setActionLoading(true);
    try {
      const decision: CreditLimitOverrideDecisionRequest | undefined = decisionNote
        ? { notes: decisionNote } as CreditLimitOverrideDecisionRequest
        : undefined;

      if (confirmAction.type === 'approve') {
        await approveCreditOverride(confirmAction.item.id!, decision, session);
      } else {
        await rejectCreditOverride(confirmAction.item.id!, decision, session);
      }
      setConfirmAction(null);
      setDecisionNote('');
      loadOverrides();
    } catch (err) {
      setListError(err instanceof Error ? err.message : `Failed to ${confirmAction.type} override`);
      setConfirmAction(null);
      setDecisionNote('');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-display text-primary">Credit Override Requests</h1>
          <p className="mt-1 text-sm text-secondary">
            Submit and track credit limit override requests for dispatch approval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOverrides}
            disabled={loadingList}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingList ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess(''); }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-all"
            style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
          >
            {showForm ? <ChevronUp className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
            {showForm ? 'Hide Form' : 'New Override'}
          </button>
        </div>
      </div>

      {/* Global error */}
      {listError && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--status-error-bg)] bg-[var(--status-error-bg)] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-error-text)]" />
          <p className="text-sm text-[var(--status-error-text)]">{listError}</p>
        </div>
      )}

      {/* Create form (collapsible) */}
      {showForm && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-semibold font-display text-primary">Request Credit Override</h2>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg bg-[var(--status-error-bg)] px-4 py-3 text-sm text-[var(--status-error-text)]">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-4 rounded-lg bg-[var(--status-success-bg)] px-4 py-3 text-sm text-[var(--status-success-text)]">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Dealer ID</label>
              <input
                type="number"
                value={formData.dealerId ?? ''}
                onChange={(e) => setFormData({ ...formData, dealerId: e.target.value ? Number(e.target.value) : undefined })}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Sales Order ID</label>
              <input
                type="number"
                value={formData.salesOrderId ?? ''}
                onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value ? Number(e.target.value) : undefined })}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Packaging Slip ID</label>
              <input
                type="number"
                value={formData.packagingSlipId ?? ''}
                onChange={(e) => setFormData({ ...formData, packagingSlipId: e.target.value ? Number(e.target.value) : undefined })}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
                placeholder="Optional"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">
                Dispatch Amount <span className="text-[var(--status-error-text)]">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.dispatchAmount || ''}
                  onChange={(e) => setFormData({ ...formData, dispatchAmount: Number(e.target.value) })}
                  className="h-10 w-full rounded-lg border border-border bg-surface pl-7 pr-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
                  placeholder="Required"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Expires At</label>
              <input
                type="date"
                value={formData.expiresAt ?? ''}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value || undefined })}
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-secondary">Reason / Justification</label>
              <textarea
                value={formData.reason ?? ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value || undefined })}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors resize-none"
                placeholder="Justification for the override"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
              >
                {submitting ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <><PlusCircle className="h-4 w-4" /> Submit Request</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing override requests */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-secondary" />
          <h2 className="text-sm font-semibold font-display text-primary">Override Request History</h2>
          {overrides.length > 0 && (
            <span className="rounded-full bg-surface-highlight px-2 py-0.5 text-xs text-secondary">
              {overrides.length}
            </span>
          )}
        </div>

        {loadingList ? (
          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border">
                <div className="h-3 w-20 rounded bg-surface-highlight animate-pulse" />
                <div className="h-3 w-28 rounded bg-surface-highlight animate-pulse" />
                <div className="flex-1 h-3 rounded bg-surface-highlight animate-pulse" />
                <div className="h-3 w-16 rounded bg-surface-highlight animate-pulse" />
              </div>
            ))}
          </div>
        ) : overrides.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-14 shadow-sm">
            <div className="rounded-full bg-surface-highlight p-4 mb-4">
              <ShieldAlert className="h-7 w-7 text-secondary" />
            </div>
            <p className="text-sm font-medium text-primary">No override requests yet</p>
            <p className="mt-1 text-xs text-secondary">
              Submit a new override request to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-highlight">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">ID</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wide">Dispatch Amount</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Reason</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Created</th>
                      {canApproveReject && (
                        <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wide">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {overrides.map((item) => {
                      const isPending = (item.status ?? '').toUpperCase() === 'PENDING';
                      return (
                        <tr key={item.id} className="hover:bg-surface-highlight transition-colors">
                          <td className="px-5 py-4 font-mono text-xs text-secondary">#{item.id}</td>
                          <td className="px-5 py-4 text-right font-semibold text-primary tabular-nums">
                            {formatAmount(item.dispatchAmount)}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={item.status ?? 'unknown'} />
                          </td>
                          <td className="px-5 py-4 text-secondary max-w-[200px] truncate">
                            {item.reason ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-secondary whitespace-nowrap">
                            {formatDate(item.createdAt)}
                          </td>
                          {canApproveReject && (
                            <td className="px-5 py-4 text-right">
                              {isPending && (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setConfirmAction({ type: 'approve', item })}
                                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:opacity-80 transition-opacity"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmAction({ type: 'reject', item })}
                                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-error-bg)] text-[var(--status-error-text)] hover:opacity-80 transition-opacity"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {overrides.map((item) => {
                const isPending = (item.status ?? '').toUpperCase() === 'PENDING';
                return (
                  <div key={item.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-primary">{formatAmount(item.dispatchAmount)}</p>
                        <p className="mt-0.5 text-xs font-mono text-secondary">Request #{item.id}</p>
                      </div>
                      <StatusBadge status={item.status ?? 'unknown'} />
                    </div>

                    {item.reason && (
                      <p className="text-xs text-secondary">{item.reason}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-secondary">
                      <span>Created {formatDate(item.createdAt)}</span>
                    </div>

                    {canApproveReject && isPending && (
                      <div className="flex gap-2 border-t border-border pt-3">
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'approve', item })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:opacity-80 transition-opacity"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'reject', item })}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium bg-[var(--status-error-bg)] text-[var(--status-error-text)] hover:opacity-80 transition-opacity"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Approve confirm */}
      <ConfirmDialog
        isOpen={confirmAction?.type === 'approve'}
        onClose={() => { setConfirmAction(null); setDecisionNote(''); }}
        onConfirm={handleConfirmAction}
        title="Approve Credit Override"
        description={confirmAction
          ? `Approve override request #${confirmAction.item.id} for ${formatAmount(confirmAction.item.dispatchAmount)}?`
          : ''}
        confirmLabel="Approve"
        variant="default"
        loading={actionLoading}
      >
        <div className="mt-3 space-y-1.5">
          <label className="block text-xs font-medium text-secondary">Decision note (optional)</label>
          <textarea
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors resize-none"
            placeholder="Add a note for the requester…"
          />
        </div>
      </ConfirmDialog>

      {/* Reject confirm */}
      <ConfirmDialog
        isOpen={confirmAction?.type === 'reject'}
        onClose={() => { setConfirmAction(null); setDecisionNote(''); }}
        onConfirm={handleConfirmAction}
        title="Reject Credit Override"
        description={confirmAction
          ? `Reject override request #${confirmAction.item.id} for ${formatAmount(confirmAction.item.dispatchAmount)}? This action cannot be undone.`
          : ''}
        confirmLabel="Reject"
        variant="danger"
        loading={actionLoading}
      >
        <div className="mt-3 space-y-1.5">
          <label className="block text-xs font-medium text-secondary">Rejection reason (optional)</label>
          <textarea
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors resize-none"
            placeholder="Explain why this override is being rejected…"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
