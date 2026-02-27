import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  listCreditRequests,
  createCreditRequest,
  approveCreditRequest,
  rejectCreditRequest,
  type CreditRequestDto,
  type CreditRequestPayload,
} from '../../lib/salesApi';
import { searchDealers, type DealerLookup } from '../../lib/accountingApi';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';

type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

function formatAmount(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(num);
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

export default function CreditRequestsPage() {
  const { session, user } = useAuth();

  const canApproveReject =
    user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_ACCOUNTING');

  const [requests, setRequests] = useState<CreditRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [dealerQuery, setDealerQuery] = useState('');
  const [dealerOptions, setDealerOptions] = useState<DealerLookup[]>([]);
  const [selectedDealer, setSelectedDealer] = useState<DealerLookup | null>(null);
  const [limit, setLimit] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Approve/Reject confirm dialog
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject';
    request: CreditRequestDto;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listCreditRequests(session);
      setRequests(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load credit requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.companyCode]);

  useEffect(() => {
    let active = true;
    if (!dealerQuery || !session) {
      setDealerOptions([]);
      return () => { active = false; };
    }
    const handle = setTimeout(() => {
      searchDealers(dealerQuery, session)
        .then((opts) => { if (active) setDealerOptions(opts); })
        .catch(() => undefined);
    }, 200);
    return () => { active = false; clearTimeout(handle); };
  }, [dealerQuery, session]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !selectedDealer) return;
    setSaving(true);
    setFormMessage(null);
    const payload: CreditRequestPayload = {
      dealerId: selectedDealer.id,
      amountRequested: Number(limit) || 0,
      reason: reason || undefined,
    };
    try {
      await createCreditRequest(payload, session);
      setFormMessage({ type: 'success', text: 'Credit request submitted successfully.' });
      setDealerQuery('');
      setSelectedDealer(null);
      setLimit('');
      setReason('');
      setShowForm(false);
      load();
    } catch (err) {
      setFormMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to submit' });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction || !session) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'approve') {
        await approveCreditRequest(confirmAction.request.id!, session);
      } else {
        await rejectCreditRequest(confirmAction.request.id!, session);
      }
      setConfirmAction(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${confirmAction.type} request`);
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'ALL') return true;
    return (r.status ?? '').toUpperCase() === activeTab;
  });

  const tabCounts: Record<FilterTab, number> = {
    ALL: requests.length,
    PENDING: requests.filter((r) => (r.status ?? '').toUpperCase() === 'PENDING').length,
    APPROVED: requests.filter((r) => (r.status ?? '').toUpperCase() === 'APPROVED').length,
    REJECTED: requests.filter((r) => (r.status ?? '').toUpperCase() === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-display text-primary">Credit Requests</h1>
          <p className="mt-1 text-sm text-secondary">
            Manage dealer credit limit requests and approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-primary shadow-sm hover:bg-surface-highlight transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setFormMessage(null); }}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition-all"
            style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
          >
            <PlusCircle className="h-4 w-4" />
            New Request
          </button>
        </div>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--status-error-bg)] bg-[var(--status-error-bg)] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-error-text)]" />
          <p className="text-sm text-[var(--status-error-text)]">{error}</p>
        </div>
      )}

      {/* New request form (collapsible) */}
      {showForm && (
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold font-display text-primary">New Credit Request</h2>

          {formMessage && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              formMessage.type === 'success'
                ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]'
                : 'bg-[var(--status-error-bg)] text-[var(--status-error-text)]'
            }`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Dealer search */}
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1 relative">
              <label className="block text-xs font-medium text-secondary">Dealer</label>
              <input
                value={dealerQuery}
                onChange={(e) => { setDealerQuery(e.target.value); setSelectedDealer(null); }}
                placeholder="Search dealer…"
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
              />
              {dealerOptions.length > 0 && !selectedDealer && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-auto rounded-lg border border-border bg-surface shadow-md">
                  {dealerOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className="block w-full px-3 py-2.5 text-left hover:bg-surface-highlight transition-colors"
                      onClick={() => {
                        setSelectedDealer(opt);
                        setDealerQuery(`${opt.name}${opt.code ? ` (${opt.code})` : ''}`);
                        setDealerOptions([]);
                      }}
                    >
                      <div className="text-sm font-medium text-primary">{opt.name}</div>
                      {opt.code && <div className="text-xs text-secondary">{opt.code}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Requested Limit</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="0"
                  className="h-10 w-full rounded-lg border border-border bg-surface pl-7 pr-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-secondary">Reason (optional)</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief justification"
                className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-primary outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-colors"
              />
            </div>

            {/* Submit */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving || !selectedDealer || !limit}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--action-primary-bg)', color: 'var(--action-primary-text)' }}
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                {saving ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'border-[var(--action-primary-bg)] text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            {tab.label}
            {tabCounts[tab.value] > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.value
                  ? 'bg-[var(--action-primary-bg)] text-[var(--action-primary-text)]'
                  : 'bg-surface-highlight text-secondary'
              }`}>
                {tabCounts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border">
              <div className="h-3 w-32 rounded bg-surface-highlight animate-pulse" />
              <div className="h-3 w-24 rounded bg-surface-highlight animate-pulse" />
              <div className="flex-1 h-3 rounded bg-surface-highlight animate-pulse" />
              <div className="h-3 w-16 rounded bg-surface-highlight animate-pulse" />
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16 shadow-sm">
          <div className="rounded-full bg-surface-highlight p-4 mb-4">
            <Clock className="h-7 w-7 text-secondary" />
          </div>
          <p className="text-sm font-medium text-primary">No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} requests found</p>
          <p className="mt-1 text-xs text-secondary">
            {activeTab === 'ALL'
              ? 'Submit a new credit request using the button above.'
              : `No requests with status "${activeTab}" at this time.`}
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
                    <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Dealer</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wide">Requested Limit</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Reason</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wide">Created</th>
                    {canApproveReject && (
                      <th className="px-5 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wide">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((r) => {
                    const isPending = (r.status ?? '').toUpperCase() === 'PENDING';
                    const amount = (r as { amountRequested?: number }).amountRequested ?? 0;
                    return (
                      <tr key={r.id} className="hover:bg-surface-highlight transition-colors">
                        <td className="px-5 py-4 font-medium text-primary">
                          {r.dealerName ?? `Dealer #${(r as Record<string, unknown>).dealerId ?? '—'}`}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-primary tabular-nums">
                          {formatAmount(amount)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={r.status ?? 'unknown'} />
                        </td>
                        <td className="px-5 py-4 text-secondary max-w-[200px] truncate">
                          {r.reason ?? '—'}
                        </td>
                        <td className="px-5 py-4 text-secondary whitespace-nowrap">
                          {formatDate(r.createdAt)}
                        </td>
                        {canApproveReject && (
                          <td className="px-5 py-4 text-right">
                            {isPending && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setConfirmAction({ type: 'approve', request: r })}
                                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:opacity-80 transition-opacity"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmAction({ type: 'reject', request: r })}
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
            {filteredRequests.map((r) => {
              const isPending = (r.status ?? '').toUpperCase() === 'PENDING';
              const amount = (r as { amountRequested?: number }).amountRequested ?? 0;
              return (
                <div key={r.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {r.dealerName ?? `Dealer #${(r as Record<string, unknown>).dealerId ?? '—'}`}
                       </p>
                       <p className="mt-0.5 text-xs text-secondary">{formatDate(r.createdAt)}</p>
                    </div>
                    <StatusBadge status={r.status ?? 'unknown'} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">Requested limit</span>
                    <span className="text-sm font-semibold text-primary tabular-nums">{formatAmount(amount)}</span>
                  </div>

                  {r.reason && (
                    <p className="text-xs text-secondary border-t border-border pt-2">{r.reason}</p>
                  )}

                  {canApproveReject && isPending && (
                    <div className="flex gap-2 border-t border-border pt-3">
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'approve', request: r })}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium bg-[var(--status-success-bg)] text-[var(--status-success-text)] hover:opacity-80 transition-opacity"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'reject', request: r })}
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

      {/* Approve confirm dialog */}
      <ConfirmDialog
        isOpen={confirmAction?.type === 'approve'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Approve Credit Request"
        description={confirmAction ? `Approve the credit request for ${confirmAction.request.dealerName ?? 'this dealer'}? This will increase their credit limit.` : ''}
        confirmLabel="Approve"
        variant="default"
        loading={actionLoading}
      />

      {/* Reject confirm dialog */}
      <ConfirmDialog
        isOpen={confirmAction?.type === 'reject'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
        title="Reject Credit Request"
        description={confirmAction ? `Reject the credit request for ${confirmAction.request.dealerName ?? 'this dealer'}? This action cannot be undone.` : ''}
        confirmLabel="Reject"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
